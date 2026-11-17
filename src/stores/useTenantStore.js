import { defineStore } from 'pinia'
import { useBranchesStore } from './useBranchesStore'
export const useTenantStore = defineStore('tenant', {
  getters: {
    branch() {
      return (
        useBranchesStore().activeBranch || { name: 'GymBack', shortName: 'GymBack', logo: null }
      )
    },
  },
  actions: {
    updateBranch(payload) {
      return useBranchesStore().updateBranch(useBranchesStore().activeBranchId, payload)
    },
    restoreTenant() {
      /* El sucursal activa está unificado con la sesión. */
    },
  },
})
