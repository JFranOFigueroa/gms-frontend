<script setup>
import { computed, watch, ref } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

import { useAuthStore } from '@/stores/useAuthStore'
import { useMyReservationsStore } from '@/stores/useMyReservationsStore'

const props = defineProps({
  open: Boolean,

  classId: [String, Number],
})

const emit = defineEmits(['close'])

const scheduleStore = useClassScheduleStore()

const authStore = useAuthStore()
const mine = useMyReservationsStore()
const busy = ref(false)
const error = ref('')

const gymClass = computed(() => {
  return scheduleStore.classes.find((c) => String(c.id) === String(props.classId))
})

const availability = computed(() => scheduleStore.availabilityByClass[gymClass.value?.id])
const alreadyBooked = computed(() => Boolean(availability.value?.myReservationStatus))
const spotsLeft = computed(() => availability.value?.available ?? null)
watch(
  () => [props.open, props.classId, gymClass.value?.id],
  async () => {
    if (props.open && gymClass.value) {
      error.value = ''
      try {
        await scheduleStore.loadAvailability(gymClass.value.id)
      } catch (e) {
        error.value = e.message
      }
    }
  },
  { immediate: true },
)
const bookClass = async () => {
  if (!gymClass.value || !availability.value?.bookable || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await scheduleStore.bookClass(gymClass.value.id)
    await mine.load()
  } catch (e) {
    error.value = e.message
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div v-if="gymClass" class="space-y-6">
      <p v-if="error" role="alert" class="text-red-400">{{ error }}</p>
      <div>
        <div class="flex items-center gap-4">
          <div
            class="w-5 h-5 rounded-full"
            :style="{
              background: gymClass.color,
            }"
          />

          <h2 class="text-4xl font-black">
            {{ gymClass.name }}
          </h2>
        </div>

        <p class="text-[var(--color-text-secondary)] mt-2">
          {{ gymClass.date }}
        </p>
      </div>

      <!-- INFO -->
      <div class="space-y-2 text-[var(--color-text-secondary)]">
        <p>
          Horario:
          {{ gymClass.startTime }}
          -
          {{ gymClass.endTime }}
        </p>

        <p>
          Capacidad:
          {{ gymClass.capacity }}
        </p>

        <p>
          Inscritos:
          {{ availability?.reserved ?? '—' }}
        </p>

        <p>
          Lugares disponibles:
          {{ spotsLeft ?? '—' }}
        </p>
      </div>

      <!-- ACTION -->
      <BaseButton class="w-full" :disabled="busy || !availability?.bookable" @click="bookClass">
        {{
          alreadyBooked
            ? 'Ya reservado'
            : spotsLeft === 0
              ? 'Clase llena'
              : availability
                ? 'Reservar clase'
                : 'Consultando…'
        }}
      </BaseButton>
    </div>
  </BaseModal>
</template>
