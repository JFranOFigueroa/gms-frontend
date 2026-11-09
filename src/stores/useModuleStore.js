import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { asModuleMap } from '@/api/mappers'
import { moduleRegistry, modulePresets } from '@/config/moduleRegistry'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'
export const useModuleStore = defineStore('modules', {
  state: () => ({
    modules: { calendar: false, routines: false, checkin: false, pos: false },
    loaded: false,
  }),
  getters: { enabledModules: (s) => Object.keys(s.modules).filter((k) => s.modules[k]) },
  actions: {
    async load(gym = useGymsStore().activeGymId) {
      if (!gym) {
        this.modules = {}
        this.loaded = false
        return
      }
      const data = await useIntegrationStore().track('módulos', () => api.settings.modules(gym))
      if (useGymsStore().activeGymId === gym) {
        this.modules = asModuleMap(data)
        this.loaded = true
      }
    },
    ensureModule(id) {
      if (!(id in this.modules)) this.modules[id] = false
    },
    isModuleEnabled(id) {
      return this.modules[id] === true
    },
    async setModule(id, enabled) {
      if (!moduleRegistry.some((m) => m.id === id))
        throw new Error('No es posible cambiar esta opción.')
      const gym = useGymsStore().activeGymId
      const rows = await useIntegrationStore().track('módulos', () =>
        api.settings.updateModule(gym, id, enabled),
      )
      this.modules = asModuleMap(rows)
    },
    async toggleModule(id) {
      return this.setModule(id, !this.isModuleEnabled(id))
    },
    async applyPreset(id) {
      const preset = modulePresets[id]
      if (!preset) return
      for (const [key, enabled] of Object.entries(preset)) {
        if (moduleRegistry.some((m) => m.id === key) && this.modules[key] !== enabled)
          await this.setModule(key, enabled)
      }
    },
  },
})
