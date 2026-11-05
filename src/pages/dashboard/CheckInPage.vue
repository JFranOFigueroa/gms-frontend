<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { useMemberStore } from '@/stores/useMemberStore'
import { useGymsStore } from '@/stores/useGymsStore'

const authStore = useAuthStore()
const checkinStore = useCheckinStore()
const memberStore = useMemberStore()
const gyms = useGymsStore()
const loadError = ref('')
const manualToken = ref('')
const scannerStatus = ref('El acceso con QR todavía no está disponible.')
const scannerRunning = ref(false)
const videoRef = ref(null)
const member = computed(() => memberStore.ownMember?.gymId === gyms.activeGymId ? memberStore.ownMember : null)
watch(() => gyms.activeGymId, async (gym) => {
  if(!gym) return
  loadError.value=''
  const results=await Promise.allSettled([memberStore.loadMine(gym),checkinStore.loadMine(gym)])
  const failure=results.find(r=>r.status==='rejected')
  if(failure && gyms.activeGymId===gym)loadError.value=failure.reason?.message||'No fue posible cargar tu información'
}, {immediate:true})
const accessStatus = computed(() => member.value ? memberStore.getAccessStatus(member.value) : null)
const userCheckins = computed(() => member.value ? checkinStore.ownCheckins : [])
function startScanner() { scannerStatus.value = 'El escaneo todavía no está disponible.' }
function stopScanner() { scannerRunning.value = false }
function manualCheckIn() { scannerStatus.value = 'El registro por QR todavía no está disponible.' }
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-black">Check-in</h1>

      <p class="text-[var(--color-text-secondary)] mt-2">
        Consulta tu membresía y tu historial de accesos.
      </p>
    </div>

    <p v-if="loadError" role="alert" class="text-sm text-red-400">{{ loadError }}</p>
    <BaseCard v-if="member">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[var(--color-text-secondary)]">Estado de membresía</p>

          <p class="text-2xl font-black mt-1">
            {{ member.name }}
          </p>

          <p class="text-sm text-[var(--color-text-secondary)] mt-1">
            Código {{ member.code }} · Próximo pago: {{ member.nextPaymentDate }}
          </p>
        </div>

        <span
          class="rounded-full px-3 py-1 text-sm font-semibold"
          :class="
            accessStatus?.allowed
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          "
        >
          {{ accessStatus?.allowed ? 'Acceso habilitado' : accessStatus?.reason }}
        </span>
      </div>
    </BaseCard>

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
            <BaseInput v-model="manualToken" placeholder="O escribe el código de acceso" />

            <BaseButton variant="secondary" class="w-full" @click="manualCheckIn">
              Validar código
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
            Datos de ocupación no disponibles
          </span>
        </div>

        <div class="space-y-2">
          <div class="h-4 w-full overflow-hidden rounded-full bg-[var(--color-surface)]/60">
            <div
              class="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
              :style="{ width: '0%' }"
            />
          </div>

          <p class="text-[var(--color-text-secondary)]">
            Todavía no hay información de ocupación disponible.
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

        <div class="flex h-48 items-center justify-center rounded-2xl border border-[var(--color-border)] text-center text-[var(--color-text-secondary)]">
          La información por hora no está disponible por el momento.
        </div>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="space-y-4">
        <h2 class="text-2xl font-bold">Mis check-ins</h2>

        <div v-if="!userCheckins.length" class="text-[var(--color-text-secondary)]">
          Todavía no hay accesos registrados en este gimnasio.
        </div>

        <div v-for="checkin in userCheckins" :key="checkin.id" class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p class="font-semibold">
              {{ new Date(checkin.timestamp).toLocaleString() }}
            </p>

            <p class="text-sm text-[var(--color-text-secondary)]">
              Método: {{ checkin.method }} ·
              {{ checkin.allowed === false ? `Denegado: ${checkin.reason}` : 'Concedido' }}
            </p>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>