<script setup>
import { computed, ref, watch } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

import { useAuthStore } from '@/stores/useAuthStore'
import { useMyReservationsStore } from '@/stores/useMyReservationsStore'

import CreateClassModal from '@/components/calendar/CreateClassModal.vue'

import { classCategories } from '@/config/classCategories'
import { todayISO } from '@/utils/date'

const categoryMap = Object.fromEntries(classCategories.map((category) => [category.id, category]))

const getCategory = (id) => categoryMap[id]

const createModalOpen = ref(false)

const props = defineProps({
  open: Boolean,

  selectedDay: String,
})

const emit = defineEmits(['close'])

const scheduleStore = useClassScheduleStore()

const authStore = useAuthStore()
const myReservations = useMyReservationsStore()
const availabilityFor = (id) => scheduleStore.availabilityByClass[id]
const myReservation = (id) => myReservations.findByClass(id)
const ownStatus = (id) => availabilityFor(id)?.myReservationStatus || myReservation(id)?.status
const isBookable = (c) => {
  const a = availabilityFor(c.id)
  return !!a && a.bookable === true && !isClassPast(c)
}
const cancelOwn = async (branchClass) => {
  const own = myReservation(branchClass.id)
  if (!own?.id) {
    alert('Actualiza tus reservas antes de cancelar.')
    return
  }
  if (!confirm('¿Cancelar la reserva de esta clase?')) return
  try {
    await myReservations.cancel(own.id)
    await scheduleStore.loadAvailability(branchClass.id)
  } catch (e) {
    alert(e.message)
  }
}

const dayClasses = computed(() => {
  return scheduleStore.classes.filter((branchClass) => branchClass.date === props.selectedDay)
})

const canManage = computed(() => {
  return ['admin', 'owner', 'trainer'].includes(authStore.role)
})
// Los miembros consultan cupos anónimos (sin listas de asistentes).
watch(
  () => [props.open, props.selectedDay, dayClasses.value.map((c) => c.id).join(',')],
  async () => {
    if (!props.open) return
    const tasks = dayClasses.value.map((c) => scheduleStore.loadAvailability(c.id))
    if (canManage.value)
      tasks.push(...dayClasses.value.map((c) => scheduleStore.loadReservationsForClass(c.id)))
    else if (props.selectedDay)
      tasks.push(myReservations.load(undefined, { from: props.selectedDay, to: props.selectedDay }))
    await Promise.allSettled(tasks)
  },
  { immediate: true },
)

const isPastDay = computed(() => {
  if (!props.selectedDay) return false

  const today = todayISO()

  return props.selectedDay < today
})

const isClassPast = (branchClass) => {
  const [year, month, day] = branchClass.date.split('-').map(Number)

  const [hour, minute] = branchClass.startTime.split(':').map(Number)

  const classDateTime = new Date(year, month - 1, day, hour, minute)

  return classDateTime < new Date()
}

const bookClass = async (branchClass) => {
  const [year, month, day] = branchClass.date.split('-').map(Number)

  const [hour, minute] = branchClass.startTime.split(':').map(Number)

  const classDateTime = new Date(year, month - 1, day, hour, minute)

  const now = new Date()

  if (classDateTime < now) {
    alert('No puedes reservar una clase que ya comenzó o terminó')

    return
  }

  try {
    await scheduleStore.bookClass(branchClass.id)
    await myReservations.load(undefined, { from: props.selectedDay, to: props.selectedDay })
    alert('Reserva registrada en el servidor.')
  } catch (error) {
    alert(error.message)
  }
}

