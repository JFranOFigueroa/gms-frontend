import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapClass, mapReservation } from '@/api/mappers'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'
// Las fechas se envían con offset ISO 8601; nunca se inventan IDs ni asistentes.
const toOffset = (date, time) => {
  const dt = new Date(`${date}T${time}:00`)
  if (Number.isNaN(dt.getTime())) throw new Error('Fecha u hora inválida.')
  return dt.toISOString()
}
export const useClassScheduleStore = defineStore('class-schedule', {
  state: () => ({ allClasses: [], availabilityByClass: {} }),
  getters: {
    classes: (s) => s.allClasses.filter((c) => c.branchId === useBranchesStore().activeBranchId),
  },
  actions: {
    async load(branch = useBranchesStore().activeBranchId) {
      if (!branch) {
        this.allClasses = []
        return
      }
      const rows = await useIntegrationStore().track('clases', () => api.classes.list(branch))
      if (branch === useBranchesStore().activeBranchId) this.allClasses = rows.map(mapClass)
    },
    async loadRange(branch = useBranchesStore().activeBranchId, from, to) {
      if (!branch || !from || !to) return
      const rows = await useIntegrationStore().track('clases', () =>
        api.classes.listRange(branch, { from, to }),
      )
      if (branch !== useBranchesStore().activeBranchId) return
      // Conservar clases de otros meses ya consultados y actualizar el mes visible.
      this.allClasses = this.allClasses
        .filter((c) => c.branchId !== branch || c.date < from || c.date > to)
        .concat(rows.map(mapClass))
    },
    async loadAvailability(classId) {
      const branch = useBranchesStore().activeBranchId
      const result = await useIntegrationStore().track('disponibilidad', () =>
        api.classes.availability(branch, classId),
      )
      if (branch === useBranchesStore().activeBranchId)
        this.availabilityByClass = { ...this.availabilityByClass, [classId]: result }
      return result
    },
    async loadReservationsForClass(classId) {
      const branch = useBranchesStore().activeBranchId
      const rows = await useIntegrationStore().track('reservas', () =>
        api.reservations.list(branch, classId),
      )
      const target = this.allClasses.find((c) => c.id === classId && c.branchId === branch)
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
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('clases', () =>
        api.classes.create(branch, {
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
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('reservas', () =>
        api.reservations.create(branch, classId),
      )
      await this.loadAvailability(classId)
      return row
    },
    async removeClass(id) {
      const branch = useBranchesStore().activeBranchId
      await useIntegrationStore().track('clases', () => api.classes.remove(branch, id))
      this.allClasses = this.allClasses.filter((c) => c.id !== id)
    },
  },
})
