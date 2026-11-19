import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'

const normalize = (row) => ({
  id: row.id,
  branchId: row.branchId,
  name: row.name,
  description: row.description || '',
  price: Number(row.price),
  durationDays: Number(row.durationDays),
  isActive: row.isActive === true,
})

// Este catálogo administrativo NO sustituye a membership_plans ni a /payments.
export const useAdminPlanStore = defineStore('admin-plans', {
  state: () => ({ allPlans: [], loadedBranch: null, loading: false, error: '' }),
  getters: {
    plans: (state) =>
      state.allPlans.filter((plan) => plan.branchId === useBranchesStore().activeBranchId),
    activePlans() {
      return this.plans.filter((plan) => plan.isActive)
    },
  },
  actions: {
    clear() {
      this.allPlans = []
      this.loadedBranch = null
      this.loading = false
      this.error = ''
    },
    async load(branch = useBranchesStore().activeBranchId) {
      if (!branch) {
        this.clear()
        return
      }
      this.loading = true
      this.error = ''
      try {
        const rows = await useIntegrationStore().track('planes administrativos', () =>
          api.adminPlans.list(branch),
        )
        // Una respuesta tardía de la sucursal anterior nunca contamina la vista actual.
        if (branch === useBranchesStore().activeBranchId) {
          this.allPlans = rows.map(normalize)
          this.loadedBranch = branch
        }
      } catch (error) {
        if (branch === useBranchesStore().activeBranchId) {
          this.error = error.message || 'No se pudieron cargar los planes.'
          this.loadedBranch = null
        }
        throw error
      } finally {
        if (branch === useBranchesStore().activeBranchId) this.loading = false
      }
    },
    async createPlan(body) {
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('planes administrativos', () =>
        api.adminPlans.create(branch, body),
      )
      if (branch === useBranchesStore().activeBranchId) this.allPlans.push(normalize(row))
      return row
    },
    async updatePlan(id, changes) {
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('planes administrativos', () =>
        api.adminPlans.update(branch, id, changes),
      )
      if (branch === useBranchesStore().activeBranchId) {
        this.allPlans = this.allPlans.map((plan) => (plan.id === id ? normalize(row) : plan))
      }
      return row
    },
    async removePlan(id) {
      const branch = useBranchesStore().activeBranchId
      await useIntegrationStore().track('planes administrativos', () =>
        api.adminPlans.remove(branch, id),
      )
      if (branch === useBranchesStore().activeBranchId) {
        this.allPlans = this.allPlans.filter((plan) => plan.id !== id)
      }
    },
  },
})
