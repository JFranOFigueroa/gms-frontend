import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'

const calculateNextPaymentDate = (startDate, paymentModality) => {
  if (!startDate || !paymentModality) return null

  const date = new Date(`${startDate}T00:00:00`)

  if (Number.isNaN(date.getTime())) return null

  if (paymentModality === 'monthly') {
    date.setMonth(date.getMonth() + 1)
  } else if (paymentModality === 'yearly') {
    date.setFullYear(date.getFullYear() + 1)
  }

  return date.toISOString().split('T')[0]
}

export const useUserStore = defineStore(
  'users',

  {
    state: () => ({
      allUsers: [
        {
          id: 1,
          gymId: null,
          name: 'Admin Demo',
          email: 'admin@gym.com',
          phone: '5550000001',
          role: 'admin',
          active: true,
          createdAt: '2026-01-01',
        },
        {
          id: 2,
          gymId: 1,
          gymIds: [1, 2],
          defaultGymId: 1,
          name: 'Trainer Demo',
          email: 'trainer@gym.com',
          phone: '5550000002',
          role: 'trainer',
          active: true,
          createdAt: '2026-01-02',
        },
        {
          id: 3,
          gymId: 1,
          name: 'Miembro Demo',
          email: 'member@gym.com',
          phone: '5550000003',
          role: 'member',
          active: true,
          createdAt: '2026-01-03',
          startDate: '2026-01-03',
          paymentModality: 'monthly',
          nextPaymentDate: '2026-02-03',
        },
      ],
    }),

    persist: {
      key: 'gms-users-v2',
    },

    getters: {
      users(state) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        return state.allUsers.filter((user) => {
          if (user.gymId == null && !user.gymIds?.length) return true
          if (user.gymId === activeGymId) return true
          if (user.gymIds?.includes(activeGymId)) return true

          return false
        })
      },

      members() {
        return this.users.filter((user) => user.role === 'member')
      },

      trainers() {
        return this.users.filter((user) => user.role === 'trainer')
      },

      activeUsers() {
        return this.users.filter((user) => user.active)
      },
    },

    actions: {
      findByEmail(email) {
        const query = (email || '').trim().toLowerCase()

        if (!query) return null

        return this.allUsers.find((user) => user.email.toLowerCase() === query) || null
      },

      addUser(payload) {
        const gymsStore = useGymsStore()
        const role = payload.role
        const isMember = role === 'member'
        const isTrainer = role === 'trainer'

        const startDate = isMember ? payload.startDate || null : null
        const paymentModality = isMember ? payload.paymentModality || null : null

        const gymIds = isTrainer && Array.isArray(payload.gymIds) && payload.gymIds.length
          ? payload.gymIds
          : isTrainer
            ? [gymsStore.activeGymId]
            : null

        const defaultGymId = isTrainer
          ? payload.defaultGymId && gymIds.includes(payload.defaultGymId)
            ? payload.defaultGymId
            : gymIds[0]
          : null

        this.allUsers.unshift({
          ...payload,
          id: Date.now(),
          active: true,
          createdAt: new Date().toISOString().split('T')[0],
          gymId: role === 'admin' ? null : isTrainer ? defaultGymId : gymsStore.activeGymId,
          gymIds,
          defaultGymId,
          startDate,
          paymentModality,
          nextPaymentDate: calculateNextPaymentDate(startDate, paymentModality),
        })
      },

      isAdminUser(id) {
        return this.allUsers.find((user) => user.id === id)?.role === 'admin'
      },

      updateUser(id, payload) {
        const index = this.allUsers.findIndex((user) => user.id === id)

        if (index === -1 || this.allUsers[index].role === 'admin') return

        const current = this.allUsers[index]
        const role = payload.role || current.role
        const isMember = role === 'member'
        const isTrainer = role === 'trainer'

        const startDate = isMember ? payload.startDate || current.startDate || null : null
        const paymentModality = isMember ? payload.paymentModality || current.paymentModality || null : null

        const gymIds = isTrainer
          ? Array.isArray(payload.gymIds) && payload.gymIds.length
            ? payload.gymIds
            : current.gymIds?.length
              ? current.gymIds
              : [current.gymId].filter(Boolean)
          : null

        const defaultGymId = isTrainer
          ? payload.defaultGymId && gymIds.includes(payload.defaultGymId)
            ? payload.defaultGymId
            : gymIds[0]
          : null

        this.allUsers[index] = {
          ...current,
          ...payload,
          gymIds,
          defaultGymId,
          startDate,
          paymentModality,
          nextPaymentDate: isMember ? calculateNextPaymentDate(startDate, paymentModality) : null,
        }
      },

      removeUser(id) {
        const user = this.allUsers.find((user) => user.id === id)

        if (user?.role === 'admin') return

        this.allUsers = this.allUsers.filter((user) => user.id !== id)
      },

      toggleActive(id) {
        const user = this.allUsers.find((user) => user.id === id)

        if (!user || user.role === 'admin') return

        user.active = !user.active
      },
    },
  },
)
