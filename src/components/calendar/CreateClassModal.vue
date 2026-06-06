<script setup>
import { ref } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'

import BaseInput from '@/components/ui/BaseInput.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassTemplateStore } from '@/stores/useClassTemplateStore'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

import { classCategories } from '@/config/classCategories'

const props = defineProps({
  open: Boolean,

  selectedDate: String,
})

const emit = defineEmits(['close'])

const templateStore = useClassTemplateStore()

const scheduleStore = useClassScheduleStore()

const selectedTemplate = ref(null)

const startTime = ref('06:00')

const endTime = ref('07:00')

const category = ref('normal')

const createClass = () => {
  const template = templateStore.templates.find((t) => t.id === Number(selectedTemplate.value))

  if (!template) {
    alert('Selecciona una plantilla antes de continuar')

    return
  }

  const [year, month, day] = props.selectedDate.split('-').map(Number)

  const [hour, minute] = startTime.value.split(':').map(Number)

  const classDateTime = new Date(year, month - 1, day, hour, minute)

  const now = new Date()

  if (classDateTime < now) {
    alert('No puedes crear clases en fechas u horarios pasados')

    return
  }

  const start = new Date(`${props.selectedDate}T${startTime.value}`)

  const end = new Date(`${props.selectedDate}T${endTime.value}`)

  if (end <= start) {
    alert('La hora de finalización debe ser posterior a la hora de inicio')

    return
  }

  scheduleStore.addClass({
    templateId: template.id,

    name: template.name,

    color: template.color,

    capacity: template.capacity,

    date: props.selectedDate,

    startTime: startTime.value,

    endTime: endTime.value,

    category: category.value,

    attendees: [],
  })

  emit('close')
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="space-y-6">
      <div>
        <h2 class="text-3xl font-black">Crear clase</h2>

        <p class="text-[var(--color-text-secondary)] mt-2">
          {{ selectedDate }}
        </p>
      </div>

      <!-- TEMPLATE -->
      <select
        v-model="selectedTemplate"
        class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
      >
        <option :value="null">Selecciona plantilla</option>

        <option v-for="template in templateStore.templates" :key="template.id" :value="template.id">
          {{ template.name }}
        </option>
      </select>

      <!-- TIMES -->
      <div class="grid grid-cols-2 gap-4">
        <BaseInput v-model="startTime" type="time" />

        <BaseInput v-model="endTime" type="time" />
      </div>

      <div class="space-y-2">
        <label class="text-zinc-400"> Categoría </label>

        <select
          v-model="category"
          class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <option
            v-for="categoryOption in classCategories"
            :key="categoryOption.id"
            :value="categoryOption.id"
          >
            {{ categoryOption.name }}
          </option>
        </select>
      </div>

      <BaseButton class="w-full" @click="createClass"> Crear clase </BaseButton>
    </div>
  </BaseModal>
</template>
