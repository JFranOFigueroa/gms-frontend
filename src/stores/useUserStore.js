import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'

/**
 * Usuarios internos del sistema (staff).
 * Los miembros viven en `useMemberStore`.
 */
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
          gymIds: [1],
          defaultGymId: 1,
          name: 'Owner Demo',
          email: 'owner@gym.com',
          phone: '5550000002',
          role: 'owner',
          active: true,
          createdAt: '2026-01-02',
        },
        {
          id: 3,
          gymId: 1,
          gymIds: [1, 2],
          defaultGymId: 1,
          name: 'Trainer Demo',
          email: 'trainer@gym.com',
          phone: '5550000003',
          role: 'trainer',
          active: true,
          createdAt: '2026-01-03',
        },
      ],
    }),

    persist: {
      key: 'gms-users-v3',
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

      owners() {
        return this.users.filter((user) => user.role === 'owner')
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

        if (role === 'admin') return null

        const gymIds = Array.isArray(payload.gymIds) && payload.gymIds.length
          ? payload.gymIds
          : [gymsStore.activeGymId]

        const defaultGymId = payload.defaultGymId && gymIds.includes(payload.defaultGymId)
          ? payload.defaultGymId
          : gymIds[0]

        const user = {
          ...payload,
          id: Date.now(),
          active: true,
          createdAt: new Date().toISOString().split('T')[0],
          gymId: defaultGymId,
          gymIds,
          defaultGymId,
        }

        this.allUsers.unshift(user)

        return user
      },

      isAdminUser(id) {
        return this.allUsers.find((user) => user.id === id)?.role === 'admin'
      },

      updateUser(id, payload) {
        const index = this.allUsers.findIndex((user) => user.id === id)

        if (index === -1 || this.allUsers[index].role === 'admin') return

        const current = this.allUsers[index]
        const role = payload.role || current.role

        if (role === 'admin') return

        const gymIds = Array.isArray(payload.gymIds) && payload.gymIds.length
          ? payload.gymIds
          : current.gymIds?.length
            ? current.gymIds
            : [current.gymId].filter(Boolean)

        const defaultGymId = payload.defaultGymId && gymIds.includes(payload.defaultGymId)
          ? payload.defaultGymId
          : gymIds[0]

        this.allUsers[index] = {
          ...current,
          ...payload,
          gymId: defaultGymId,
          gymIds,
          defaultGymId,
        }
      },

      removeUser(id) {
        const user = this.allUsers.find((entry) => entry.id === id)

        if (user?.role === 'admin') return

        this.allUsers = this.allUsers.filter((entry) => entry.id !== id)
      },

      toggleActive(id) {
        const user = this.allUsers.find((entry) => entry.id === id)

        if (!user || user.role === 'admin') return

        user.active = !user.active
      },
    },
  },
)