const removeClass = async (classId) => {
  try {
    await scheduleStore.removeClass(classId)
  } catch (error) {
    alert(error.message)
  }
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="space-y-8">
      <!-- HEADER -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <h2 class="text-2xl font-black sm:text-4xl">Agenda del día</h2>

          <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
            {{ selectedDay }}

            <span v-if="isPastDay" class="ml-2 text-red-400"> (Fecha pasada) </span>
          </p>
        </div>

        <!-- CREATE -->
        <BaseButton v-if="canManage && !isPastDay" @click="createModalOpen = true">
          Nueva clase
        </BaseButton>
      </div>

      <!-- EMPTY -->
      <div
        v-if="!dayClasses.length"
        class="py-10 text-center text-[var(--color-text-secondary)] sm:py-16"
      >
        No existen clases para este día
      </div>

      <!-- CLASS LIST -->
      <div v-else class="space-y-4">
        <div
          v-for="branchClass in dayClasses"
          :key="branchClass.id"
          class="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 sm:p-6"
        >
          <!-- TOP -->
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div class="flex min-w-0 items-center gap-3 sm:gap-4">
              <div
                class="h-5 w-5 shrink-0 rounded-full"
                :style="{
                  background: branchClass.color,
                }"
              />

              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                  <h3 class="break-words text-xl font-bold sm:text-2xl">
                    {{ branchClass.name }}
                  </h3>

                  <!-- SPECIAL -->
                  <span
                    v-if="branchClass.category !== 'normal'"
                    class="px-3 py-1 rounded-full text-xs border font-semibold"
                    :class="{
                      'bg-amber-500/20 text-amber-300 border-amber-500/20':
                        getCategory(branchClass.category)?.color === 'amber',

                      'bg-cyan-500/20 text-cyan-300 border-cyan-500/20':
                        getCategory(branchClass.category)?.color === 'cyan',

                      'bg-rose-500/20 text-rose-300 border-rose-500/20':
                        getCategory(branchClass.category)?.color === 'rose',
                    }"
                  >
                    {{ getCategory(branchClass.category)?.badge }}
                  </span>
                </div>

                <p class="text-[var(--color-text-secondary)] mt-1">
                  {{ branchClass.startTime }}
                  -
                  {{ branchClass.endTime }}
                </p>
              </div>
            </div>

            <!-- DELETE -->
            <BaseButton
              v-if="canManage"
              variant="secondary"
              class="self-start"
              @click="removeClass(branchClass.id)"
            >
              Eliminar
            </BaseButton>
          </div>

          <!-- STATS -->
          <div class="flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
            <div>
              Capacidad:
              {{ branchClass.capacity }}
            </div>

            <div>
              Inscritos:
              {{ availabilityFor(branchClass.id)?.reserved ?? branchClass.attendeeCount ?? '—' }}
            </div>

            <div>
              Disponibles:
              {{
                availabilityFor(branchClass.id)?.available ??
                (branchClass.attendeeCount == null
                  ? '—'
                  : branchClass.capacity - branchClass.attendeeCount)
              }}
            </div>
          </div>

          <!-- ACCIÓN PROPIA: confirmar siempre en backend, no en estado local. -->
          <div v-if="!canManage" class="space-y-2">
            <BaseButton
              v-if="ownStatus(branchClass.id) === 'booked'"
              variant="secondary"
              class="w-full"
              :disabled="!myReservation(branchClass.id)"
              @click="cancelOwn(branchClass)"
            >
              Cancelar mi reserva
            </BaseButton>
            <BaseButton
              v-else
              class="w-full"
              :disabled="!isBookable(branchClass)"
              @click="bookClass(branchClass)"
            >
              {{
                ownStatus(branchClass.id)
                  ? 'Ya reservado'
                  : isClassPast(branchClass)
                    ? 'Clase iniciada'
                    : availabilityFor(branchClass.id)
                      ? availabilityFor(branchClass.id).available === 0
                        ? 'Clase llena'
                        : availabilityFor(branchClass.id).bookable
                          ? 'Reservar clase'
                          : 'No disponible'
                      : 'Consultando cupos…'
              }}
            </BaseButton>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
  <CreateClassModal
    :open="createModalOpen"
    :selectedDate="selectedDay"
    @close="createModalOpen = false"
  />
</template>
