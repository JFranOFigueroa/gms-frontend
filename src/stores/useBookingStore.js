import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';
export const useBookingStore = defineStore('booking', {
  state:()=>({ bookings:[],settings:{allowMultipleNormalPerDay:false} }),
  actions:{
    async loadSettings(gym=useGymsStore().activeGymId){if(!gym)return;
      const config=await useIntegrationStore().track('configuración',()=>api.settings.get(gym));
      this.settings.allowMultipleNormalPerDay=config.allow_multiple_normal_classes_per_day === true;
      return config;},
    async addBooking(booking){const gym=useGymsStore().activeGymId;
      const row=await useIntegrationStore().track('reservas',()=>api.reservations.create(gym,booking.classId));
      this.bookings.push(row);return row;},
  },
});
