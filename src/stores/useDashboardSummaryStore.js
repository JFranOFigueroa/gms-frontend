import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { useIntegrationStore } from './useIntegrationStore'
import { useGymsStore } from './useGymsStore'
import { todayISO } from '@/utils/date'
export const useDashboardSummaryStore = defineStore('dashboard-summary', {
  state: () => ({ gymId: null, data: null, loading: false, error: '' }),
  actions: {
    clear() {
      this.gymId = null
      this.data = null
      this.error = ''
      this.loading = false
    },
    async load(gym = useGymsStore().activeGymId, from = todayISO(), to = from) {
      if (!gym) {
        this.clear()
        return
      }
      this.gymId = gym
      this.data = null
      this.loading = true
      this.error = ''
      try {
        const data = await useIntegrationStore().track('resumen', () =>
          api.dashboard.summary(gym, { from, to }),
        )
        if (this.gymId === gym) this.data = data
        return data
      } catch (error) {
        if (this.gymId === gym) this.error = error.message
        throw error
      } finally {
        if (this.gymId === gym) this.loading = false
      }
    },
  },
})
