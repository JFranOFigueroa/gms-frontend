import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { mapCheckin } from '@/api/mappers';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';
import { toDateOnly } from '@/utils/date';
const today=()=>toDateOnly(new Date());
const unavailable={ok:false,allowed:false,reason:'El QR y el kiosco público aún no tienen validación del backend; no se registró acceso.'};
export const useCheckinStore = defineStore('checkin', {
  state:()=>({activeToken:null,tokenExpiresAt:null,allCheckins:[],ownCheckins:[]}),
  getters:{
    tokenIsValid:()=>false,
    checkins:s=>s.allCheckins.filter(c=>c.gymId===useGymsStore().activeGymId),
    todaysCheckins(){return this.checkins.filter(c=>c.timestamp&&toDateOnly(new Date(c.timestamp))===today());},
    grantedToday(){return this.todaysCheckins.filter(c=>c.allowed);},
    deniedToday(){return this.todaysCheckins.filter(c=>!c.allowed);},
    stats(){return {total:this.checkins.length,today:this.todaysCheckins.length,granted:this.grantedToday.length,denied:this.deniedToday.length};},
  },
  actions:{
    async load(gym=useGymsStore().activeGymId){if(!gym){this.allCheckins=[];return;}
      const rows=await useIntegrationStore().track('check-in',()=>api.checkins.list(gym));
      if(gym===useGymsStore().activeGymId)this.allCheckins=rows.map(mapCheckin);},
    async loadMine(gym=useGymsStore().activeGymId, params={limit:100}) {
      this.ownCheckins=[];
      if(!gym) return;
      const result=await useIntegrationStore().track('mis accesos',()=>api.checkins.mine(gym,params));
      if(gym===useGymsStore().activeGymId) this.ownCheckins=(result.items || []).map(e=>({
        id:e.eventId, timestamp:e.occurredAt, visitDate:e.visitDate,
        allowed:e.allowed, method:e.method, reason:e.reason,
      }));
      return this.ownCheckins;
    },
    async manualCheckin(memberId){const gym=useGymsStore().activeGymId;
      const event=await useIntegrationStore().track('check-in',()=>api.checkins.manual(gym,memberId));
      await this.load(gym);return {ok:event.allowed,allowed:event.allowed,reason:event.reason,event};},
    generateToken(){return {token:null,expiresAt:null,reason:unavailable.reason};},
    ensureActiveToken(){return this.generateToken();},
    validateToken(){return false;},
    isKioskTokenValid(){return false;},
    hasCheckedInToday(id){return this.grantedToday.some(c=>String(c.userId)===String(id));},
    recordAccess(){return unavailable;},
    checkIn(){return unavailable;},
    registerAccess(){return unavailable;},
  },
});
