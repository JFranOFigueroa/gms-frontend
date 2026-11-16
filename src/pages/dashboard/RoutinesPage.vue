<script setup>
import { ref } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import RoutineDayEditor from '@/components/dashboard/RoutineDayEditor.vue'
import { parseRoutineCsv } from '@/utils/routineCsv'
import csvTemplateUrl from '@/assets/plantilla_rutinas_propuesta.csv?url'
import { useRoutineStore } from '@/stores/useRoutineStore'

const routineStore = useRoutineStore()

const modalOpen = ref(false)
const actionError = ref('')
const formError = ref('')
const importMessage = ref('')
const saving = ref(false)
const editingId = ref(null)
const csvInput = ref(null)
const dayEditors = ref([])

const name = ref('')
const description = ref('')
const level = ref('beginner')
const goal = ref('')
const published = ref(true)
let nextDayId = 0
const createDay = (day, exercises = []) => ({
  localId: ++nextDayId,
  day,
  exercises: exercises.map((exercise) => ({
    name: String(exercise.name ?? ''),
    sets: String(exercise.sets ?? ''),
    reps: String(exercise.reps ?? ''),
    rest: String(exercise.rest ?? ''),
    notes: String(exercise.notes ?? ''),
  })),
})
const days = ref([createDay('Día 1')])

const resetForm = () => {
  editingId.value = null
  name.value = ''
  description.value = ''
  level.value = 'beginner'
  goal.value = ''
  published.value = true
  days.value = [createDay('Día 1')]
  formError.value = ''
  importMessage.value = ''
}

const openCreate = () => {
  resetForm()
  modalOpen.value = true
}

const openEdit = (routine) => {
  resetForm()
  editingId.value = routine.id
  name.value = routine.name ?? ''
  description.value = routine.description ?? ''
  level.value = routine.level ?? 'beginner'
  goal.value = routine.goal ?? ''
  published.value = routine.published === true
  days.value = (routine.days || []).map((day) => createDay(day.day, day.exercises || []))
  modalOpen.value = true
}

const addDay = () => {
  days.value.push(createDay(`Día ${days.value.length + 1}`))
}

const removeDay = (index) => {
  days.value.splice(index, 1)
}

const importCsv = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = '' // Permite volver a seleccionar el mismo archivo.
  if (!file) return
  formError.value = ''
  importMessage.value = ''
  if (!/\.csv$/i.test(file.name)) {
    formError.value = 'Selecciona un archivo con extensión .csv.'
    return
  }
  if (file.size > 1024 * 1024) {
    formError.value = 'El CSV no debe superar 1 MB.'
    return
  }
  try {
    const parsed = parseRoutineCsv(await file.text())
    const hasExercises = days.value.some((day) => day.exercises.length > 0) ||
      dayEditors.value.some((editor) => editor?.hasPendingDraft?.())
    if (hasExercises && !window.confirm('Importar el CSV reemplazará los días y ejercicios actuales. ¿Deseas continuar?')) {
      return
    }
    days.value = parsed.days.map((day) => createDay(day.day, day.exercises))
    importMessage.value = `Se importaron ${parsed.exerciseCount} ejercicios en ${parsed.days.length} día(s). Revisa la rutina y presiona Guardar rutina.`
  } catch (error) {
    formError.value = error?.message || 'No se pudo leer el archivo CSV.'
  }
}

const saveRoutine = async () => {
  formError.value = ''
  if (!name.value.trim()) {
    formError.value = 'Escribe el nombre de la rutina.'
    return
  }
  if (saving.value) return
  for (const editor of dayEditors.value) {
    if (editor && !editor.commitDraft()) {
      formError.value = 'Revisa el ejercicio que estás capturando antes de guardar.'
      return
    }
  }

  // Se conserva exactamente el contrato original: solo day + exercises, sin estado visual.
  const payload = {
    name: name.value.trim(),
    description: description.value.trim(),
    level: level.value,
    goal: goal.value.trim(),
    published: published.value,
    days: days.value.map((day) => ({
      day: day.day.trim() || 'Día',
      exercises: day.exercises.map((exercise) => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.rest,
        notes: exercise.notes,
      })),
    })),
  }

  saving.value = true
  try {
    if (editingId.value) await routineStore.updateRoutine(editingId.value, payload)
    else await routineStore.addRoutine(payload)
    modalOpen.value = false
    resetForm()
    actionError.value = ''
  } catch (error) {
    formError.value = error?.message || 'No fue posible guardar la rutina.'
  } finally {
    saving.value = false
  }
}

