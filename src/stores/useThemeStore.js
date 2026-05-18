import { defineStore } from 'pinia'
import defaultTheme from '@/themes/defaultTheme'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: defaultTheme,
  }),

  actions: {
    setTheme(theme) {
      this.currentTheme = theme
    },
  },
})
