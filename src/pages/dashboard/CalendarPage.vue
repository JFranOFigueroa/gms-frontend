<script setup>
import { ref, computed } from 'vue'

import FullCalendar from '@fullcalendar/vue3'

import dayGridPlugin from '@fullcalendar/daygrid'

import interactionPlugin from '@fullcalendar/interaction'

import timeGridPlugin from '@fullcalendar/timegrid'

import CreateClassModal from '@/components/calendar/CreateClassModal.vue'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

const scheduleStore = useClassScheduleStore()

const createModalOpen = ref(false)

const selectedDate = ref(null)

const openCreateModal = (date) => {
  selectedDate.value = date

  createModalOpen.value = true
}

const events = computed(() => {
  return scheduleStore.classes.map((gymClass) => ({
    id: gymClass.id,

    title: gymClass.name,

    start: `${gymClass.date}T${gymClass.startTime}`,

    end: `${gymClass.date}T${gymClass.endTime}`,

    backgroundColor: gymClass.color,

    borderColor: gymClass.color,
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
    openCreateModal(info.dateStr)
  },
}))
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div>
      <h1 class="text-4xl font-black">Calendario</h1>

      <p class="text-zinc-500 mt-2">Gestión de clases y eventos</p>
    </div>

    <!-- CALENDAR -->
    <div class="rounded-3xl border border-zinc-800 bg-[var(--color-surface)] p-6">
      <FullCalendar :options="calendarOptions" />
    </div>

    <!-- MODAL -->
    <CreateClassModal
      :open="createModalOpen"
      :selectedDate="selectedDate"
      @close="createModalOpen = false"
    />
  </div>
</template>
