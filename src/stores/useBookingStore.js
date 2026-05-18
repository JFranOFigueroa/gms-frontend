import { defineStore } from 'pinia'

export const useBookingStore = defineStore(
  'booking',

  {
    state: () => ({
      bookings: [],

      settings: {
        allowMultipleNormalPerDay: false,
      },
    }),

    actions: {
      addBooking(booking) {
        this.bookings.push(booking)
      },
    },
  },
)
