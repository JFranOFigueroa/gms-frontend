import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'

export const useClassScheduleStore = defineStore(
  'class-schedule',

  {
    state: () => ({
      allClasses: [],
    }),

    persist: {
      key: 'gms-class-schedule-v2',
    },

    getters: {
      classes(state) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        return state.allClasses.filter((gymClass) => {
          return gymClass.gymId == null || gymClass.gymId === activeGymId
        })
      },
    },

    actions: {
      addClass(payload) {
        const gymsStore = useGymsStore()

        this.allClasses.push({
          id: Date.now(),
          gymId: gymsStore.activeGymId,
          ...payload,
        })
      },

      removeClass(id) {
        this.allClasses = this.allClasses.filter((c) => c.id !== id)
      },
    },
  },
)
