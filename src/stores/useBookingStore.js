import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'
export const useBookingStore = defineStore('booking', {
  state: () => ({ bookings: [], settings: { allowMultipleNormalPerDay: false } }),
  actions: {
    async loadSettings(branch = useBranchesStore().activeBranchId) {
      if (!branch) return
      const config = await useIntegrationStore().track('configuración', () =>
        api.settings.get(branch),
      )
      this.settings.allowMultipleNormalPerDay =
        config.allow_multiple_normal_classes_per_day === true
      return config
    },
    async addBooking(booking) {
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('reservas', () =>
        api.reservations.create(branch, booking.classId),
      )
      this.bookings.push(row)
      return row
    },
  },
})
