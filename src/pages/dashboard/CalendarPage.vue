<script setup>
import { computed, ref, watch } from 'vue'

import DayScheduleModal from '@/components/calendar/DayScheduleModal.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'
import { useMyReservationsStore } from '@/stores/useMyReservationsStore'
import { useGymsStore } from '@/stores/useGymsStore'
import { useAuthStore } from '@/stores/useAuthStore'

const scheduleStore = useClassScheduleStore()
const myReservations = useMyReservationsStore()
const gyms = useGymsStore()
const auth = useAuthStore()
const loadingError = ref('')

const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

const selectedDay = ref(null)
const dayScheduleOpen = ref(false)
const viewMode = ref('grid')

const weekdayLabels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const weekdayFormatter = new Intl.DateTimeFormat('es-MX', { weekday: 'long' })

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
watch(
  () => [gyms.activeGymId, currentYear.value, currentMonth.value, auth.role],
  async ([gym, year, month, role]) => {
    if (!gym) return
    const from = toLocalISO(new Date(year, month, 1))
    const to = toLocalISO(new Date(year, month + 1, 0))
    loadingError.value = ''
    const requests = [scheduleStore.loadRange(gym, from, to)]
    if (role === 'member') requests.push(myReservations.load(gym, { from, to }))
    const results = await Promise.allSettled(requests)
    const failure = results.find((r) => r.status === 'rejected')
    if (failure && gyms.activeGymId === gym)
      loadingError.value = failure.reason?.message || 'No fue posible cargar el calendario'
  },
  { immediate: true },
)

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
      weekday: date ? weekdayFormatter.format(date) : '',
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
        <h1 class="text-3xl font-black sm:text-4xl">Calendario</h1>

        <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
          Gestión de clases y eventos
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <BaseButton variant="secondary" @click="previousMonth">Anterior</BaseButton>

        <BaseButton variant="secondary" @click="goToToday">Hoy</BaseButton>

        <BaseButton variant="secondary" @click="nextMonth">Siguiente</BaseButton>
      </div>
    </div>

    <p v-if="loadingError" role="alert" class="text-sm text-red-400">{{ loadingError }}</p>

    <!-- CALENDAR -->
    <BaseCard class="space-y-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 class="text-xl font-black capitalize sm:text-2xl">
          {{ monthLabel }}
        </h2>

        <div class="flex flex-wrap items-center gap-3">
          <p class="hidden text-sm text-[var(--color-text-secondary)] sm:block">
            Selecciona un día para ver su agenda
          </p>

          <div class="inline-flex w-fit rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/40 p-1">
            <button
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
              :class="
                viewMode === 'grid'
                  ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-secondary)]'
              "
              @click="viewMode = 'grid'"
            >
              Mes
            </button>

            <button
              type="button"
              class="rounded-xl px-3 py-1.5 text-xs font-semibold transition"
              :class="
                viewMode === 'list'
                  ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-secondary)]'
              "
              @click="viewMode = 'list'"
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      <template v-if="viewMode === 'grid'">
        <!-- WEEK HEADER -->
        <div class="grid grid-cols-7 gap-1 sm:gap-2">
          <div
            v-for="day in weekdayLabels"
            :key="day"
            class="px-1 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)] sm:px-2 sm:py-2 sm:text-xs"
          >
            {{ day }}
          </div>
        </div>

        <!-- DAYS -->
        <div class="grid grid-cols-7 gap-1 sm:gap-2">
          <button
            v-for="cell in calendarCells"
            :key="cell.key"
            type="button"
            class="min-h-[56px] rounded-xl border p-1.5 text-left transition-all duration-200 sm:min-h-[96px] sm:rounded-2xl sm:p-3 lg:min-h-[112px]"
            :class="
              cell.inMonth
                ? 'border-[var(--color-border)] bg-[var(--color-surface)]/40 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)]'
                : 'cursor-default border-transparent bg-transparent'
            "
            :disabled="!cell.inMonth"
            @click="openDaySchedule(cell.dateISO)"
          >
            <div v-if="cell.inMonth" class="flex h-full flex-col justify-between">
              <div class="flex items-center justify-between gap-1">
                <span
                  class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold sm:h-8 sm:w-8 sm:text-sm"
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
                  class="rounded-full bg-[var(--color-primary)]/15 px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-primary)] sm:px-2 sm:py-1 sm:text-xs"
                >
                  {{ cell.summary.total }}
                </span>
              </div>

              <div v-if="cell.summary" class="hidden space-y-1 sm:block">
                <p class="text-xs text-[var(--color-text-secondary)]">
                  {{ cell.summary.total }} clase{{ cell.summary.total === 1 ? '' : 's' }}
                </p>

                <p v-if="cell.summary.special" class="text-xs text-[var(--color-text-secondary)]">
                  {{ cell.summary.special }} especial{{ cell.summary.special === 1 ? '' : 'es' }}
                </p>
              </div>
            </div>
          </button>
        </div>
      </template>

      <!-- AGENDA LIST -->
      <div v-else class="space-y-2">
        <button
          v-for="cell in calendarCells.filter((item) => item.inMonth)"
          :key="cell.key"
          type="button"
          class="flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/40 p-3 text-left transition hover:border-[var(--color-primary)]"
          @click="openDaySchedule(cell.dateISO)"
        >
          <span class="flex min-w-0 items-center gap-3">
            <span
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              :class="
                cell.isToday
                  ? 'bg-[var(--color-primary)] text-[var(--color-text)]'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text)]'
              "
            >
              {{ cell.dayNumber }}
            </span>

            <span class="min-w-0">
              <span class="block truncate text-sm font-semibold capitalize">
                {{ cell.weekday }}
              </span>

              <span class="block text-xs text-[var(--color-text-secondary)]">
                {{ cell.isToday ? 'Hoy' : 'Ver agenda' }}
              </span>
            </span>
          </span>

          <span
            v-if="cell.summary"
            class="shrink-0 rounded-full bg-[var(--color-primary)]/15 px-2 py-1 text-xs font-bold text-[var(--color-primary)]"
          >
            {{ cell.summary.total }} clase{{ cell.summary.total === 1 ? '' : 's' }}
          </span>

          <span v-else class="shrink-0 text-xs text-[var(--color-text-secondary)]">
            Sin clases
          </span>
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
