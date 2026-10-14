import { defineStore } from 'pinia'

const createExercise = (name, sets, reps, rest, notes = '') => ({
  name,
  sets,
  reps,
  rest,
  notes,
})

const createDay = (day, exercises) => ({
  day,
  exercises,
})

export const useRoutineStore = defineStore(
  'routines',

  {
    state: () => ({
      routines: [
        {
          id: 1,
          name: 'Rutina 3 días',
          description: 'Rutina general de cuerpo completo para empezar a entrenar.',
          level: 'beginner',
          goal: 'Condición general',
          days: [
            createDay('Día 1', [
              createExercise('Sentadilla', '4', '12', '60s', 'Controlar la bajada'),
              createExercise('Press de banca', '3', '10', '90s', ''),
              createExercise('Remo con barra', '3', '10', '90s', ''),
            ]),
            createDay('Día 2', [
              createExercise('Prensa de pierna', '4', '12', '60s', ''),
              createExercise('Press militar', '3', '10', '90s', ''),
              createExercise('Jalón al pecho', '3', '10', '90s', ''),
            ]),
            createDay('Día 3', [
              createExercise('Peso muerto rumano', '4', '10', '90s', ''),
              createExercise('Fondos', '3', '12', '60s', ''),
              createExercise('Plancha', '3', '45s', '60s', ''),
            ]),
          ],
          published: true,
          createdAt: '2026-01-01',
          createdBy: 'Admin',
        },
        {
          id: 2,
          name: 'Rutina 4 días (Avanzado)',
          description: 'Rutina dividida para mayor volumen y fuerza.',
          level: 'advanced',
          goal: 'Hipertrofia',
          days: [
            createDay('Lunes', [
              createExercise('Sentadilla', '5', '8', '120s', ''),
              createExercise('Prensa', '4', '12', '90s', ''),
              createExercise('Extensiones de cuádriceps', '3', '15', '60s', ''),
            ]),
            createDay('Martes', [
              createExercise('Press de banca', '5', '8', '120s', ''),
              createExercise('Aperturas con mancuernas', '4', '12', '90s', ''),
              createExercise('Tríceps en polea', '3', '12', '60s', ''),
            ]),
            createDay('Jueves', [
              createExercise('Peso muerto', '5', '6', '120s', ''),
              createExercise('Remo con mancuerna', '4', '10', '90s', ''),
              createExercise('Curl de bíceps', '3', '12', '60s', ''),
            ]),
            createDay('Viernes', [
              createExercise('Press militar', '4', '10', '90s', ''),
              createExercise('Elevaciones laterales', '4', '15', '60s', ''),
              createExercise('Dominadas', '3', '8', '120s', ''),
            ]),
          ],
          published: true,
          createdAt: '2026-01-05',
          createdBy: 'Admin',
        },
      ],
    }),

    persist: true,

    getters: {
      publishedRoutines: (state) => state.routines.filter((routine) => routine.published),
    },

    actions: {
      addRoutine(payload) {
        this.routines.push({
          id: Date.now(),
          published: true,
          createdAt: new Date().toISOString().split('T')[0],
          createdBy: 'Admin',
          ...payload,
        })
      },

      updateRoutine(id, payload) {
        const index = this.routines.findIndex((routine) => routine.id === id)

        if (index === -1) return

        this.routines[index] = {
          ...this.routines[index],
          ...payload,
        }
      },

      removeRoutine(id) {
        this.routines = this.routines.filter((routine) => routine.id !== id)
      },
    },
  },
)