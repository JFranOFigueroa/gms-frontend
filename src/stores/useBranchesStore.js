import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapBranch } from '@/api/mappers'
import { useIntegrationStore } from './useIntegrationStore'
export const useBranchesStore = defineStore('branches', {
  state: () => ({ branches: [], activeBranchId: null, loaded: false }),
  getters: {
    activeBranch(state) {
      return state.branches.find((g) => g.id === state.activeBranchId) || null
    },
  },
  actions: {
    reset() {
      this.branches = []
      this.activeBranchId = null
      this.loaded = false
    },
    setFromSession(access) {
      this.branches = (access || []).map((g) => ({
        id: g.id,
        name: g.name,
        code: g.code,
        shortName: g.name,
        active: true,
        roles: g.roles || [],
        address: '',
        phone: '',
        logo: null,
      }))
      if (!this.branches.some((g) => g.id === this.activeBranchId)) this.activeBranchId = null
    },
    async load() {
      const rows = await useIntegrationStore().track('sucursales', () => api.branches.list())
      this.branches = rows.map(mapBranch)
      this.loaded = true
    },
    getBranchById(id) {
      return this.branches.find((g) => g.id === id) || null
    },
    setActiveBranch(id) {
      if (id == null) {
        this.activeBranchId = null
        return
      }
      if (!this.branches.some((g) => g.id === id)) throw new Error('Sucursal no autorizada.')
      this.activeBranchId = id
    },
    async addBranch(payload) {
      // El backend nuevo autogenera el code y resuelve colisiones automáticas.
      const row = await useIntegrationStore().track('sucursales', () =>
        api.branches.create(payload),
      )
      const branch = mapBranch(row)
      this.branches.push(branch)
      // Sincronizar la lista del servidor para que el selector incluya de inmediato
      // todas las sucursales, conservando el nuevo incluso si falla la recarga.
      try {
        await this.load()
      } catch {
        // El POST ya fue confirmado: no simular un fallo y provocar otra alta.
      }
      return branch
    },
    async updateBranch(id, payload) {
      const row = await useIntegrationStore().track('sucursales', () =>
        api.branches.update(id, payload),
      )
      const updated = mapBranch(row)
      this.branches = this.branches.map((g) => (g.id === id ? updated : g))
      try {
        await this.load()
      } catch {
        // Conservar el dato confirmado por PATCH.
      }
      return updated
    },
    async removeBranch(id) {
      await useIntegrationStore().track('sucursales', () => api.branches.remove(id))
      this.branches = this.branches.filter((g) => g.id !== id)
      // La selección siguiente pasa por auth.selectBranch para actualizar también
      // rol, sesión y datos de la sucursal, no solo el identificador reactivo.
      if (this.activeBranchId === id) this.activeBranchId = null
    },
  },
})
