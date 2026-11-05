import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { useIntegrationStore } from './useIntegrationStore';
export const useGlobalAccountsStore = defineStore('global-accounts', {
  state:()=>({items:[],total:0,offset:0,limit:50,query:'',loading:false,error:''}),
  actions:{
    async load(query=this.query,offset=0){
      this.query=query;this.loading=true;this.error='';
      try{const result=await useIntegrationStore().track('cuentas globales',()=>api.users.list({query,offset,limit:this.limit}));
        this.items=result.items||[];this.total=Number(result.total||0);this.offset=result.offset||0;return result;
      }catch(e){this.error=e.message;throw e;}finally{this.loading=false;}
    },
    async create(data){const result=await api.users.create(data);await this.load();return result;},
    async update(id,data){const result=await api.users.update(id,data);await this.load();return result;},
    async changeStatus(id,status){const result=await api.users.changeStatus(id,status);await this.load();return result;},
    async one(id){return api.users.one(id);},
    async search(email){return api.users.search(email);},
  },
});
