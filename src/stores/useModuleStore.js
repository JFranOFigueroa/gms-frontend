import { defineStore } from 'pinia'

import { modulePresets, moduleRegistry } from '@/config/moduleRegistry'

const defaultEnabled = (id) => {
  return moduleRegistry.find((module) => module.id === id)?.defaultEnabled === true
}

export const useModuleStore = defineStore(
  'modules',

  {
    state: () => ({
      modules: {
        calendar: false,

        routines: true,

        checkin: true,

        users: true,

        pos: true,
      },
    }),

    persist: true,

    getters: {
      enabledModules(state) {
        const result = { ...state.modules }

        moduleRegistry.forEach((module) => {
          if (!(module.id in result)) {
            result[module.id] = module.defaultEnabled === true
          }
        })

        return Object.entries(result)
          .filter(([, enabled]) => enabled)
          .map(([id]) => id)
      },
    },

    actions: {
      ensureModule(id) {
        if (!(id in this.modules)) {
          this.modules[id] = defaultEnabled(id)
        }
      },

      setModule(id, enabled) {
        this.ensureModule(id)

        this.modules[id] = enabled
      },

      toggleModule(id) {
        this.ensureModule(id)

        this.modules[id] = !this.modules[id]
      },

      isModuleEnabled(id) {
        if (!(id in this.modules)) {
          return defaultEnabled(id)
        }

        return this.modules[id] === true
      },

      applyPreset(presetId) {
        const preset = modulePresets[presetId]

        if (!preset) return

        Object.entries(preset).forEach(([id, enabled]) => {
          this.setModule(id, enabled)
        })
      },
    },
  },
)