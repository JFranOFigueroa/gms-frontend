<script setup>
import { computed, ref } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import { useRoutineStore } from '@/stores/useRoutineStore'

const routineStore = useRoutineStore()

const search = ref('')

const routines = computed(() => routineStore.publishedRoutines)

const normalize = (value) => String(value ?? '').toLowerCase().trim()

const filteredRoutines = computed(() => {
  const query = normalize(search.value)

  if (!query) return routines.value

  return routines.value.filter((routine) => {
    const haystack = [
      routine.name,
      routine.description,
      routine.goal,
      routine.level,
      ...routine.days.flatMap((day) => [
        day.day,
        ...day.exercises.flatMap((exercise) => [
          exercise.name,
          exercise.notes,
          exercise.sets,
          exercise.reps,
        ]),
      ]),
    ]
      .map(normalize)
      .join(' ')

    return haystack.includes(query)
  })
})

const expandedRoutines = ref(new Set())

const toggleRoutine = (routineId) => {
  const next = new Set(expandedRoutines.value)

  if (next.has(routineId)) {
    next.delete(routineId)
  } else {
    next.add(routineId)
  }

  expandedRoutines.value = next
}

const isExpanded = (routineId) => expandedRoutines.value.has(routineId)

const levelLabel = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-black">Mi Rutina</h1>

      <p class="text-[var(--color-text-secondary)] mt-2">
        Consulta las rutinas generales disponibles para tu entrenamiento
      </p>
    </div>

    <div class="max-w-xl">
      <BaseInput v-model="search" placeholder="Buscar por nombre, ejercicio, días..." />
    </div>

    <div v-if="!routines.length" class="text-center py-16 text-[var(--color-text-secondary)]">
      Aún no hay rutinas disponibles
    </div>

    <div v-else-if="!filteredRoutines.length" class="text-center py-16 text-[var(--color-text-secondary)]">
      No se encontraron rutinas para esta búsqueda
    </div>

    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="routine in filteredRoutines" :key="routine.id">
        <button
          type="button"
          class="w-full text-left flex items-start justify-between gap-4"
          @click="toggleRoutine(routine.id)"
        >
          <div>
            <h2 class="text-2xl font-bold">
              {{ routine.name }}
            </h2>

            <p class="text-[var(--color-text-secondary)] mt-1">
              {{ levelLabel[routine.level] || routine.level }} · {{ routine.goal || 'General' }}
            </p>
          </div>

          <span class="text-2xl text-[var(--color-text-secondary)]">
            {{ isExpanded(routine.id) ? '▾' : '▸' }}
          </span>
        </button>

        <div v-if="isExpanded(routine.id)" class="space-y-5 mt-5">
          <p class="text-[var(--color-text-secondary)]">
            {{ routine.description }}
          </p>

          <div
            v-for="day in routine.days"
            :key="day.day"
            class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-5 space-y-3"
          >
            <h3 class="text-xl font-bold">
              {{ day.day }}
            </h3>

            <div v-if="!day.exercises.length" class="text-[var(--color-text-secondary)]">
              Sin ejercicios registrados
            </div>

            <div v-for="exercise in day.exercises" :key="exercise.name" class="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <p class="font-semibold">
                  {{ exercise.name }}
                </p>

                <p v-if="exercise.notes" class="text-sm text-[var(--color-text-secondary)]">
                  {{ exercise.notes }}
                </p>
              </div>

              <div class="text-sm text-[var(--color-text-secondary)]">
                {{ exercise.sets }} series · {{ exercise.reps }} reps · {{ exercise.rest }} descanso
              </div>
            </div>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>