import { defineStore } from 'pinia'

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
        this.users.unshift({
          id: Date.now(),
          active: true,
          createdAt: new Date().toISOString().split('T')[0],
          ...payload,
        })
      },

      isAdminUser(id) {
        return this.users.find((user) => user.id === id)?.role === 'admin'
      },

      updateUser(id, payload) {
        const index = this.users.findIndex((user) => user.id === id)

        if (index === -1 || this.users[index].role === 'admin') return

        this.users[index] = {
          ...this.users[index],
          ...payload,
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