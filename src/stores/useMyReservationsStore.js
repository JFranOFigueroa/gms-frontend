import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'

export const useMyReservationsStore = defineStore('my-reservations', {
  state: () => ({ branchId: null, items: [], loaded: false, error: '' }),
  getters: {
    activeItems: (s) => s.items.filter((r) => ['booked', 'attended'].includes(r.status)),
  },
  actions: {
    clear() {
      this.branchId = null
      this.items = []
      this.loaded = false
      this.error = ''
    },
    async load(branch = useBranchesStore().activeBranchId, params = {}) {
      if (!branch) {
        this.clear()
        return
      }
      this.branchId = branch
      this.loaded = false
      this.error = ''
      try {
        const items = []
        let offset = 0
        let total = 0
        do {
          const page = await useIntegrationStore().track('mis reservas', () =>
            api.reservations.mine(branch, { ...params, offset, limit: 100 }),
          )
          total = Number(page.total ?? 0)
          if (!Array.isArray(page.items)) throw new Error('Formato de reservas inválido')
          items.push(...page.items)
          offset += page.items.length
          if (!page.items.length) break
          if (items.length > 10000) throw new Error('Demasiadas reservas para esta consulta')
        } while (offset < total)
        if (this.branchId === branch) {
          this.items = items
          this.loaded = true
        }
        return items
      } catch (error) {
        if (this.branchId === branch) this.error = error.message
        throw error
      }
    },
    findByClass(classId) {
      return this.activeItems.find((item) => String(item.classId) === String(classId)) || null
    },
    async cancel(reservationId) {
      const branch = useBranchesStore().activeBranchId
      await useIntegrationStore().track('mis reservas', () =>
        api.reservations.cancel(branch, reservationId),
      )
      if (this.branchId === branch)
        this.items = this.items.map((item) =>
          item.id === reservationId ? { ...item, status: 'cancelled' } : item,
        )
    },
  },
})
