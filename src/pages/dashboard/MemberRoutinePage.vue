<script setup>
import { computed, ref } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import { useRoutineStore } from '@/stores/useRoutineStore'

const routineStore = useRoutineStore()

const search = ref('')

const routines = computed(() => routineStore.publishedRoutines)

const normalize = (value) =>
  String(value ?? '')
    .toLowerCase()
    .trim()

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
      <h1 class="text-3xl font-black sm:text-4xl">Mi Rutina</h1>

      <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
        Consulta las rutinas generales disponibles para tu entrenamiento
      </p>
    </div>

    <div class="max-w-xl">
      <BaseInput v-model="search" placeholder="Buscar por nombre, ejercicio, días..." />
    </div>

    <div
      v-if="!routines.length"
      class="py-10 text-center text-[var(--color-text-secondary)] sm:py-16"
    >
      Aún no hay rutinas disponibles
    </div>

    <div
      v-else-if="!filteredRoutines.length"
      class="py-10 text-center text-[var(--color-text-secondary)] sm:py-16"
    >
      No se encontraron rutinas para esta búsqueda
    </div>

    <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="routine in filteredRoutines" :key="routine.id">
        <button
          type="button"
          class="flex w-full items-start justify-between gap-3 text-left sm:gap-4"
          @click="toggleRoutine(routine.id)"
        >
          <div class="min-w-0">
            <h2 class="break-words text-xl font-bold sm:text-2xl">
              {{ routine.name }}
            </h2>

            <p class="mt-1 break-words text-sm text-[var(--color-text-secondary)] sm:text-base">
              {{ levelLabel[routine.level] || routine.level }} · {{ routine.goal || 'General' }}
            </p>
          </div>

          <span class="shrink-0 text-2xl text-[var(--color-text-secondary)]">
            {{ isExpanded(routine.id) ? '▾' : '▸' }}
          </span>
        </button>

        <div v-if="isExpanded(routine.id)" class="mt-5 space-y-5">
          <p class="break-words text-[var(--color-text-secondary)]">
            {{ routine.description }}
          </p>

          <div
            v-for="day in routine.days"
            :key="day.day"
            class="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 sm:p-5"
          >
            <h3 class="break-words text-lg font-bold sm:text-xl">
              {{ day.day }}
            </h3>

            <div v-if="!day.exercises.length" class="text-[var(--color-text-secondary)]">
              Sin ejercicios registrados
            </div>

            <div
              v-for="exercise in day.exercises"
              :key="exercise.name"
              class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
            >
              <div class="min-w-0">
                <p class="break-words font-semibold">
                  {{ exercise.name }}
                </p>

                <p v-if="exercise.notes" class="break-words text-sm text-[var(--color-text-secondary)]">
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
