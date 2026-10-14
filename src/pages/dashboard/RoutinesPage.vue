<script setup>
import { ref } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useRoutineStore } from '@/stores/useRoutineStore'

const routineStore = useRoutineStore()

const modalOpen = ref(false)
const editingId = ref(null)

const name = ref('')
const description = ref('')
const level = ref('beginner')
const goal = ref('')
const days = ref([{ day: 'Día 1', exercisesText: '' }])

const resetForm = () => {
  editingId.value = null
  name.value = ''
  description.value = ''
  level.value = 'beginner'
  goal.value = ''
  days.value = [{ day: 'Día 1', exercisesText: '' }]
}

const openCreate = () => {
  resetForm()
  modalOpen.value = true
}

const openEdit = (routine) => {
  editingId.value = routine.id
  name.value = routine.name
  description.value = routine.description
  level.value = routine.level
  goal.value = routine.goal
  days.value = routine.days.map((day) => ({
    day: day.day,
    exercisesText: day.exercises
      .map((exercise) => `${exercise.name} | ${exercise.sets} | ${exercise.reps} | ${exercise.rest} | ${exercise.notes}`)
      .join('\n'),
  }))

  modalOpen.value = true
}

const addDay = () => {
  days.value.push({ day: `Día ${days.value.length + 1}`, exercisesText: '' })
}

const removeDay = (index) => {
  days.value.splice(index, 1)
}

const parseExercises = (text) => {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [exerciseName, sets, reps, rest, notes] = line.split('|').map((value) => value.trim())

      return {
        name: exerciseName || 'Ejercicio',
        sets: sets || '3',
        reps: reps || '10',
        rest: rest || '60s',
        notes: notes || '',
      }
    })
}

const saveRoutine = () => {
  if (!name.value.trim()) return

  const payload = {
    name: name.value.trim(),
    description: description.value.trim(),
    level: level.value,
    goal: goal.value.trim(),
    days: days.value.map((day) => ({
      day: day.day.trim() || 'Día',
      exercises: parseExercises(day.exercisesText),
    })),
  }

  if (editingId.value) {
    routineStore.updateRoutine(editingId.value, payload)
  } else {
    routineStore.addRoutine(payload)
  }

  modalOpen.value = false
  resetForm()
}

const deleteRoutine = (id) => {
  if (!confirm('¿Eliminar esta rutina?')) return

  routineStore.removeRoutine(id)
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between gap-4">
      <div>
        <h1 class="text-4xl font-black">Rutinas</h1>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Gestiona la biblioteca de rutinas generales
        </p>
      </div>

      <BaseButton @click="openCreate"> Nueva rutina </BaseButton>
    </div>

    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
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

            <BaseButton variant="secondary" @click="deleteRoutine(routine.id)"> Eliminar </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseModal :open="modalOpen" @close="modalOpen = false">
      <div class="space-y-6">
        <h2 class="text-3xl font-black">
          {{ editingId ? 'Editar rutina' : 'Nueva rutina' }}
        </h2>

        <BaseInput v-model="name" placeholder="Nombre de la rutina" />

        <textarea
          v-model="description"
          rows="3"
          class="w-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] px-5 py-4 outline-none focus:border-[var(--color-primary)] transition-all"
          placeholder="Descripción"
        />

        <div class="grid md:grid-cols-2 gap-4">
          <select v-model="level" class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>

          <BaseInput v-model="goal" placeholder="Objetivo" />
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-bold">Días</h3>

            <BaseButton variant="secondary" @click="addDay"> Agregar día </BaseButton>
          </div>

          <div
            v-for="(day, index) in days"
            :key="index"
            class="p-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 space-y-3"
          >
            <div class="flex items-center gap-3">
              <BaseInput v-model="day.day" placeholder="Nombre del día" />

              <BaseButton variant="secondary" @click="removeDay(index)"> ✕ </BaseButton>
            </div>

            <textarea
              v-model="day.exercisesText"
              rows="5"
              class="w-full rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] px-5 py-4 outline-none focus:border-[var(--color-primary)] transition-all"
              placeholder="Un ejercicio por línea: Nombre | series | reps | descanso | notas"
            />
          </div>
        </div>

        <BaseButton class="w-full" @click="saveRoutine"> Guardar rutina </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>