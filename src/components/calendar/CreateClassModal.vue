<script setup>
import { ref } from 'vue'

import BaseModal from '@/components/ui/BaseModal.vue'

import BaseInput from '@/components/ui/BaseInput.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassTemplateStore } from '@/stores/useClassTemplateStore'

import { useClassScheduleStore } from '@/stores/useClassScheduleStore'

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

const createClass = () => {
  const template = templateStore.templates.find((t) => t.id === Number(selectedTemplate.value))

  if (!template) return

  scheduleStore.addClass({
    templateId: template.id,

    name: template.name,

    color: template.color,

    capacity: template.capacity,

    date: props.selectedDate,

    startTime: startTime.value,

    endTime: endTime.value,

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

        <p class="text-zinc-500 mt-2">
          {{ selectedDate }}
        </p>
      </div>

      <!-- TEMPLATE -->
      <select
        v-model="selectedTemplate"
        class="w-full h-14 px-4 rounded-2xl bg-zinc-900 border border-zinc-800"
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

      <BaseButton class="w-full" @click="createClass"> Crear clase </BaseButton>
    </div>
  </BaseModal>
</template>
