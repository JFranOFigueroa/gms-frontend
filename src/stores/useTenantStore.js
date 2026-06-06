import { defineStore } from 'pinia'

export const useTenantStore = defineStore(
  'tenant',

  {
    state: () => ({
      gym: {
        name: 'Gym Manager Software',

        shortName: 'GMS',

        logo: null,
      },
    }),

    persist: true,

    actions: {
      updateGym(payload) {
        this.gym = {
          ...this.gym,

          ...payload,
        }

        localStorage.setItem(
          'gms-tenant',

          JSON.stringify(this.gym),
        )
      },

      restoreTenant() {
        const stored = localStorage.getItem('gms-tenant')

        if (!stored) return

        try {
          this.gym = JSON.parse(stored)
        } catch {
          localStorage.removeItem('gms-tenant')
        }
      },
    },
  },
)
