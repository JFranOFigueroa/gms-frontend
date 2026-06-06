<script setup>
import { themePresets } from '@/config/themePresets'

import { useThemeStore } from '@/stores/useThemeStore'

import ThemePreviewCard from './theme/ThemePreviewCard.vue'

const themeStore = useThemeStore()

const selectPreset = (preset) => {
  console.log('Preset seleccionado:', preset)

  themeStore.applyPreset(preset)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-black">Temas Recomendados</h2>

      <p class="text-[var(--color-text-secondary)] mt-2">
        Selecciona una identidad visual para tu gimnasio
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <ThemePreviewCard
        v-for="preset in themePresets"
        :key="preset.id"
        :preset="preset"
        :selected="themeStore.selectedPreset === preset.id"
        @select="selectPreset(preset)"
      />
    </div>
  </div>
</template>
