import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapStaff } from '@/api/mappers'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'

// La cuenta global ya existe si falla solamente la asignación al gimnasio.
export class OwnerLinkPendingError extends Error {
  constructor(userId, gymId) {
    super(
      'La cuenta se creó, pero no se pudo asignar al gimnasio. Intenta completar la asignación.',
    )
    this.name = 'OwnerLinkPendingError'
    this.userId = userId
    this.gymId = gymId
  }
}
export const useUserStore = defineStore('users', {
  state: () => ({ allUsers: [] }),
  getters: {
    users: (s) => s.allUsers.filter((u) => u.gymId === useGymsStore().activeGymId),
    owners() {
      return this.users.filter((u) => u.roles.includes('owner'))
    },
    trainers() {
      return this.users.filter((u) => u.roles.includes('trainer'))
    },
    activeUsers() {
      return this.users.filter((u) => u.active)
    },
  },
  actions: {
    async load(gym = useGymsStore().activeGymId) {
      if (!gym) {
        this.allUsers = []
        return
      }
      const data = await useIntegrationStore().track('personal', () => api.staff.list(gym))
      if (useGymsStore().activeGymId === gym) this.allUsers = data.map(mapStaff)
    },
    findByEmail(email) {
      return (
        this.allUsers.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase()) ||
        null
      )
    },
    isAdminUser(id) {
      return this.allUsers.some((u) => u.id === id && u.roles.includes('admin'))
    },
    async registerTrainer(data, gym = useGymsStore().activeGymId) {
      const result = await useIntegrationStore().track('personal', () =>
        api.staff.register(gym, {
          fullName: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          status: 'active',
        }),
      )
      await this.load(gym)
      return result
    },
    async registerOwner(data, gym = useGymsStore().activeGymId) {
      // Primero cuenta global, después vínculo owner. Nunca enviar owner a staff/register.
      const account = await useIntegrationStore().track('cuentas globales', () =>
        api.users.create({
          fullName: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          status: 'active',
        }),
      )
      if (!account?.id) throw new Error('El servidor no confirmó la creación de la cuenta.')
      let staff
      try {
        staff = await useIntegrationStore().track('personal', () =>
          api.staff.create(gym, { userId: account.id, role: 'owner' }),
        )
      } catch {
        // Guardar identificador solamente en memoria, sin repetir POST /users.
        throw new OwnerLinkPendingError(account.id, gym)
      }
      await this.load(gym)
      return { account, staff }
    },
    async linkStaff(userId, role, gym = useGymsStore().activeGymId) {
      const result = await useIntegrationStore().track('personal', () =>
        api.staff.create(gym, { userId, role }),
      )
      await this.load(gym)
      return result
    },
    addUser() {
      throw new Error('Para crear cuentas globales usa la gestión de cuentas del administrador.')
    },
    async updateUser(id, payload) {
      const gym = useGymsStore().activeGymId
      if (!payload.role) throw new Error('Selecciona un permiso válido para esta persona.')
      const row = await useIntegrationStore().track('personal', () =>
        api.staff.update(gym, id, { role: payload.role }),
      )
      this.allUsers = this.allUsers.map((u) => (u.id === id ? mapStaff(row) : u))
    },
    async removeUser(id) {
      const gym = useGymsStore().activeGymId
      await useIntegrationStore().track('personal', () => api.staff.remove(gym, id))
      await this.load(gym)
    },
    toggleActive() {
      throw new Error('Esta opción no está disponible desde esta sección.')
    },
  },
})
