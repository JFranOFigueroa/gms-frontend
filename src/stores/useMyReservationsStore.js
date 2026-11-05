import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';

export const useMyReservationsStore = defineStore('my-reservations', {
  state:()=>({gymId:null,items:[],loaded:false,error:''}),
  getters: {
    activeItems: s=>s.items.filter(r=>['booked','attended'].includes(r.status)),
  },
  actions: {
    clear() { this.gymId=null;this.items=[];this.loaded=false;this.error=''; },
    async load(gym=useGymsStore().activeGymId,params={}) {
      if(!gym){this.clear();return;}
      this.gymId=gym;this.loaded=false;this.error='';
      try {
        const items=[];let offset=0;let total=0;
        do {
          const page=await useIntegrationStore().track('mis reservas',()=>api.reservations.mine(gym,{...params,offset,limit:100}));
          total=Number(page.total ?? 0);
          if(!Array.isArray(page.items))throw new Error('Formato de reservas inválido');
          items.push(...page.items);offset+=page.items.length;
          if(!page.items.length)break;
          if(items.length>10000)throw new Error('Demasiadas reservas para esta consulta');
        }while(offset<total);
        if(this.gymId===gym) {this.items=items;this.loaded=true;}
        return items;
      }catch(error){if(this.gymId===gym)this.error=error.message;throw error;}
    },
    findByClass(classId){return this.activeItems.find(item=>String(item.classId)===String(classId))||null;},
    async cancel(reservationId){
      const gym=useGymsStore().activeGymId;
      await useIntegrationStore().track('mis reservas',()=>api.reservations.cancel(gym,reservationId));
      if(this.gymId===gym)this.items=this.items.map(item=>item.id===reservationId?{...item,status:'cancelled'}:item);
    },
  },
});
