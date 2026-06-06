<script setup>
import { ref, computed } from 'vue'

import FullCalendar from '@fullcalendar/vue3'

import dayGridPlugin from '@fullcalendar/daygrid'

import interactionPlugin from '@fullcalendar/interaction'

import timeGridPlugin from '@fullcalendar/timegrid'

import CreateClassModal from '@/components/calendar/CreateClassModal.vue'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

import DayScheduleModal from '@/components/calendar/DayScheduleModal.vue'

const scheduleStore = useClassScheduleStore()

const createModalOpen = ref(false)

const selectedDate = ref(null)

const dayScheduleOpen = ref(false)

const selectedDay = ref(null)

const openDaySchedule = (date) => {
  selectedDay.value = date

  dayScheduleOpen.value = true
}

const openCreateModal = (date) => {
  selectedDate.value = date

  createModalOpen.value = true
}

const events = computed(() => {
  const grouped = {}

  scheduleStore.classes.forEach((gymClass) => {
    if (!grouped[gymClass.date]) {
      grouped[gymClass.date] = {
        normal: 0,

        special: 0,
      }
    }

    if (gymClass.special) {
      grouped[gymClass.date].special++
    } else {
      grouped[gymClass.date].normal++
    }
  })

  return Object.entries(grouped).map(([date, summary]) => ({
    title: `${summary.normal} clases`,

    start: date,

    allDay: true,

    extendedProps: {
      summary,
    },
  }))
})

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],

  initialView: 'dayGridMonth',

  height: 'auto',

  selectable: true,

  editable: true,

  events: events.value,

  dateClick(info) {
    openDaySchedule(info.dateStr)
  },

  eventClick(info) {
    openDaySchedule(info.event.startStr)
  },
}))
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div>
      <h1 class="text-4xl font-black">Calendario</h1>

      <p class="text-[var(--color-text-secondary)] mt-2">Gestión de clases y eventos</p>
    </div>

    <!-- CALENDAR -->
    <div class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- MODAL -->
    <DayScheduleModal
      :open="dayScheduleOpen"
      :selectedDay="selectedDay"
      @close="dayScheduleOpen = false"
      @create="createModalOpen = true"
    />
  </div>
</template>
