import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'

/** Guarda únicamente el enlace público del gimnasio; la página no se publica manualmente. */
export const useLandingPublicationStore = defineStore('landing-publication', {
  state: () => ({ gymId: null, details: null, loading: false, saving: false, error: '' }),
  getters: { publicUrl: (s) => s.details?.publicUrl || null },
  actions: {
    clear() {
      this.gymId = null
      this.details = null
      this.error = ''
      this.loading = false
      this.saving = false
    },
    // Los bloques se guardan automáticamente por su propio store. Se conserva por compatibilidad.
    markDirty() {},
    async load(gymId = useGymsStore().activeGymId) {
      if (!gymId) {
        this.clear()
        return
      }
      this.gymId = gymId
      this.details = null
      this.loading = true
      this.error = ''
      try {
        const result = await useIntegrationStore().track('enlace de página', () =>
          api.landing.link(gymId),
        )
        if (this.gymId === gymId) this.details = result
        return result
      } catch (error) {
        if (this.gymId === gymId) this.error = error.message
        throw error
      } finally {
        if (this.gymId === gymId) this.loading = false
      }
    },
    async changeSlug(slug) {
      const gymId = useGymsStore().activeGymId
      if (!gymId || gymId !== this.gymId) throw new Error('Selecciona primero un gimnasio.')
      this.saving = true
      this.error = ''
      try {
        const result = await useIntegrationStore().track('enlace de página', () =>
          api.landing.changeSlug(gymId, slug),
        )
        const record = useGymsStore().gyms.find((g) => g.id === gymId)
        if (record) record.slug = result.slug
        await this.load(gymId)
        return result
      } catch (error) {
        this.error = error.status === 409 ? 'Ese enlace ya está en uso. Elige otro.' : error.message
        throw error
      } finally {
        this.saving = false
      }
    },
  },
})
