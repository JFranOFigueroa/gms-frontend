import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapRoutine } from '@/api/mappers'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'
export const useRoutineStore = defineStore('routines', {
  state: () => ({ allRoutines: [] }),
  getters: {
    routines: (s) => s.allRoutines.filter((r) => r.branchId === useBranchesStore().activeBranchId),
    publishedRoutines() {
      return this.routines.filter((r) => r.published)
    },
  },
  actions: {
    async load(branch = useBranchesStore().activeBranchId) {
      if (!branch) {
        this.allRoutines = []
        return
      }
      const rows = await useIntegrationStore().track('rutinas', () => api.routines.list(branch))
      if (branch === useBranchesStore().activeBranchId) this.allRoutines = rows.map(mapRoutine)
    },
    async addRoutine(payload) {
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('rutinas', () =>
        api.routines.create(branch, { ...payload, published: payload.published ?? false }),
      )
      this.allRoutines.push(mapRoutine(row))
      return row
    },
    async updateRoutine(id, payload) {
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('rutinas', () =>
        api.routines.update(branch, id, payload),
      )
      this.allRoutines = this.allRoutines.map((r) => (r.id === id ? mapRoutine(row) : r))
      return row
    },
    async removeRoutine(id) {
      const branch = useBranchesStore().activeBranchId
      await useIntegrationStore().track('rutinas', () => api.routines.remove(branch, id))
      this.allRoutines = this.allRoutines.filter((r) => r.id !== id)
    },
  },
})
