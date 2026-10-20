<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { RouterLink } from 'vue-router'

import QRCode from 'qrcode'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import { useCheckinStore } from '@/stores/useCheckinStore'
import { useMemberStore } from '@/stores/useMemberStore'
import { useTenantStore } from '@/stores/useTenantStore'

const checkinStore = useCheckinStore()
const memberStore = useMemberStore()
const tenantStore = useTenantStore()

const manualCode = ref('')
const scannerStatus = ref('')
const scannerRunning = ref(false)
const videoRef = ref(null)

const result = ref(null)
const qrImage = ref('')
const tokenText = ref('')
const remainingSeconds = ref(10)
const qrExpiresAt = ref(0)

const gymName = computed(() => tenantStore.gym?.name || 'GMS FITNESS')
const scannerSupported = computed(() => typeof window !== 'undefined' && 'BarcodeDetector' in window)
const todayLabel = computed(() =>
  new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)

const recentAccesses = computed(() => checkinStore.todaysCheckins.slice(0, 8))

const stats = computed(() => checkinStore.stats)

let mediaStream = null
let animationFrame = null
let detector = null
let qrRefreshInterval = null
let countdownInterval = null
let resultTimeout = null

const showResult = (payload) => {
  result.value = {
    ...payload,
    timestamp: new Date(),
  }

  if (resultTimeout) clearTimeout(resultTimeout)

  resultTimeout = setTimeout(() => {
    result.value = null
  }, 7000)
}

const processMemberCode = (code) => {
  const member = memberStore.findByCode(code)
  const access = checkinStore.registerAccess({ member, method: 'member-code' })

  showResult({
    allowed: access.allowed,
    reason: access.reason,
    member,
  })

  return access
}

const submitCode = () => {
  const code = manualCode.value.trim()

  if (!code) {
    scannerStatus.value = 'Ingresa el código del miembro'
    return
  }

  processMemberCode(code)
  manualCode.value = ''
  scannerStatus.value = ''
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

  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.srcObject = null
  }
}

const scanFrame = async () => {
  if (!scannerRunning.value) return

  if (!videoRef.value || videoRef.value.readyState < 2 || !detector) {
    animationFrame = requestAnimationFrame(scanFrame)
    return
  }

  try {
    const codes = await detector.detect(videoRef.value)

    if (!scannerRunning.value) return

    if (codes.length) {
      processMemberCode(codes[0].rawValue)
      stopScanner()
      scannerStatus.value = 'Credencial escaneada'
      return
    }
  } catch {
    // Keep scanning; transient detection errors are expected.
  }

  if (!scannerRunning.value) return

  animationFrame = requestAnimationFrame(scanFrame)
}

const startScanner = async () => {
  if (!scannerSupported.value) {
    scannerStatus.value =
      'Este navegador no soporta escaneo automático. Ingresa el código del miembro manualmente.'
    return
  }

  stopScanner()

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })

    if (!videoRef.value) {
      mediaStream.getTracks().forEach((track) => track.stop())
      mediaStream = null
      return
    }

    videoRef.value.srcObject = mediaStream
    await videoRef.value.play()

    detector = new BarcodeDetector({ formats: ['qr_code'] })
    scannerRunning.value = true
    scannerStatus.value = 'Escaneando credencial...'
    animationFrame = requestAnimationFrame(scanFrame)
  } catch {
    scannerStatus.value = 'No se pudo acceder a la cámara. Ingresa el código manualmente.'
    stopScanner()
  }
}

const refreshQr = async () => {
  const { token, expiresAt } = checkinStore.generateToken()

  tokenText.value = token
  qrExpiresAt.value = expiresAt
  remainingSeconds.value = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('gms-kiosk-token', JSON.stringify({ token, expiresAt }))
  }

  try {
    qrImage.value = await QRCode.toDataURL(token, {
      width: 280,
      margin: 1,
      color: { dark: '#111111', light: '#ffffff' },
    })
  } catch {
    qrImage.value = ''
  }
}

const startQrRotation = () => {
  refreshQr()

  qrRefreshInterval = setInterval(refreshQr, 10000)
  countdownInterval = setInterval(() => {
    remainingSeconds.value = Math.max(0, Math.ceil((qrExpiresAt.value - Date.now()) / 1000))
  }, 1000)
}

const stopQrRotation = () => {
  if (qrRefreshInterval) clearInterval(qrRefreshInterval)
  if (countdownInterval) clearInterval(countdownInterval)

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('gms-kiosk-token')
  }
}

onMounted(() => {
  startQrRotation()
})

onBeforeUnmount(() => {
  stopScanner()
  stopQrRotation()

  if (resultTimeout) clearTimeout(resultTimeout)
})
</script>

