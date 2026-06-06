import { defineStore } from 'pinia'
import { themePresets } from '@/config/themePresets'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    selectedPreset: 'crossfit-dark',
  }),

  persist: true,

  getters: {
    currentTheme(state) {
      return themePresets.find((preset) => preset.id === state.selectedPreset) || themePresets[0]
    },
  },

  actions: {
    applyPreset(preset) {
      this.selectedPreset = preset.id
    },
  },
})
