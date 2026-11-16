<script setup>
import { computed, ref, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  day: { type: Object, required: true },
})
const emit = defineEmits(['update:day', 'remove'])

const suggestedExercises = [
  'Sentadilla',
  'Press de banca',
  'Peso muerto',
  'Remo con mancuerna',
  'Press militar',
  'Plancha',
]

const newExercise = () => ({ name: '', sets: '3', reps: '10', rest: '60s', notes: '' })
const draft = ref(newExercise())
const editingIndex = ref(null)
const exerciseError = ref('')
const listId = computed(() => `routine-exercises-${props.day.localId}`)
const exercises = computed(() => props.day.exercises || [])

const updateDay = (changes) => emit('update:day', { ...props.day, ...changes })

const resetDraft = () => {
  draft.value = newExercise()
  editingIndex.value = null
  exerciseError.value = ''
}

const addOrUpdateExercise = () => {
  const item = Object.fromEntries(
    Object.entries(draft.value).map(([key, value]) => [key, String(value ?? '').trim()]),
  )
  if (!item.name || !item.sets || !item.reps || !item.rest) {
    exerciseError.value = 'Completa ejercicio, series, repeticiones y descanso.'
    return false
  }
  if (!/^[1-9]\d*$/.test(item.sets)) {
    exerciseError.value = 'Las series deben ser un número entero mayor que cero.'
    return false
  }
  const updated = [...exercises.value]
  if (editingIndex.value === null) updated.push(item)
  else updated[editingIndex.value] = item
  updateDay({ exercises: updated })
  resetDraft()
  return true
}

const editExercise = (index) => {
  const exercise = exercises.value[index]
  if (!exercise) return
  draft.value = {
    name: String(exercise.name ?? ''),
    sets: String(exercise.sets ?? ''),
    reps: String(exercise.reps ?? ''),
    rest: String(exercise.rest ?? ''),
    notes: String(exercise.notes ?? ''),
  }
  editingIndex.value = index
  exerciseError.value = ''
}

const deleteExercise = (index) => {
  updateDay({ exercises: exercises.value.filter((_, position) => position !== index) })
  if (editingIndex.value === index) resetDraft()
  else if (editingIndex.value !== null && editingIndex.value > index) editingIndex.value--
}

// Guardar la rutina también confirma un ejercicio que haya quedado escrito sin pulsar Agregar.
const hasPendingDraft = () => {
  const defaults = newExercise()
  return editingIndex.value !== null || Object.keys(defaults).some(
    (key) => String(draft.value[key] ?? '').trim() !== defaults[key],
  )
}
const commitDraft = () => !hasPendingDraft() || addOrUpdateExercise()
defineExpose({ commitDraft, hasPendingDraft })

// Cambiar de día (por ejemplo, después de una importación) nunca conserva un borrador antiguo.
watch(() => props.day.localId, resetDraft)
</script>

