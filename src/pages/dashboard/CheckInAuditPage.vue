<script setup>
import { computed } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'

import { useCheckinStore } from '@/stores/useCheckinStore'

const checkinStore = useCheckinStore()

const stats = computed(() => checkinStore.stats)

const recent = computed(() => checkinStore.checkins.slice(0, 30))
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-black">Auditoría de Check-in</h1>

      <p class="text-[var(--color-text-secondary)] mt-2">
        Registro de accesos concedidos y denegados para control operativo
      </p>
    </div>

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
        <p class="text-[var(--color-text-secondary)]">Registros totales</p>

        <h3 class="text-5xl font-black mt-4">
          {{ stats.total }}
        </h3>
      </BaseCard>
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
              {{ checkin.role }} · {{ checkin.method }} · {{ checkin.reason }}
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
