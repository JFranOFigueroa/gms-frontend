import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapPlan } from '@/api/mappers'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'
export const usePlanStore = defineStore('plans', {
  state: () => ({ allPlans: [] }),
  getters: {
    plans: (s) => s.allPlans.filter((p) => p.branchId === useBranchesStore().activeBranchId),
    activePlans() {
      return this.plans.filter((p) => p.active)
    },
  },
  actions: {
    async load(branch = useBranchesStore().activeBranchId) {
      if (!branch) {
        this.allPlans = []
        return
      }
      const rows = await useIntegrationStore().track('planes', () => api.plans.list(branch))
      if (branch === useBranchesStore().activeBranchId) this.allPlans = rows.map(mapPlan)
    },
  },
})
