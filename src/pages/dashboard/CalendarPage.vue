<script setup>
import FullCalendar from '@fullcalendar/vue3'

import dayGridPlugin from '@fullcalendar/daygrid'

import interactionPlugin from '@fullcalendar/interaction'

import timeGridPlugin from '@fullcalendar/timegrid'

import { useBookingEngine } from '@/composables/useBookingEngine'

import { useBookingStore } from '@/stores/useBookingStore'

import { ref } from 'vue'

const bookingStore = useBookingStore()

const { validateBooking } = useBookingEngine()

const events = ref([
  {
    title: 'Full Body',

    start: '2026-05-18T06:00:00',

    end: '2026-05-18T07:00:00',
  },

  {
    title: 'Calistenia',

    start: '2026-05-18T08:00:00',

    end: '2026-05-18T09:00:00',
  },
])

const calendarOptions = {
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

  initialView: 'dayGridMonth',

  height: 'auto',

  events,

  selectable: true,

  editable: true,

  dateClick(info) {
    const newBooking = {
      id: Date.now(),

      title: 'Nueva Clase',

      start: info.dateStr,

      end: info.dateStr,

      special: false,
    }

    const result = validateBooking({
      existingBookings: bookingStore.bookings,

      newBooking,

      settings: bookingStore.settings,
    })

    if (!result.valid) {
      alert(result.reason)

      return
    }

    bookingStore.addBooking(newBooking)

    events.value.push(newBooking)
  },
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-4xl font-black">Calendario</h1>

      <p class="text-zinc-500 mt-2">Gestión de clases y eventos</p>
    </div>

    <div class="rounded-3xl border border-zinc-800 bg-[var(--color-surface)] p-6">
      <FullCalendar :options="calendarOptions" />
    </div>
  </div>
</template>
