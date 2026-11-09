import { defineStore } from 'pinia'
export const useIntegrationStore = defineStore('integration', {
  state: () => ({ errors: {}, pending: {}, lastUpdated: {} }),
  getters: {
    errorList: (state) =>
      Object.entries(state.errors).map(([module, message]) => ({ module, message })),
  },
  actions: {
    clear(module) {
      delete this.errors[module]
    },
    async track(module, job) {
      this.pending[module] = true
      try {
        const result = await job()
        delete this.errors[module]
        this.lastUpdated[module] = Date.now()
        return result
      } catch (error) {
        if (error?.name !== 'AbortError')
          this.errors[module] = error?.message || 'Error desconocido'
        throw error
      } finally {
        this.pending[module] = false
      }
    },
    reset() {
      this.errors = {}
      this.pending = {}
      this.lastUpdated = {}
    },
  },
})
