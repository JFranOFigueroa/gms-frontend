import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapClass, mapReservation } from '@/api/mappers'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'
// Las fechas se envían con offset ISO 8601; nunca se inventan IDs ni asistentes.
const toOffset = (date, time) => {
  const dt = new Date(`${date}T${time}:00`)
  if (Number.isNaN(dt.getTime())) throw new Error('Fecha u hora inválida.')
  return dt.toISOString()
}
export const useClassScheduleStore = defineStore('class-schedule', {
  state: () => ({ allClasses: [], availabilityByClass: {} }),
  getters: { classes: (s) => s.allClasses.filter((c) => c.gymId === useGymsStore().activeGymId) },
  actions: {
    async load(gym = useGymsStore().activeGymId) {
      if (!gym) {
        this.allClasses = []
        return
      }
      const rows = await useIntegrationStore().track('clases', () => api.classes.list(gym))
      if (gym === useGymsStore().activeGymId) this.allClasses = rows.map(mapClass)
    },
    async loadRange(gym = useGymsStore().activeGymId, from, to) {
      if (!gym || !from || !to) return
      const rows = await useIntegrationStore().track('clases', () =>
        api.classes.listRange(gym, { from, to }),
      )
      if (gym !== useGymsStore().activeGymId) return
      // Conservar clases de otros meses ya consultados y actualizar el mes visible.
      this.allClasses = this.allClasses
        .filter((c) => c.gymId !== gym || c.date < from || c.date > to)
        .concat(rows.map(mapClass))
    },
    async loadAvailability(classId) {
      const gym = useGymsStore().activeGymId
      const result = await useIntegrationStore().track('disponibilidad', () =>
        api.classes.availability(gym, classId),
      )
      if (gym === useGymsStore().activeGymId)
        this.availabilityByClass = { ...this.availabilityByClass, [classId]: result }
      return result
    },
    async loadReservationsForClass(classId) {
      const gym = useGymsStore().activeGymId
      const rows = await useIntegrationStore().track('reservas', () =>
        api.reservations.list(gym, classId),
      )
      const target = this.allClasses.find((c) => c.id === classId && c.gymId === gym)
      if (target) {
        const active = rows
          .map(mapReservation)
          .filter((r) => ['booked', 'attended'].includes(r.status))
        target.attendees = active.map((r) => r.userId).filter(Boolean)
        target.attendeeCount = active.length
        target.reservations = active
      }
      return rows
    },
    async addClass(data) {
      const gym = useGymsStore().activeGymId
      const row = await useIntegrationStore().track('clases', () =>
        api.classes.create(gym, {
          templateId: data.templateId,
          name: data.name,
          color: data.color,
          capacity: Number(data.capacity),
          category: data.category,
          startsAt: toOffset(data.date, data.startTime),
          endsAt: toOffset(data.date, data.endTime),
          status: 'scheduled',
        }),
      )
      this.allClasses.push(mapClass(row))
      return row
    },
    async bookClass(classId) {
      const gym = useGymsStore().activeGymId
      const row = await useIntegrationStore().track('reservas', () =>
        api.reservations.create(gym, classId),
      )
      await this.loadAvailability(classId)
      return row
    },
    async removeClass(id) {
      const gym = useGymsStore().activeGymId
      await useIntegrationStore().track('clases', () => api.classes.remove(gym, id))
      this.allClasses = this.allClasses.filter((c) => c.id !== id)
    },
  },
})
