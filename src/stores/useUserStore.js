import { defineStore } from 'pinia'

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
      users: [
        {
          id: 1,
          name: 'Admin Demo',
          email: 'admin@gym.com',
          phone: '5550000001',
          role: 'admin',
          active: true,
          createdAt: '2026-01-01',
        },
        {
          id: 2,
          name: 'Trainer Demo',
          email: 'trainer@gym.com',
          phone: '5550000002',
          role: 'trainer',
          active: true,
          createdAt: '2026-01-02',
        },
        {
          id: 3,
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

    persist: true,

    getters: {
      members: (state) => state.users.filter((user) => user.role === 'member'),
      trainers: (state) => state.users.filter((user) => user.role === 'trainer'),
      activeUsers: (state) => state.users.filter((user) => user.active),
    },

    actions: {
      addUser(payload) {
        const startDate = payload.role === 'member' ? payload.startDate || null : null
        const paymentModality = payload.role === 'member' ? payload.paymentModality || null : null

        this.users.unshift({
          id: Date.now(),
          active: true,
          createdAt: new Date().toISOString().split('T')[0],
          startDate,
          paymentModality,
          nextPaymentDate: calculateNextPaymentDate(startDate, paymentModality),
          ...payload,
        })
      },

      isAdminUser(id) {
        return this.users.find((user) => user.id === id)?.role === 'admin'
      },

      updateUser(id, payload) {
        const index = this.users.findIndex((user) => user.id === id)

        if (index === -1 || this.users[index].role === 'admin') return

        const role = payload.role || this.users[index].role
        const startDate = role === 'member' ? payload.startDate || this.users[index].startDate || null : null
        const paymentModality = role === 'member' ? payload.paymentModality || this.users[index].paymentModality || null : null

        this.users[index] = {
          ...this.users[index],
          ...payload,
          startDate,
          paymentModality,
          nextPaymentDate: role === 'member' ? calculateNextPaymentDate(startDate, paymentModality) : null,
        }
      },

      removeUser(id) {
        const user = this.users.find((user) => user.id === id)

        if (user?.role === 'admin') return

        this.users = this.users.filter((user) => user.id !== id)
      },

      toggleActive(id) {
        const user = this.users.find((user) => user.id === id)

        if (!user || user.role === 'admin') return

        user.active = !user.active
      },
    },
  },
)