<script setup>
import { themePresets } from '@/config/themePresets'

import { useThemeStore } from '@/stores/useThemeStore'

import ThemePreviewCard from './theme/ThemePreviewCard.vue'

const themeStore = useThemeStore()

const selectPreset = async (preset) => {
  try {
    await themeStore.applyPreset(preset)
  } catch (e) {
    alert(e.message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-xl font-black sm:text-2xl">Temas Recomendados</h2>

      <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
        Selecciona una identidad visual para tu gimnasio
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
