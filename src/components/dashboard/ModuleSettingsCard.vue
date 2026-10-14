<script setup>
import { computed } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import { useModuleStore } from '@/stores/useModuleStore'
import { moduleRegistry, modulePresets } from '@/config/moduleRegistry'

const moduleStore = useModuleStore()

const presets = [
  { id: 'traditional', label: 'Tradicional' },
  { id: 'crossfit', label: 'CrossFit / Clases' },
  { id: 'mixed', label: 'Mixto' },
]

const activePreset = computed(() => {
  const { calendar, routines } = moduleStore.modules

  if (calendar && routines) return 'mixed'
  if (calendar && !routines) return 'crossfit'
  if (!calendar && routines) return 'traditional'

  return null
})

const applyPreset = (presetId) => {
  moduleStore.applyPreset(presetId)
}
</script>

<template>
  <BaseCard>
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-black">Módulos del gimnasio</h2>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Activa o desactiva funcionalidades según el tipo de gimnasio
        </p>
      </div>

      <div class="space-y-4">
        <div
          v-for="module in moduleRegistry"
          :key="module.id"
          class="flex items-center justify-between gap-4 p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50"
        >
          <div>
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ module.icon }}</span>

              <h3 class="text-xl font-bold">
                {{ module.label }}
              </h3>
            </div>

            <p class="text-[var(--color-text-secondary)] text-sm mt-1">
              {{ module.description }}
            </p>
          </div>

          <BaseButton
            variant="secondary"
            @click="moduleStore.toggleModule(module.id)"
            :class="{
              '!border-[var(--color-primary)]': moduleStore.isModuleEnabled(module.id),
            }"
          >
            {{ moduleStore.isModuleEnabled(module.id) ? 'Activo' : 'Inactivo' }}
          </BaseButton>
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-sm text-[var(--color-text-secondary)]">Modo rápido</p>

        <div class="flex flex-wrap gap-3">
          <BaseButton
            v-for="preset in presets"
            :key="preset.id"
            variant="secondary"
            @click="applyPreset(preset.id)"
            :class="{
              '!border-[var(--color-primary)]': activePreset === preset.id,
            }"
          >
            {{ preset.label }}
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
</template>