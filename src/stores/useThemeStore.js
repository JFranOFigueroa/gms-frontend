import { defineStore } from 'pinia';
import { themePresets } from '@/config/themePresets';
import { api } from '@/api/service';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';
import { useLandingPublicationStore } from './useLandingPublicationStore';
export const useThemeStore = defineStore('theme', {
  state:()=>({selectedPreset:null}),
  getters:{currentTheme:s=>themePresets.find(p=>p.id===s.selectedPreset)||themePresets[0]},
  actions:{
    async load(gym=useGymsStore().activeGymId){if(!gym)return;
      const cfg=await useIntegrationStore().track('tema',()=>api.settings.get(gym));
      if(gym===useGymsStore().activeGymId)this.selectedPreset=cfg.theme_preset||cfg.themePreset;},
    async applyPreset(preset){const gym=useGymsStore().activeGymId;
      const cfg=await useIntegrationStore().track('tema',()=>api.settings.update(gym,{themePreset:preset.id}));
      this.selectedPreset=cfg.theme_preset||preset.id;useLandingPublicationStore().markDirty(gym);},
  },
});
