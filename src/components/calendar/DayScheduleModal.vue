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
const cancelOwn = async (gymClass) => {
  const own=myReservation(gymClass.id)
  if(!own?.id) { alert('Actualiza tus reservas antes de cancelar.'); return }
  if(!confirm('¿Cancelar la reserva de esta clase?'))return
  try { await myReservations.cancel(own.id); await scheduleStore.loadAvailability(gymClass.id) }
  catch(e){alert(e.message)}
}

const dayClasses = computed(() => {
  return scheduleStore.classes.filter((gymClass) => gymClass.date === props.selectedDay)
})

const canManage = computed(() => {
  return ['admin', 'owner', 'trainer'].includes(authStore.role)
})
// Los miembros consultan cupos anónimos (sin listas de asistentes).
watch(() => [props.open, props.selectedDay, dayClasses.value.map(c=>c.id).join(',')], async () => {
  if (!props.open) return
  const tasks=dayClasses.value.map(c=>scheduleStore.loadAvailability(c.id))
  if (canManage.value) tasks.push(...dayClasses.value.map(c=>scheduleStore.loadReservationsForClass(c.id)))
  else if(props.selectedDay) tasks.push(myReservations.load(undefined,{from:props.selectedDay,to:props.selectedDay}))
  await Promise.allSettled(tasks)
}, { immediate: true })

const isPastDay = computed(() => {
  if (!props.selectedDay) return false

  const today = todayISO()

  return props.selectedDay < today
})

const isClassPast = (gymClass) => {
  const [year, month, day] = gymClass.date.split('-').map(Number)

  const [hour, minute] = gymClass.startTime.split(':').map(Number)

  const classDateTime = new Date(year, month - 1, day, hour, minute)

  return classDateTime < new Date()
}

const bookClass = async (gymClass) => {
  const [year, month, day] = gymClass.date.split('-').map(Number)

  const [hour, minute] = gymClass.startTime.split(':').map(Number)

  const classDateTime = new Date(year, month - 1, day, hour, minute)

  const now = new Date()

  if (classDateTime < now) {
    alert('No puedes reservar una clase que ya comenzó o terminó')

    return
  }

  try { await scheduleStore.bookClass(gymClass.id)
    await myReservations.load(undefined,{from:props.selectedDay,to:props.selectedDay})
    alert('Reserva registrada en el servidor.');
  } catch(error) { alert(error.message) }
}

const removeClass = async (classId) => {
  try { await scheduleStore.removeClass(classId) } catch(error) { alert(error.message) }
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="space-y-8">
      <!-- HEADER -->
      <div class="flex items-center justify-between gap-4">
        <div>
          <h2 class="text-4xl font-black">Agenda del día</h2>

          <p class="text-[var(--color-text-secondary)] mt-2">
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
      <div v-if="!dayClasses.length" class="text-center py-16 text-[var(--color-text-secondary)]">
        No existen clases para este día
      </div>

      <!-- CLASS LIST -->
      <div v-else class="space-y-4">
        <div
          v-for="gymClass in dayClasses"
          :key="gymClass.id"
          class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-6 space-y-4"
        >
          <!-- TOP -->
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div
                class="w-5 h-5 rounded-full"
                :style="{
                  background: gymClass.color,
                }"
              />

              <div>
                <div class="flex items-center gap-3">
                  <h3 class="text-2xl font-bold">
                    {{ gymClass.name }}
                  </h3>

                  <!-- SPECIAL -->
                  <span
                    v-if="gymClass.category !== 'normal'"
                    class="px-3 py-1 rounded-full text-xs border font-semibold"
                    :class="{
                      'bg-amber-500/20 text-amber-300 border-amber-500/20':
                        getCategory(gymClass.category)?.color === 'amber',

                      'bg-cyan-500/20 text-cyan-300 border-cyan-500/20':
                        getCategory(gymClass.category)?.color === 'cyan',

                      'bg-rose-500/20 text-rose-300 border-rose-500/20':
                        getCategory(gymClass.category)?.color === 'rose',
                    }"
                  >
                    {{ getCategory(gymClass.category)?.badge }}
                  </span>
                </div>

                <p class="text-[var(--color-text-secondary)] mt-1">
                  {{ gymClass.startTime }}
                  -
                  {{ gymClass.endTime }}
                </p>
              </div>
            </div>

            <!-- DELETE -->
            <BaseButton v-if="canManage" variant="secondary" @click="removeClass(gymClass.id)">
              Eliminar
            </BaseButton>
          </div>

          <!-- STATS -->
          <div class="flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
            <div>
              Capacidad:
              {{ gymClass.capacity }}
            </div>

            <div>
              Inscritos:
              {{ availabilityFor(gymClass.id)?.reserved ?? gymClass.attendeeCount ?? '—' }}
            </div>

            <div>
              Disponibles:
              {{ availabilityFor(gymClass.id)?.available ?? (gymClass.attendeeCount == null ? '—' : gymClass.capacity - gymClass.attendeeCount) }}
            </div>
          </div>

          <!-- ACCIÓN PROPIA: confirmar siempre en backend, no en estado local. -->
          <div v-if="!canManage" class="space-y-2">
            <BaseButton v-if="ownStatus(gymClass.id) === 'booked'" variant="secondary" class="w-full" :disabled="!myReservation(gymClass.id)" @click="cancelOwn(gymClass)">
              Cancelar mi reserva
            </BaseButton>
            <BaseButton v-else class="w-full" :disabled="!isBookable(gymClass)" @click="bookClass(gymClass)">
              {{ ownStatus(gymClass.id) ? 'Ya reservado' : isClassPast(gymClass) ? 'Clase iniciada' : availabilityFor(gymClass.id) ? (availabilityFor(gymClass.id).available === 0 ? 'Clase llena' : availabilityFor(gymClass.id).bookable ? 'Reservar clase' : 'No disponible') : 'Consultando cupos…' }}
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
