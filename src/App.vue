<script setup>
import { onMounted, watch } from 'vue'
import { useThemeStore } from '@/stores/useThemeStore'

const themeStore = useThemeStore()

const applyTheme = () => {
  const theme = themeStore.currentTheme

  Object.entries(theme.colors).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--color-${key}`, value)
  })
}

onMounted(() => {
  applyTheme()
})

watch(
  () => themeStore.selectedPreset,
  () => {
    applyTheme()
  },
)
</script>

<template>
  <RouterView />
</template>
