import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapGym } from '@/api/mappers'
import { useIntegrationStore } from './useIntegrationStore'
export const useGymsStore = defineStore('gyms', {
  state: () => ({ gyms: [], activeGymId: null, loaded: false }),
  getters: {
    activeGym(state) {
      return state.gyms.find((g) => g.id === state.activeGymId) || null
    },
  },
  actions: {
    reset() {
      this.gyms = []
      this.activeGymId = null
      this.loaded = false
    },
    setFromSession(access) {
      this.gyms = (access || []).map((g) => ({
        id: g.id,
        name: g.name,
        slug: g.slug,
        shortName: g.name,
        active: true,
        roles: g.roles || [],
        address: '',
        phone: '',
        logo: null,
      }))
      if (!this.gyms.some((g) => g.id === this.activeGymId)) this.activeGymId = null
    },
    async load() {
      const rows = await useIntegrationStore().track('gimnasios', () => api.gyms.list())
      this.gyms = rows.map(mapGym)
      this.loaded = true
    },
    getGymById(id) {
      return this.gyms.find((g) => g.id === id) || null
    },
    setActiveGym(id) {
      if (id == null) {
        this.activeGymId = null
        return
      }
      if (!this.gyms.some((g) => g.id === id)) throw new Error('Gimnasio no autorizado.')
      this.activeGymId = id
    },
    async addGym(payload) {
      // El backend nuevo autogenera el slug y resuelve colisiones automáticas.
      const row = await useIntegrationStore().track('gimnasios', () =>
        api.gyms.create(null, payload),
      )
      const gym = mapGym(row)
      this.gyms.push(gym)
      // Sincronizar la lista del servidor para que el selector incluya de inmediato
      // todos los gimnasios, conservando el nuevo incluso si falla la recarga.
      try {
        await this.load()
      } catch {
        // El POST ya fue confirmado: no simular un fallo y provocar otra alta.
      }
      return gym
    },
    async updateGym(id, payload) {
      const row = await useIntegrationStore().track('gimnasios', () =>
        api.gyms.update(null, id, payload),
      )
      const updated = mapGym(row)
      this.gyms = this.gyms.map((g) => (g.id === id ? updated : g))
      try {
        await this.load()
      } catch {
        // Conservar el dato confirmado por PATCH.
      }
      return updated
    },
    async removeGym(id) {
      await useIntegrationStore().track('gimnasios', () => api.gyms.remove(null, id))
      this.gyms = this.gyms.filter((g) => g.id !== id)
      // La selección siguiente pasa por auth.selectGym para actualizar también
      // rol, sesión y datos del gimnasio, no solo el identificador reactivo.
      if (this.activeGymId === id) this.activeGymId = null
    },
  },
})
