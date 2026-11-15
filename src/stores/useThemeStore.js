import { defineStore } from 'pinia'
import { themePresets } from '@/config/themePresets'
import { api } from '@/api/service'
import { useIntegrationStore } from './useIntegrationStore'

export const useThemeStore = defineStore('theme', {
  state: () => ({ selectedPreset: null }),
  getters: {
    currentTheme: (s) => themePresets.find((p) => p.id === s.selectedPreset) || themePresets[0],
  },
  actions: {
    async load() {
      const cfg = await useIntegrationStore().track('tema', () => api.site.settings.get())
      this.selectedPreset = cfg.themePreset || cfg.theme_preset || null
    },
    async applyPreset(preset) {
      const cfg = await useIntegrationStore().track('tema', () =>
        api.site.settings.update({ themePreset: preset.id }),
      )
      this.selectedPreset = cfg.themePreset || preset.id
    },
  },
})
