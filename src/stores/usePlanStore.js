import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { mapPlan } from '@/api/mappers';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';
export const usePlanStore = defineStore('plans', {
  state: () => ({ allPlans: [] }),
  getters: { plans: s=>s.allPlans.filter(p=>p.gymId===useGymsStore().activeGymId),
    activePlans() { return this.plans.filter(p=>p.active); } },
  actions: {
    async load(gym=useGymsStore().activeGymId) {
      if (!gym) { this.allPlans=[];return; }
      const rows=await useIntegrationStore().track('planes',()=>api.plans.list(gym));
      if (gym===useGymsStore().activeGymId) this.allPlans=rows.map(mapPlan);
    },
  },
});