<template>
  <div class="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
    <div class="mx-auto max-w-7xl px-6 py-8 space-y-8">
      <!-- Header -->
      <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-4xl font-black">{{ gymName }}</h1>

            <span class="rounded-full bg-[var(--color-primary)]/15 px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
              Kiosco de acceso
            </span>
          </div>

          <p class="text-[var(--color-text-secondary)] mt-2 capitalize">
            {{ todayLabel }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <RouterLink to="/">
            <BaseButton variant="secondary"> Ir al inicio </BaseButton>
          </RouterLink>

          <RouterLink to="/auth/login">
            <BaseButton variant="secondary"> Iniciar sesión </BaseButton>
          </RouterLink>
        </div>
      </header>

      <!-- Stats -->
      <div class="grid gap-4 sm:grid-cols-3">
        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Intentos hoy</p>
          <h2 class="text-4xl font-black mt-2">{{ stats.today }}</h2>
        </BaseCard>

        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Concedidos hoy</p>
          <h2 class="text-4xl font-black mt-2 text-emerald-400">{{ stats.granted }}</h2>
        </BaseCard>

        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Denegados hoy</p>
          <h2 class="text-4xl font-black mt-2 text-red-400">{{ stats.denied }}</h2>
        </BaseCard>
      </div>

      <!-- Result -->
      <div
        v-if="result"
        class="rounded-3xl border p-6"
        :class="
          result.allowed
            ? 'border-emerald-500/50 bg-emerald-500/10'
            : 'border-red-500/50 bg-red-500/10'
        "
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-4">
            <span class="text-6xl leading-none">{{ result.allowed ? '✅' : '⛔' }}</span>

            <div>
              <p
                class="text-3xl font-black"
                :class="result.allowed ? 'text-emerald-400' : 'text-red-400'"
              >
                {{ result.allowed ? 'Acceso concedido' : 'Acceso denegado' }}
              </p>

              <p class="text-lg mt-1">
                {{ result.member?.name || 'Credencial no reconocida' }}
              </p>

              <p class="text-[var(--color-text-secondary)] mt-1">
                {{ result.reason }}
              </p>

              <p v-if="result.member?.nextPaymentDate" class="text-sm text-[var(--color-text-secondary)] mt-1">
                Próximo pago: {{ result.member.nextPaymentDate }}
              </p>
            </div>
          </div>

          <p class="text-sm text-[var(--color-text-secondary)]">
            {{ result.timestamp.toLocaleTimeString() }}
          </p>
        </div>
      </div>

      <!-- Two methods -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Member credential -->
        <BaseCard>
          <div class="space-y-5">
            <div>
              <h2 class="text-2xl font-bold">Credencial del miembro</h2>

              <p class="text-[var(--color-text-secondary)] mt-1">
                Ingresa el código del miembro o escanea el QR de su credencial.
              </p>
            </div>

            <div class="flex flex-col gap-3 sm:flex-row">
              <BaseInput v-model="manualCode" placeholder="Ej. M-1001 o correo" @keyup.enter="submitCode" />

              <BaseButton class="sm:w-auto w-full" @click="submitCode"> Validar </BaseButton>
            </div>

            <video
              ref="videoRef"
              class="w-full rounded-2xl bg-[var(--color-background)] aspect-video object-cover"
              playsinline
              muted
            />

            <div class="flex flex-wrap gap-3">
              <BaseButton variant="secondary" :disabled="scannerRunning" @click="startScanner">
                Escanear credencial
              </BaseButton>

              <BaseButton variant="secondary" :disabled="!scannerRunning" @click="stopScanner">
                Detener cámara
              </BaseButton>
            </div>

            <p v-if="scannerStatus" class="text-sm text-[var(--color-text-secondary)]">
              {{ scannerStatus }}
            </p>

            <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 text-sm text-[var(--color-text-secondary)]">
              <p class="font-semibold text-[var(--color-text)]">Reglas de acceso</p>
              <p class="mt-1">Se concede acceso si la cuenta está activa y el pago no está vencido.</p>
              <p>Se deniega si el miembro está desactivado, no existe o su pago caducó.</p>
            </div>
          </div>
        </BaseCard>

        <!-- Rotating QR -->
        <BaseCard>
          <div class="space-y-5">
            <div>
              <h2 class="text-2xl font-bold">QR para la app del miembro</h2>

              <p class="text-[var(--color-text-secondary)] mt-1">
                El miembro escanea este código desde su cuenta para registrar su llegada.
              </p>
            </div>

            <div class="flex justify-center">
              <div class="rounded-3xl bg-white p-4">
                <img
                  v-if="qrImage"
                  :src="qrImage"
                  alt="QR rotativo de check-in"
                  class="h-64 w-64"
                />

                <div v-else class="h-64 w-64 flex items-center justify-center text-black">
                  Generando QR...
                </div>
              </div>
            </div>

            <p class="text-center text-[var(--color-text-secondary)]">
              El código cambia en
              <span class="font-bold text-[var(--color-text)]">{{ remainingSeconds }}s</span>
            </p>

            <p class="text-center text-sm text-[var(--color-text-secondary)]">
              Abre la app, entra a Check-in y escanea este código.
            </p>

            <p class="text-center text-xs text-[var(--color-text-secondary)] break-all">
              Token manual: {{ tokenText }}
            </p>
          </div>
        </BaseCard>
      </div>

      <!-- Recent accesses -->
      <BaseCard>
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-2xl font-bold">Últimos accesos</h2>

            <span class="text-sm text-[var(--color-text-secondary)]">
              {{ recentAccesses.length }} registro(s)
            </span>
          </div>

          <p v-if="!recentAccesses.length" class="text-[var(--color-text-secondary)]">
            Aún no hay accesos registrados hoy.
          </p>

          <div
            v-for="access in recentAccesses"
            :key="access.id"
            class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p
                class="font-semibold"
                :class="access.allowed === false ? 'text-red-400' : 'text-emerald-400'"
              >
                {{ access.allowed === false ? 'Acceso denegado' : 'Acceso concedido' }}
              </p>

              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ access.method === 'member-code' ? 'Credencial' : 'QR' }}
              </p>
            </div>

            <p class="text-sm text-[var(--color-text-secondary)]">
              {{ new Date(access.timestamp).toLocaleTimeString() }}
            </p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
