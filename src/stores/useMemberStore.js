import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { mapMember, mapPayment } from '@/api/mappers';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';
import { todayISO } from '@/utils/date';
import { validateImageFile } from './useMediaStore';
export const useMemberStore = defineStore('members', {
  state:()=>({ allMembers:[], allPayments:[], ownMember: null }),
  getters: {
    members:s=>s.allMembers.filter(m=>m.gymId===useGymsStore().activeGymId),
    payments:s=>s.allPayments.filter(p=>p.gymId===useGymsStore().activeGymId),
    activeMembers(){return this.members.filter(m=>m.active);},
    inactiveMembers(){return this.members.filter(m=>!m.active);},
    expiredMembers(){return this.activeMembers.filter(m=>this.isPaymentExpired(m));},
    paymentsThisMonth(){return this.payments.filter(p=>p.paidAt?.startsWith(todayISO().slice(0,7)));},
    collectedThisMonth(){return this.paymentsThisMonth.reduce((sum,p)=>sum+p.amount,0);},
  },
  actions: {
    async load(gym=useGymsStore().activeGymId) {
      if (!gym) { this.allMembers=[];return; }
      const rows=await useIntegrationStore().track('miembros',()=>api.members.list(gym));
      if (useGymsStore().activeGymId===gym) this.allMembers=rows.map(mapMember);
    },
    async loadPayments(gym=useGymsStore().activeGymId){
      if (!gym){this.allPayments=[];return;}
      const rows=await useIntegrationStore().track('pagos',()=>api.payments.list(gym));
      if (useGymsStore().activeGymId===gym) this.allPayments=rows.map(mapPayment);
    },
    async loadMine(gym=useGymsStore().activeGymId) {
      this.ownMember = null;
      if (!gym) return;
      const row = await useIntegrationStore().track('mi perfil', () => api.members.me(gym));
      if (gym === useGymsStore().activeGymId) this.ownMember = mapMember(row);
      return this.ownMember;
    },
    async registerNewMember(data) {
      const gym = useGymsStore().activeGymId;
      const row = await useIntegrationStore().track('miembros', () => api.members.register(gym, {
        user: { fullName: data.name, email: data.email, phone: data.phone, password: data.password, status: 'active' },
        member: {
          code: data.code || null, birthDate: data.birthDate || null, address: data.address || null,
          emergencyContactName: data.emergencyContactName || null, emergencyContactPhone: data.emergencyContactPhone || null,
          notes: data.notes || null, startDate: data.startDate || null, active: true,
        },
      }));
      await this.load(gym);
      return row;
    },
    // Solo un pago anterior con fecha de vencimiento conocida puede estar vencido.
    // La ausencia de un primer pago es un estado distinto: no_payment.
    memberPaymentState(member){
      if (!member?.active) return 'inactive';
      const payments = this.memberPayments(member.id);
      const hasPayment = Boolean(member.lastPaymentDate) || payments.length > 0;
      if (!hasPayment) return 'no_payment';
      const dueDate = member.nextPaymentDate || payments[0]?.nextPaymentDate;
      if (!dueDate) return 'unknown';
      return dueDate < todayISO() ? 'expired' : 'current';
    },
    isPaymentExpired(member){ return this.memberPaymentState(member) === 'expired'; },
    getAccessStatus(member){
      if(!member) return {allowed:false,code:'not_found',reason:'Miembro no disponible'};
      if(member.gymId !== useGymsStore().activeGymId) return {allowed:false,code:'wrong_gym',reason:'Otro gimnasio'};
      if(!member.active) return {allowed:false,code:'inactive',reason:'Miembro inactivo'};
      const paymentState = this.memberPaymentState(member);
      if (paymentState === 'no_payment') return {allowed:false,code:'no_payment',reason:'Sin pago registrado'};
      if (member.accessStatus != null) {
        const reason = { allowed: 'Vigencia actual', expired: 'Pago vencido',
          no_payment: 'Sin pago registrado', inactive: 'Miembro inactivo' }[member.accessStatus]
          || 'Acceso sujeto a validación';
        return {allowed: member.accessStatus === 'allowed', code: member.accessStatus, reason};
      }
      if (paymentState === 'expired') return {allowed:false,code:'expired',reason:'Pago vencido'};
      if (paymentState === 'unknown') return {allowed:false,code:'unknown',reason:'Vigencia por confirmar'};
      // Solo es una previsualización: el backend revalida cada check-in.
      return {allowed:true,code:'ok',reason:'Vigencia actual'};
    },
    findById(id){return this.allMembers.find(m=>String(m.id)===String(id))||null;},
    findByEmail(email){return this.allMembers.find(m=>m.email?.toLowerCase()===String(email||'').toLowerCase())||null;},
    findByCode(value){const v=String(value||'').replace(/^GMS-MEMBER:/i,'').trim().toLowerCase();
      return this.allMembers.find(m=>m.code?.toLowerCase()===v||m.email?.toLowerCase()===v||String(m.id)===v)||null;},
    memberPayments(id){return this.payments.filter(p=>String(p.memberId)===String(id)).sort((a,b)=>b.paidAt.localeCompare(a.paidAt));},
    async addMember(data){
      if(!data.userId) throw new Error('Primero busca la cuenta que deseas vincular.');
      const gym=useGymsStore().activeGymId;
      const row=await useIntegrationStore().track('miembros',()=>api.members.create(gym,{
        userId:data.userId, code:data.code, birthDate:data.birthDate||null, address:data.address,
        emergencyContactName:data.emergencyContactName,emergencyContactPhone:data.emergencyContactPhone,
        notes:data.notes,startDate:data.startDate,active:data.active ?? true,
      }));
      await this.load(gym);return mapMember(row);
    },
    async updateMember(id,data){
      const gym=useGymsStore().activeGymId;
      const body={ birthDate:data.birthDate||null,address:data.address||'',
        emergencyContactName:data.emergencyContactName||'',emergencyContactPhone:data.emergencyContactPhone||'',
        notes:data.notes||'',startDate:data.startDate,active:data.active };
      const row=await useIntegrationStore().track('miembros',()=>api.members.update(gym,id,body));
      this.allMembers=this.allMembers.map(m=>m.id===id?mapMember(row):m);
      return mapMember(row);
    },
    async updateMemberPhoto(memberId, file) {
      validateImageFile(file);
      const gym = useGymsStore().activeGymId;
      const asset = await useIntegrationStore().track('fotografía', () => api.media.upload(gym, file, 'Foto del miembro'));
      await useIntegrationStore().track('fotografía', () => api.members.update(gym, memberId, { photoAssetId: asset.id }));
      await this.load(gym);
      return asset;
    },
    async deactivateMember(id){return this.updateMember(id,{...this.findById(id),active:false});},
    async reactivateMember(id){return this.updateMember(id,{...this.findById(id),active:true});},
    async registerPayment(id,payload){
      const gym=useGymsStore().activeGymId;
      if(!payload.planId) return {ok:false,reason:'Selecciona un plan de membresía válido.'};
      try {
        const payment=await useIntegrationStore().track('pagos',()=>api.payments.create(gym,{
          memberId:id,planId:payload.planId,method:payload.method,periods:Number(payload.periods)||1,
          notes:payload.notes||null }));
        await Promise.all([this.load(gym),this.loadPayments(gym)]);
        return {ok:true,payment};
      }catch(error){return {ok:false,reason:error.message};}
    },
  },
});
