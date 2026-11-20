<script setup>
import { ref, watch } from 'vue'

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

const templateModalOpen = ref(false)
const templateName = ref('')
const templateColor = ref('#22c55e')
const templateDuration = ref(60)
const templateCapacity = ref(20)
const templateError = ref('')
const creatingTemplate = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) templateModalOpen.value = false
  },
)

const createTemplate = async () => {
  templateError.value = ''
  if (!templateName.value.trim()) {
    templateError.value = 'Escribe el nombre de la plantilla.'
    return
  }
  if (
    !Number.isInteger(Number(templateDuration.value)) ||
    Number(templateDuration.value) <= 0 ||
    !Number.isInteger(Number(templateCapacity.value)) ||
    Number(templateCapacity.value) <= 0
  ) {
    templateError.value = 'La duración y la capacidad deben ser números enteros mayores que cero.'
    return
  }
  if (creatingTemplate.value) return
  creatingTemplate.value = true
  try {
    // El mismo store y el mismo POST que utiliza Plantillas de clases.
    const created = await templateStore.addTemplate({
      name: templateName.value.trim(),
      color: templateColor.value,
      duration: templateDuration.value,
      capacity: templateCapacity.value,
    })
    selectedTemplate.value = created.id
    templateModalOpen.value = false
    templateName.value = ''
    templateColor.value = '#22c55e'
    templateDuration.value = 60
    templateCapacity.value = 20
  } catch (error) {
    templateError.value = error?.message || 'No fue posible crear la plantilla.'
  } finally {
    creatingTemplate.value = false
  }
}

const createClass = async () => {
  const template = templateStore.templates.find(
    (t) => String(t.id) === String(selectedTemplate.value),
  )
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

  try {
    await scheduleStore.addClass({
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
  } catch (error) {
    alert(error.message)
  }
}
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-black sm:text-3xl">Crear clase</h2>
        <p class="mt-2 text-[var(--color-text-secondary)]">{{ selectedDate }}</p>
      </div>

      <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <select
          v-model="selectedTemplate"
          aria-label="Seleccionar plantilla de clase"
          class="h-14 w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base"
        >
          <option :value="null">Selecciona plantilla</option>
          <option
            v-for="template in templateStore.templates"
            :key="template.id"
            :value="template.id"
          >
            {{ template.name }}
          </option>
        </select>
        <BaseButton variant="secondary" @click="templateModalOpen = true"
          >+ Nueva plantilla</BaseButton
        >
      </div>

      <div class="grid grid-cols-1 gap-4 xs:grid-cols-2">
        <BaseInput v-model="startTime" type="time" />
        <BaseInput v-model="endTime" type="time" />
      </div>

      <div class="space-y-2">
        <label class="text-[var(--color-text-secondary)]">Categoría</label>
        <select
          v-model="category"
          class="h-14 w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base"
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

      <BaseButton class="w-full" @click="createClass">Crear clase</BaseButton>
    </div>
  </BaseModal>

  <BaseModal :open="templateModalOpen && open" @close="templateModalOpen = false">
    <div class="space-y-5">
      <div>
        <h2 class="text-2xl font-black">Nueva plantilla de clase</h2>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)]">
          Crea una plantilla y quedará seleccionada para esta clase.
        </p>
      </div>
      <label class="block space-y-2 text-sm font-semibold">
        <span>Nombre de la plantilla</span>
        <BaseInput v-model="templateName" placeholder="Ej. Entrenamiento funcional" />
      </label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block space-y-2 text-sm font-semibold">
          <span>Color</span>
          <input
            v-model="templateColor"
            type="color"
            class="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        </label>
        <label class="block space-y-2 text-sm font-semibold">
          <span>Duración (minutos)</span>
          <BaseInput v-model="templateDuration" type="number" placeholder="60" />
        </label>
      </div>
      <label class="block space-y-2 text-sm font-semibold">
        <span>Capacidad</span>
        <BaseInput v-model="templateCapacity" type="number" placeholder="20" />
      </label>
      <p v-if="templateError" role="alert" class="text-sm text-red-400">{{ templateError }}</p>
      <div class="flex flex-wrap justify-end gap-3">
        <BaseButton variant="secondary" @click="templateModalOpen = false">Cancelar</BaseButton>
        <BaseButton :disabled="creatingTemplate" @click="createTemplate">
          {{ creatingTemplate ? 'Creando...' : 'Guardar plantilla' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