const deleteRoutine = async (id) => {
  if (!confirm('¿Eliminar esta rutina?')) return
  try {
    await routineStore.removeRoutine(id)
    actionError.value = ''
  } catch (error) {
    actionError.value = error.message
  }
}
</script>

<template>
  <div class="space-y-8">
    <p v-if="actionError" role="alert" class="text-red-400">{{ actionError }}</p>
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-black sm:text-4xl">Rutinas</h1>

        <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
          Gestiona la biblioteca de rutinas generales
        </p>
      </div>

      <BaseButton @click="openCreate"> Nueva rutina </BaseButton>
    </div>

    <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="routine in routineStore.routines" :key="routine.id">
        <div class="space-y-4">
          <div>
            <h2 class="text-2xl font-bold">
              {{ routine.name }}
            </h2>

            <p class="text-[var(--color-text-secondary)] mt-1">
              {{ routine.level }} · {{ routine.goal || 'General' }}
            </p>
          </div>

          <p class="text-[var(--color-text-secondary)]">
            {{ routine.description }}
          </p>

          <p class="text-sm text-[var(--color-text-secondary)]">
            {{ routine.days.length }} días de entrenamiento
          </p>

          <div class="flex gap-3">
            <BaseButton variant="secondary" @click="openEdit(routine)"> Editar </BaseButton>

            <BaseButton variant="secondary" @click="deleteRoutine(routine.id)">
              Eliminar
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseModal :open="modalOpen" wide @close="modalOpen = false">
      <div class="space-y-6">
        <h2 class="text-2xl font-black sm:text-3xl">
          {{ editingId ? 'Editar rutina' : 'Nueva rutina' }}
        </h2>

        <BaseInput v-model="name" placeholder="Nombre de la rutina" />

        <textarea
          v-model="description"
          rows="3"
          class="w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none transition-all focus:border-[var(--color-primary)] sm:px-5 sm:py-4"
          placeholder="Descripción"
          aria-label="Descripción de la rutina"
        />

        <div class="grid gap-4 sm:grid-cols-2">
          <select
            v-model="level"
            aria-label="Nivel de la rutina"
            class="h-14 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
          >
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>

          <BaseInput v-model="goal" placeholder="Objetivo" />
        </div>

        <label class="flex items-center gap-3 text-sm">
          <input v-model="published" type="checkbox" /> Publicar para miembros
        </label>

        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h3 class="text-xl font-bold">Días</h3>
            <div class="flex flex-wrap items-center gap-2">
              <a
                :href="csvTemplateUrl"
                download="plantilla_rutinas_propuesta.csv"
                class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-semibold transition hover:bg-[var(--color-surface-hover)]"
              >
                ↓ Descargar plantilla CSV
              </a>
              <input
                ref="csvInput"
                type="file"
                accept=".csv,text/csv"
                class="sr-only"
                aria-label="Seleccionar archivo CSV de rutinas"
                @change="importCsv"
              />
              <BaseButton variant="secondary" @click="csvInput?.click()">↑ Importar CSV</BaseButton>
              <BaseButton variant="secondary" @click="addDay">Agregar día</BaseButton>
            </div>
          </div>
          <p class="text-xs text-[var(--color-text-secondary)]">
            El CSV debe usar exactamente: dia, ejercicio, series, repeticiones, descanso, notas.
            La importación reemplaza los días y ejercicios del formulario, pero no guarda la rutina automáticamente.
          </p>
          <p v-if="importMessage" role="status" class="text-sm text-[var(--color-primary)]">{{ importMessage }}</p>

          <RoutineDayEditor
            ref="dayEditors"
            v-for="(day, index) in days"
            :key="day.localId"
            :day="day"
            @update:day="days[index] = $event"
            @remove="removeDay(index)"
          />
          <p v-if="!days.length" class="text-sm text-[var(--color-text-secondary)]">
            No hay días agregados. Usa “Agregar día” o importa el CSV.
          </p>
        </div>

        <p v-if="formError" role="alert" class="text-sm text-red-400">{{ formError }}</p>
        <BaseButton class="w-full" :disabled="saving" @click="saveRoutine">
          {{ saving ? 'Guardando rutina...' : 'Guardar rutina' }}
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
