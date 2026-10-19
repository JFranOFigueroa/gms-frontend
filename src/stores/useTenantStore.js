import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'

const fallbackGym = {
  name: 'Gym Manager Software',
  shortName: 'GMS',
  logo: null,
}

/**
 * El tenant representa el gimnasio activo seleccionado en el header.
 * Ya no guarda su propia copia: delega en el store de gimnasios para que
 * toda la identidad mostrada corresponda al gimnasio seleccionado.
 */
export const useTenantStore = defineStore('tenant', {
  getters: {
    gym() {
      const gymsStore = useGymsStore()

      return gymsStore.activeGym || fallbackGym
    },
  },

  actions: {
    updateGym(payload) {
      const gymsStore = useGymsStore()

      gymsStore.updateGym(gymsStore.activeGymId, payload)
    },

    restoreTenant() {
      // La identidad se resuelve dinámicamente desde el store de gimnasios.
    },
  },
})
