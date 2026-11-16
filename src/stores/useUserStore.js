import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapStaff } from '@/api/mappers'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'

// La cuenta global ya existe si falla solamente la asignación a la sucursal.
export class OwnerLinkPendingError extends Error {
  constructor(userId, branchId) {
    super(
      'La cuenta se creó, pero no se pudo asignar a la sucursal. Intenta completar la asignación.',
    )
    this.name = 'OwnerLinkPendingError'
    this.userId = userId
    this.branchId = branchId
  }
}
export const useUserStore = defineStore('users', {
  state: () => ({ allUsers: [] }),
  getters: {
    users: (s) => s.allUsers.filter((u) => u.branchId === useBranchesStore().activeBranchId),
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
    async load(branch = useBranchesStore().activeBranchId) {
      if (!branch) {
        this.allUsers = []
        return
      }
      const data = await useIntegrationStore().track('personal', () => api.staff.list(branch))
      if (useBranchesStore().activeBranchId === branch) this.allUsers = data.map(mapStaff)
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
    async registerTrainer(data, branch = useBranchesStore().activeBranchId) {
      const result = await useIntegrationStore().track('personal', () =>
        api.staff.register(branch, {
          fullName: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          status: 'active',
        }),
      )
      await this.load(branch)
      return result
    },
    async registerOwner(data, branch = useBranchesStore().activeBranchId) {
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
          api.staff.create(branch, { userId: account.id, role: 'owner' }),
        )
      } catch {
        // Guardar identificador solamente en memoria, sin repetir POST /users.
        throw new OwnerLinkPendingError(account.id, branch)
      }
      await this.load(branch)
      return { account, staff }
    },
    async linkStaff(userId, role, branch = useBranchesStore().activeBranchId) {
      const result = await useIntegrationStore().track('personal', () =>
        api.staff.create(branch, { userId, role }),
      )
      await this.load(branch)
      return result
    },
    addUser() {
      throw new Error('Para crear cuentas globales usa la gestión de cuentas del administrador.')
    },
    async updateUser(id, payload) {
      const branch = useBranchesStore().activeBranchId
      if (!payload.role) throw new Error('Selecciona un permiso válido para esta persona.')
      const row = await useIntegrationStore().track('personal', () =>
        api.staff.update(branch, id, { role: payload.role }),
      )
      this.allUsers = this.allUsers.map((u) => (u.id === id ? mapStaff(row) : u))
    },
    async removeUser(id) {
      const branch = useBranchesStore().activeBranchId
      await useIntegrationStore().track('personal', () => api.staff.remove(branch, id))
      await this.load(branch)
    },
    toggleActive() {
      throw new Error('Esta opción no está disponible desde esta sección.')
    },
  },
})
