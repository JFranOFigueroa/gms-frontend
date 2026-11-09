import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapRoutine } from '@/api/mappers'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'
export const useRoutineStore = defineStore('routines', {
  state: () => ({ allRoutines: [] }),
  getters: {
    routines: (s) => s.allRoutines.filter((r) => r.gymId === useGymsStore().activeGymId),
    publishedRoutines() {
      return this.routines.filter((r) => r.published)
    },
  },
  actions: {
    async load(gym = useGymsStore().activeGymId) {
      if (!gym) {
        this.allRoutines = []
        return
      }
      const rows = await useIntegrationStore().track('rutinas', () => api.routines.list(gym))
      if (gym === useGymsStore().activeGymId) this.allRoutines = rows.map(mapRoutine)
    },
    async addRoutine(payload) {
      const gym = useGymsStore().activeGymId
      const row = await useIntegrationStore().track('rutinas', () =>
        api.routines.create(gym, { ...payload, published: payload.published ?? false }),
      )
      this.allRoutines.push(mapRoutine(row))
      return row
    },
    async updateRoutine(id, payload) {
      const gym = useGymsStore().activeGymId
      const row = await useIntegrationStore().track('rutinas', () =>
        api.routines.update(gym, id, payload),
      )
      this.allRoutines = this.allRoutines.map((r) => (r.id === id ? mapRoutine(row) : r))
      return row
    },
    async removeRoutine(id) {
      const gym = useGymsStore().activeGymId
      await useIntegrationStore().track('rutinas', () => api.routines.remove(gym, id))
      this.allRoutines = this.allRoutines.filter((r) => r.id !== id)
    },
  },
})
