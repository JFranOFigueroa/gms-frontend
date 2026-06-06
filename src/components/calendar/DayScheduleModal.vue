<script setup>
import { computed, ref } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

import { useAuthStore } from '@/stores/useAuthStore'

import { useBookingValidation } from '@/composables/useBookingValidation'

import CreateClassModal from '@/components/calendar/CreateClassModal.vue'

import { classCategories } from '@/config/classCategories'

const categoryMap = Object.fromEntries(classCategories.map((category) => [category.id, category]))

const getCategory = (id) => categoryMap[id]

const { validateBooking } = useBookingValidation()

const createModalOpen = ref(false)

const props = defineProps({
  open: Boolean,

  selectedDay: String,
})

const emit = defineEmits(['close'])

const scheduleStore = useClassScheduleStore()

const authStore = useAuthStore()

const dayClasses = computed(() => {
  return scheduleStore.classes.filter((gymClass) => gymClass.date === props.selectedDay)
})

const canManage = computed(() => {
  return ['admin', 'trainer'].includes(authStore.role)
})

const isPastDay = computed(() => {
  if (!props.selectedDay) return false

  const today = new Date().toISOString().split('T')[0]

  return props.selectedDay < today
})

const isClassPast = (gymClass) => {
  const [year, month, day] = gymClass.date.split('-').map(Number)

  const [hour, minute] = gymClass.startTime.split(':').map(Number)

  const classDateTime = new Date(year, month - 1, day, hour, minute)

  return classDateTime < new Date()
}

const bookClass = (gymClass) => {
  const [year, month, day] = gymClass.date.split('-').map(Number)

  const [hour, minute] = gymClass.startTime.split(':').map(Number)

  const classDateTime = new Date(year, month - 1, day, hour, minute)

  const now = new Date()

  if (classDateTime < now) {
    alert('No puedes reservar una clase que ya comenzó o terminó')

    return
  }

  const userBookings = scheduleStore.classes.filter((booking) =>
    booking.attendees.includes(authStore.user.id),
  )

  const result = validateBooking({
    gymClass,
    userBookings,
    settings: {
      allowMultipleNormalClassesPerDay: false,
    },
    role: authStore.role,
  })

  if (!result.valid) {
    alert(result.reason)
    return
  }

  gymClass.attendees.push(authStore.user.id)
}

const removeClass = (classId) => {
  scheduleStore.removeClass(classId)
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
          <div class="flex flex-wrap gap-4 text-sm text-zinc-400">
            <div>
              Capacidad:
              {{ gymClass.capacity }}
            </div>

            <div>
              Inscritos:
              {{ gymClass.attendees.length }}
            </div>

            <div>
              Disponibles:
              {{ gymClass.capacity - gymClass.attendees.length }}
            </div>
          </div>

          <!-- ACTION -->
          <BaseButton
            v-if="!canManage"
            class="w-full"
            :disabled="
              gymClass.attendees.includes(authStore.user.id) ||
              gymClass.attendees.length >= gymClass.capacity ||
              isClassPast(gymClass)
            "
            @click="bookClass(gymClass)"
          >
            {{
              gymClass.attendees.includes(authStore.user.id)
                ? 'Ya reservado'
                : isClassPast(gymClass)
                  ? 'Clase En Curso o Finalizada'
                  : gymClass.attendees.length >= gymClass.capacity
                    ? 'Clase llena'
                    : 'Reservar clase'
            }}
          </BaseButton>
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
