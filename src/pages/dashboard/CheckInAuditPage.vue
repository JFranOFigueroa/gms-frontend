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
        Registro de llegadas para dashboards y control operativo
      </p>
    </div>

    <div class="grid gap-6 md:grid-cols-2">
      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Check-ins hoy</p>

        <h3 class="text-5xl font-black mt-4">
          {{ stats.today }}
        </h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Check-ins totales</p>

        <h3 class="text-5xl font-black mt-4">
          {{ stats.total }}
        </h3>
      </BaseCard>
    </div>

    <BaseCard>
      <div class="space-y-4">
        <h2 class="text-2xl font-bold">Últimos check-ins</h2>

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
            </p>

            <p class="text-sm text-[var(--color-text-secondary)]">
              {{ checkin.role }} · {{ checkin.method }}
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