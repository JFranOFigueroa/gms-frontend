import { defineStore } from 'pinia';
import { useGymsStore } from './useGymsStore';
export const useTenantStore = defineStore('tenant', {
  getters: { gym() { return useGymsStore().activeGym || { name: 'Gimnasio', shortName: 'Gym', logo: null }; } },
  actions: {
    updateGym(payload) { return useGymsStore().updateGym(useGymsStore().activeGymId, payload); },
    restoreTenant() { /* El gimnasio activo está unificado con la sesión. */ },
  },
});
