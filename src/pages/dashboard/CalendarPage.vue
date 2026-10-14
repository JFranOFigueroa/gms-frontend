<script setup>
import { computed, ref } from 'vue'

import DayScheduleModal from '@/components/calendar/DayScheduleModal.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

const scheduleStore = useClassScheduleStore()

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const selectedDay = ref(null)
const dayScheduleOpen = ref(false)

const weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const monthLabel = computed(() => {
  return new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(currentYear.value, currentMonth.value, 1))
})

const toLocalISO = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const todayISO = toLocalISO(today)

const eventsByDate = computed(() => {
  const grouped = {}

  scheduleStore.classes.forEach((gymClass) => {
    if (!grouped[gymClass.date]) {
      grouped[gymClass.date] = {
        total: 0,
        special: 0,
      }
    }

    grouped[gymClass.date].total++

    if (gymClass.category !== 'normal') {
      grouped[gymClass.date].special++
    }
  })

  return grouped
})

const calendarCells = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const mondayOffset = (firstDay.getDay() + 6) % 7
  const totalCells = Math.ceil((mondayOffset + daysInMonth) / 7) * 7
  const cells = []

  for (let index = 0; index < totalCells; index++) {
    const dayNumber = index - mondayOffset + 1
    const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth
    const date = inMonth ? new Date(currentYear.value, currentMonth.value, dayNumber) : null
    const dateISO = date ? toLocalISO(date) : null

    cells.push({
      key: `${currentYear.value}-${currentMonth.value}-${index}`,
      dayNumber: inMonth ? dayNumber : '',
      inMonth,
      isToday: dateISO === todayISO,
      dateISO,
      summary: dateISO ? eventsByDate.value[dateISO] || null : null,
    })
  }

  return cells
})

const previousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value -= 1
  } else {
    currentMonth.value -= 1
  }
}

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value += 1
  } else {
    currentMonth.value += 1
  }
}

const goToToday = () => {
  currentYear.value = today.getFullYear()
  currentMonth.value = today.getMonth()
}

const openDaySchedule = (date) => {
  if (!date) return

  selectedDay.value = date
  dayScheduleOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- HEADER -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-4xl font-black">Calendario</h1>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Gestión de clases y eventos
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <BaseButton variant="secondary" @click="previousMonth">Anterior</BaseButton>

        <BaseButton variant="secondary" @click="goToToday">Hoy</BaseButton>

        <BaseButton variant="secondary" @click="nextMonth">Siguiente</BaseButton>
      </div>
    </div>

    <!-- CALENDAR -->
    <BaseCard class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-black capitalize">
          {{ monthLabel }}
        </h2>

        <p class="text-sm text-[var(--color-text-secondary)]">
          Selecciona un día para ver su agenda
        </p>
      </div>

      <!-- WEEK HEADER -->
      <div class="grid grid-cols-7 gap-2">
        <div
          v-for="day in weekdayLabels"
          :key="day"
          class="px-2 py-2 text-center text-xs font-bold uppercase tracking-wide text-[var(--color-text-secondary)]"
        >
          {{ day }}
        </div>
      </div>

      <!-- DAYS -->
      <div class="grid grid-cols-7 gap-2">
        <button
          v-for="cell in calendarCells"
          :key="cell.key"
          type="button"
          class="min-h-[112px] rounded-2xl border p-3 text-left transition-all duration-200"
          :class="
            cell.inMonth
              ? 'border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)]'
              : 'border-transparent bg-transparent cursor-default'
          "
          :disabled="!cell.inMonth"
          @click="openDaySchedule(cell.dateISO)"
        >
          <div v-if="cell.inMonth" class="flex h-full flex-col justify-between">
            <div class="flex items-center justify-between">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                :class="
                  cell.isToday
                    ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                    : 'text-[var(--color-text)]'
                "
              >
                {{ cell.dayNumber }}
              </span>

              <span
                v-if="cell.summary"
                class="rounded-full bg-[var(--color-primary)]/15 px-2 py-1 text-xs font-bold text-[var(--color-primary)]"
              >
                {{ cell.summary.total }}
              </span>
            </div>

            <div v-if="cell.summary" class="space-y-1">
              <p class="text-xs text-[var(--color-text-secondary)]">
                {{ cell.summary.total }} clase{{ cell.summary.total === 1 ? '' : 's' }}
              </p>

              <p
                v-if="cell.summary.special"
                class="text-xs text-[var(--color-text-secondary)]"
              >
                {{ cell.summary.special }} especial{{ cell.summary.special === 1 ? '' : 'es' }}
              </p>
            </div>
          </div>
        </button>
      </div>
    </BaseCard>

    <!-- MODAL -->
    <DayScheduleModal
      :open="dayScheduleOpen"
      :selectedDay="selectedDay"
      @close="dayScheduleOpen = false"
      @create="dayScheduleOpen = true"
    />
  </div>
</template>