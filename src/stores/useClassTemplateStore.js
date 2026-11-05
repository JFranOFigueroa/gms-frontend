import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { mapTemplate } from '@/api/mappers';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';
export const useClassTemplateStore = defineStore('class-templates', {
  state:()=>({allTemplates:[]}),
  getters:{templates:s=>s.allTemplates.filter(t=>t.gymId===useGymsStore().activeGymId)},
  actions:{
    async load(gym=useGymsStore().activeGymId){if(!gym){this.allTemplates=[];return;}
      const rows=await useIntegrationStore().track('plantillas',()=>api.templates.list(gym));
      if(gym===useGymsStore().activeGymId)this.allTemplates=rows.map(mapTemplate);},
    async addTemplate(data){const gym=useGymsStore().activeGymId;
      const row=await useIntegrationStore().track('plantillas',()=>api.templates.create(gym,{
        name:data.name,color:data.color,durationMinutes:Number(data.duration),capacity:Number(data.capacity),category:data.category||'normal'}));
      this.allTemplates.push(mapTemplate(row));return row;},
    async removeTemplate(id){const gym=useGymsStore().activeGymId;
      await useIntegrationStore().track('plantillas',()=>api.templates.remove(gym,id));
      this.allTemplates=this.allTemplates.filter(t=>t.id!==id);},
  },
});
