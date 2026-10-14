<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

const authStore = useAuthStore()
const checkinStore = useCheckinStore()
const scheduleStore = useClassScheduleStore()

const manualToken = ref('')

const todayISO = new Date().toISOString().split('T')[0]

const gymCapacity = computed(() => {
  const total = scheduleStore.classes
    .filter((gymClass) => gymClass.date === todayISO)
    .reduce((sum, gymClass) => sum + (Number(gymClass.capacity) || 0), 0)

  return total > 0 ? total : 100
})

const occupancyPercent = computed(() => {
  return Math.min(100, Math.round((checkinStore.todaysCheckins.length / gymCapacity.value) * 100))
})

const hourlyCounts = computed(() => {
  const counts = Array.from({ length: 24 }, () => 0)

  checkinStore.todaysCheckins.forEach((checkin) => {
    const hour = new Date(checkin.timestamp).getHours()
    counts[hour] += 1
  })

  return counts
})

const maxHourlyCount = computed(() => {
  return Math.max(1, ...hourlyCounts.value)
})
const scannerStatus = ref('')
const scannerRunning = ref(false)
const videoRef = ref(null)

const scannerSupported = computed(() => typeof window !== 'undefined' && 'BarcodeDetector' in window)

let mediaStream = null
let animationFrame = null
let detector = null

const userCheckins = computed(() => {
  return checkinStore.checkins.filter((checkin) => checkin.userId === authStore.user?.id)
})

const processToken = (token) => {
  if (!checkinStore.validateToken(token)) {
    scannerStatus.value = 'Código QR inválido o expirado'
    return
  }

  const result = checkinStore.checkIn({
    userId: authStore.user?.id,
    userName: authStore.user?.name,
    role: authStore.role,
    method: 'qr',
    token,
  })

  scannerStatus.value = result.ok
    ? 'Check-in registrado con QR'
    : result.reason
}

const manualCheckIn = () => {
  processToken(manualToken.value.trim())

  manualToken.value = ''
}

const stopScanner = () => {
  scannerRunning.value = false

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }
}

const scanFrame = async () => {
  if (!scannerRunning.value || !videoRef.value || videoRef.value.readyState < 2 || !detector) {
    animationFrame = requestAnimationFrame(scanFrame)
    return
  }

  try {
    const codes = await detector.detect(videoRef.value)

    if (codes.length) {
      processToken(codes[0].rawValue)
      stopScanner()
      return
    }
  } catch {
    // Keep scanning; transient detection errors are expected.
  }

  animationFrame = requestAnimationFrame(scanFrame)
}

const startScanner = async () => {
  if (!scannerSupported.value) {
    scannerStatus.value = 'Este navegador no soporta escaneo automático. Ingresa el token manualmente.'
    return
  }

  stopScanner()

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
      },
    })

    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
      await videoRef.value.play()
    }

    detector = new BarcodeDetector({ formats: ['qr_code'] })
    scannerRunning.value = true
    scannerStatus.value = 'Escaneando código QR...'
    animationFrame = requestAnimationFrame(scanFrame)
  } catch {
    scannerStatus.value = 'No se pudo acceder a la cámara. Ingresa el token manualmente.'
    stopScanner()
  }
}

onBeforeUnmount(() => {
  stopScanner()
})
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-black">Check-in</h1>

      <p class="text-[var(--color-text-secondary)] mt-2">
        Registra tu llegada al gimnasio
      </p>
    </div>

    <div class="grid gap-6">
      <BaseCard>
        <div class="space-y-5">
          <h2 class="text-2xl font-bold">Escanear QR de acceso</h2>

          <p class="text-[var(--color-text-secondary)]">
            Apunta la cámara al código QR mostrado en el acceso del gimnasio.
          </p>

          <video
            ref="videoRef"
            class="w-full rounded-2xl bg-[var(--color-background)] aspect-video object-cover"
            playsinline
            muted
          />

          <div class="flex flex-wrap gap-3">
            <BaseButton variant="secondary" @click="startScanner" :disabled="scannerRunning">
              Iniciar escaneo
            </BaseButton>

            <BaseButton variant="secondary" @click="stopScanner" :disabled="!scannerRunning">
              Detener
            </BaseButton>
          </div>

          <p v-if="scannerStatus" class="text-[var(--color-text-secondary)]">
            {{ scannerStatus }}
          </p>

          <div class="space-y-3">
            <BaseInput v-model="manualToken" placeholder="O ingresa el token QR manualmente" />

            <BaseButton variant="secondary" class="w-full" @click="manualCheckIn">
              Validar token
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseCard>
      <div class="space-y-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-2xl font-bold">Ocupación en vivo</h2>

          <span class="text-sm text-[var(--color-text-secondary)]">
            {{ checkinStore.todaysCheckins.length }} / {{ gymCapacity }} personas
          </span>
        </div>

        <div class="space-y-2">
          <div class="h-4 w-full overflow-hidden rounded-full bg-[var(--color-surface)]/60">
            <div
              class="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
              :style="{ width: `${occupancyPercent}%` }"
            />
          </div>

          <p class="text-[var(--color-text-secondary)]">
            {{ occupancyPercent }}% de ocupación actual
          </p>
        </div>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-2xl font-bold">Ocupación por hora</h2>

          <p class="text-sm text-[var(--color-text-secondary)]">
            Registros de hoy
          </p>
        </div>

        <div class="flex h-48 items-end gap-1">
          <div
            v-for="(count, hour) in hourlyCounts"
            :key="hour"
            class="flex flex-1 flex-col items-center gap-1"
          >
            <div
              class="w-full rounded-t-md bg-[var(--color-primary)]/70 transition-all duration-300"
              :style="{
                height: `${Math.max(4, (count / maxHourlyCount) * 100)}%`,
              }"
              :title="`${hour}:00 - ${count} check-ins`"
            />

            <span v-if="hour % 3 === 0" class="text-[10px] text-[var(--color-text-secondary)]">
              {{ hour }}h
            </span>
          </div>
        </div>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="space-y-4">
        <h2 class="text-2xl font-bold">Mis check-ins</h2>

        <div v-if="!userCheckins.length" class="text-[var(--color-text-secondary)]">
          Aún no tienes check-ins registrados
        </div>

        <div v-for="checkin in userCheckins" :key="checkin.id" class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p class="font-semibold">
              {{ new Date(checkin.timestamp).toLocaleString() }}
            </p>

            <p class="text-sm text-[var(--color-text-secondary)]">
              Método: {{ checkin.method }}
            </p>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>