import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { useIntegrationStore } from './useIntegrationStore'
import { useBranchesStore } from './useBranchesStore'
import { todayISO } from '@/utils/date'
export const useDashboardSummaryStore = defineStore('dashboard-summary', {
  state: () => ({ branchId: null, data: null, loading: false, error: '' }),
  actions: {
    clear() {
      this.branchId = null
      this.data = null
      this.error = ''
      this.loading = false
    },
    async load(branch = useBranchesStore().activeBranchId, from = todayISO(), to = from) {
      if (!branch) {
        this.clear()
        return
      }
      this.branchId = branch
      this.data = null
      this.loading = true
      this.error = ''
      try {
        const data = await useIntegrationStore().track('resumen', () =>
          api.dashboard.summary(branch, { from, to }),
        )
        if (this.branchId === branch) this.data = data
        return data
      } catch (error) {
        if (this.branchId === branch) this.error = error.message
        throw error
      } finally {
        if (this.branchId === branch) this.loading = false
      }
    },
  },
})
