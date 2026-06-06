<script setup>
import { computed } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

import { useAuthStore } from '@/stores/useAuthStore'

const props = defineProps({
  open: Boolean,

  classId: [String, Number],
})

const emit = defineEmits(['close'])

const scheduleStore = useClassScheduleStore()

const authStore = useAuthStore()

const gymClass = computed(() => {
  return scheduleStore.classes.find((c) => c.id === Number(props.classId))
})

const alreadyBooked = computed(() => {
  if (!gymClass.value) return false

  return gymClass.value.attendees.includes(authStore.user?.id)
})

const spotsLeft = computed(() => {
  if (!gymClass.value) return 0

  return gymClass.value.capacity - gymClass.value.attendees.length
})

const bookClass = () => {
  if (!gymClass.value) return

  if (alreadyBooked.value) return

  gymClass.value.attendees.push(authStore.user.id)
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div v-if="gymClass" class="space-y-6">
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
      <div class="space-y-2 text-zinc-400">
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
          {{ gymClass.attendees.length }}
        </p>

        <p>
          Lugares disponibles:
          {{ spotsLeft }}
        </p>
      </div>

      <!-- ACTION -->
      <BaseButton class="w-full" :disabled="alreadyBooked || spotsLeft <= 0" @click="bookClass">
        {{ alreadyBooked ? 'Ya reservado' : spotsLeft <= 0 ? 'Clase llena' : 'Reservar clase' }}
      </BaseButton>
    </div>
  </BaseModal>
</template>
