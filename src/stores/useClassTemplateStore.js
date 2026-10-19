import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'

export const useClassTemplateStore = defineStore(
  'class-templates',

  {
    state: () => ({
      allTemplates: [
        {
          id: 1,

          gymId: 1,

          name: 'Full Body',

          color: '#22c55e',

          duration: 60,

          capacity: 20,

          category: 'functional',
        },
      ],
    }),

    persist: {
      key: 'gms-class-templates-v2',
    },

    getters: {
      templates(state) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        return state.allTemplates.filter((template) => {
          return template.gymId == null || template.gymId === activeGymId
        })
      },
    },

    actions: {
      addTemplate(template) {
        const gymsStore = useGymsStore()

        this.allTemplates.push({
          id: Date.now(),

          gymId: gymsStore.activeGymId,

          ...template,
        })
      },

      removeTemplate(id) {
        this.allTemplates = this.allTemplates.filter((t) => t.id !== id)
      },
    },
  },
)