<template>
  <section class="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 sm:p-5">
    <div class="flex min-w-0 items-center gap-3">
      <input
        :value="day.day"
        type="text"
        class="h-12 min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 font-semibold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
        aria-label="Nombre del día"
        placeholder="Nombre del día"
        @input="updateDay({ day: $event.target.value })"
      />
      <button
        type="button"
        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] text-xl hover:border-red-400 hover:text-red-400"
        :aria-label="`Eliminar ${day.day || 'día'}`"
        title="Eliminar día"
        @click="emit('remove')"
      >
        ×
      </button>
    </div>

    <div class="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6">
      <div class="min-w-0 space-y-5">
        <div class="space-y-2">
          <label :for="`exercise-name-${day.localId}`" class="block text-sm font-semibold">
            Paso 1: <span class="font-normal">Seleccionar o escribir ejercicio</span>
          </label>
          <input
            :id="`exercise-name-${day.localId}`"
            v-model="draft.name"
            :list="listId"
            type="text"
            autocomplete="off"
            placeholder="Buscar o escribir un ejercicio..."
            class="h-12 w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-sm outline-none focus:border-[var(--color-primary)]"
          />
          <datalist :id="listId">
            <option v-for="suggestion in suggestedExercises" :key="suggestion" :value="suggestion" />
          </datalist>
          <p class="text-xs text-[var(--color-text-secondary)]">
            Seis ejercicios sugeridos o escribe cualquier otro nombre.
          </p>
        </div>

        <div class="space-y-2">
          <p class="text-sm font-semibold">Paso 2: <span class="font-normal">Configurar</span></p>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label class="block min-w-0 space-y-1 text-xs text-[var(--color-text-secondary)]">
              <span>Series</span>
              <input v-model="draft.sets" type="number" min="1" step="1" inputmode="numeric" placeholder="3" class="h-11 w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
            </label>
            <label class="block min-w-0 space-y-1 text-xs text-[var(--color-text-secondary)]">
              <span>Repeticiones</span>
              <input v-model="draft.reps" type="text" placeholder="10 o 8-12" class="h-11 w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
            </label>
            <label class="block min-w-0 space-y-1 text-xs text-[var(--color-text-secondary)]">
              <span>Descanso</span>
              <input v-model="draft.rest" type="text" placeholder="60s" class="h-11 w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
            </label>
          </div>
        </div>

        <label class="block space-y-2 text-sm font-semibold">
          <span>Notas del ejercicio <span class="font-normal text-[var(--color-text-secondary)]">(opcional)</span></span>
          <textarea
            v-model="draft.notes"
            rows="2"
            placeholder="Ej. Mantener la espalda recta"
            class="w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-normal outline-none focus:border-[var(--color-primary)]"
          />
        </label>
        <p v-if="exerciseError" role="alert" class="text-sm text-red-400">{{ exerciseError }}</p>
        <div class="flex flex-wrap gap-2">
          <BaseButton variant="secondary" @click="addOrUpdateExercise">
            {{ editingIndex === null ? '+ Agregar ejercicio' : 'Guardar ejercicio' }}
          </BaseButton>
          <BaseButton v-if="editingIndex !== null" variant="secondary" @click="resetDraft">
            Cancelar edición
          </BaseButton>
        </div>
      </div>

      <div class="min-w-0 space-y-3 border-t border-[var(--color-border)] pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <div class="flex items-center justify-between gap-2">
          <h4 class="text-sm font-bold">Ejercicios ({{ day.day || 'Día' }})</h4>
          <span class="rounded-full bg-[var(--color-surface-hover)] px-2.5 py-1 text-xs font-semibold">{{ exercises.length }}</span>
        </div>
        <p v-if="!exercises.length" class="py-4 text-sm text-[var(--color-text-secondary)]">
          Todavía no hay ejercicios en este día.
        </p>
        <ul v-else class="divide-y divide-[var(--color-border)]">
          <li v-for="(exercise, index) in exercises" :key="index" class="flex items-start justify-between gap-2 py-3">
            <div class="min-w-0 space-y-0.5">
              <p class="break-words text-sm font-semibold">{{ exercise.name }}</p>
              <p class="text-xs text-[var(--color-text-secondary)]">{{ exercise.sets }} series · {{ exercise.reps }} rep · {{ exercise.rest }}</p>
              <p v-if="exercise.notes" class="break-words text-xs text-[var(--color-text-secondary)]">Nota: {{ exercise.notes }}</p>
            </div>
            <div class="flex shrink-0 gap-1">
              <button type="button" class="rounded-lg px-2 py-1 text-xs hover:bg-[var(--color-surface-hover)]" :aria-label="`Editar ${exercise.name}`" title="Editar ejercicio" @click="editExercise(index)">✎</button>
              <button type="button" class="rounded-lg px-2 py-1 text-xs hover:bg-red-500/10 hover:text-red-400" :aria-label="`Eliminar ${exercise.name}`" title="Eliminar ejercicio" @click="deleteExercise(index)">✕</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
