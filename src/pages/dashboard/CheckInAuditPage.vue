<script setup>
import { computed, ref, watch } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import CheckinDevicesPanel from '@/components/dashboard/CheckinDevicesPanel.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { useGymsStore } from '@/stores/useGymsStore'

const checkinStore = useCheckinStore()
const gyms = useGymsStore()
const auth = useAuthStore()
const canManageDevices = computed(
  () =>
    auth.isAuthenticated &&
    Boolean(gyms.activeGymId) &&
    (auth.user?.platformAdmin === true || auth.role === 'owner'),
)
const auditError = ref('')
// Los indicadores son los intentos del DÍA según backend, no aforo actual.
const stats = computed(() =>
  checkinStore.checkinStats
    ? {
        today: checkinStore.checkinStats.total,
        granted: checkinStore.checkinStats.granted,
        denied: checkinStore.checkinStats.denied,
        total: checkinStore.checkinStats.total,
      }
    : { today: '—', granted: '—', denied: '—', total: '—' },
)
const hourly = computed(() => checkinStore.checkinStats?.byHour || [])
watch(
  () => gyms.activeGymId,
  async (gym) => {
    checkinStore.checkinStats = null
    auditError.value = ''
    if (!gym) return
    const dateParts = new Intl.DateTimeFormat('en', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date())
    const val = (type) => dateParts.find((p) => p.type === type)?.value
    const day = `${val('year')}-${val('month')}-${val('day')}`
    const results = await Promise.allSettled([
      checkinStore.load(gym),
      checkinStore.loadStats(gym, { from: day, to: day }),
    ])
    if (gym !== gyms.activeGymId) return
    if (results.some((r) => r.status === 'rejected'))
      auditError.value = 'No se pudieron cargar todos los registros de acceso.'
  },
  { immediate: true },
)
const recent = computed(() => checkinStore.checkins.slice(0, 30))
const methodLabel = (method) =>
  ({ manual: 'En recepción', kiosk_qr: 'Código QR', kiosk_code: 'Código personal' })[method] ||
  'Registro de acceso'
const reasonLabel = (reason) =>
  ({
    granted: 'Acceso permitido',
    expired: 'Membresía vencida',
    no_payment: 'Pago pendiente',
    inactive: 'Membresía inactiva',
    duplicate: 'Acceso ya registrado',
  })[reason] || ''
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-black">Auditoría de Check-in</h1>

      <p class="text-[var(--color-text-secondary)] mt-2">
        Registro de accesos concedidos y denegados para control operativo
      </p>
    </div>

    <p v-if="auditError" role="alert" class="text-sm text-red-400">{{ auditError }}</p>
    <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Intentos hoy</p>

        <h3 class="text-5xl font-black mt-4">
          {{ stats.today }}
        </h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Concedidos hoy</p>

        <h3 class="text-5xl font-black mt-4 text-emerald-400">
          {{ stats.granted }}
        </h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Denegados hoy</p>

        <h3 class="text-5xl font-black mt-4 text-red-400">
          {{ stats.denied }}
        </h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Registros de hoy</p>

        <h3 class="text-5xl font-black mt-4">
          {{ stats.total }}
        </h3>
      </BaseCard>
    </div>

    <CheckinDevicesPanel
      v-if="canManageDevices"
      :key="gyms.activeGymId"
      :gym-id="gyms.activeGymId"
      :gym-slug="gyms.activeGym?.slug || ''"
    />

    <div v-if="hourly.length" class="space-y-2">
      <p class="text-sm text-[var(--color-text-secondary)]">
        Intentos por hora (horario del gimnasio)
      </p>
      <div class="flex flex-wrap gap-3 text-sm">
        <span
          v-for="hour in hourly"
          :key="hour.hour"
          class="rounded-lg border border-[var(--color-border)] px-3 py-2"
        >
          {{ hour.hour }} · {{ hour.granted }} concedidos / {{ hour.denied }} denegados
        </span>
      </div>
    </div>

    <BaseCard>
      <div class="space-y-4">
        <h2 class="text-2xl font-bold">Últimos accesos</h2>

        <div v-if="!recent.length" class="text-[var(--color-text-secondary)]">
          No hay check-ins registrados
        </div>

        <div
          v-for="checkin in recent"
          :key="checkin.id"
          class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
        >
          <div>
            <p class="font-semibold">
              {{ checkin.userName }}

              <span
                class="ml-2 rounded-full px-2 py-1 text-xs font-semibold"
                :class="
                  checkin.allowed === false
                    ? 'bg-red-500/15 text-red-400'
                    : 'bg-emerald-500/15 text-emerald-400'
                "
              >
                {{ checkin.allowed === false ? 'Denegado' : 'Concedido' }}
              </span>
            </p>

            <p class="text-sm text-[var(--color-text-secondary)]">
              {{ methodLabel(checkin.method)
              }}<span v-if="reasonLabel(checkin.reason)"> · {{ reasonLabel(checkin.reason) }}</span>
            </p>
          </div>

          <div class="text-sm text-[var(--color-text-secondary)]">
            {{ new Date(checkin.timestamp).toLocaleString() }}
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
