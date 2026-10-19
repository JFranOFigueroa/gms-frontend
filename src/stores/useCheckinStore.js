import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'

const todayKey = (timestamp = Date.now()) => {
  return new Date(timestamp).toISOString().split('T')[0]
}

export const useCheckinStore = defineStore(
  'checkin',

  {
    state: () => ({
      activeToken: null,
      tokenExpiresAt: null,
      allCheckins: [],
    }),

    persist: {
      key: 'gms-checkin-v2',
    },

    getters: {
      tokenIsValid: (state) => {
        return !!state.activeToken && !!state.tokenExpiresAt && state.tokenExpiresAt > Date.now()
      },

      checkins(state) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        return state.allCheckins.filter((checkin) => {
          return checkin.gymId == null || checkin.gymId === activeGymId
        })
      },

      todaysCheckins() {
        const today = todayKey()

        return this.checkins.filter((checkin) => todayKey(new Date(checkin.timestamp).getTime()) === today)
      },

      stats() {
        const today = todayKey()

        return {
          total: this.checkins.length,
          today: this.checkins.filter((checkin) => todayKey(new Date(checkin.timestamp).getTime()) === today).length,
        }
      },
    },

    actions: {
      generateToken() {
        this.activeToken = `gms-checkin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

        this.tokenExpiresAt = Date.now() + 10000

        return {
          token: this.activeToken,
          expiresAt: this.tokenExpiresAt,
        }
      },

      ensureActiveToken() {
        if (!this.tokenIsValid) {
          return this.generateToken()
        }

        return {
          token: this.activeToken,
          expiresAt: this.tokenExpiresAt,
        }
      },

      validateToken(token) {
        return token === this.activeToken && this.tokenIsValid
      },

      hasCheckedInToday(userId) {
        const today = todayKey()

        return this.checkins.some((checkin) => {
          return checkin.userId === userId && todayKey(new Date(checkin.timestamp).getTime()) === today
        })
      },

      checkIn({ userId, userName, role, method, token = null }) {
        const normalizedUserId = userId || `guest:${userName || 'invitado'}`

        if (this.hasCheckedInToday(normalizedUserId)) {
          return {
            ok: false,
            reason: 'Ya registraste check-in hoy',
          }
        }

        const gymsStore = useGymsStore()

        const checkin = {
          id: Date.now(),
          gymId: gymsStore.activeGymId,
          userId: normalizedUserId,
          userName: userName || 'Invitado',
          role: role || 'member',
          method,
          token,
          timestamp: new Date().toISOString(),
        }

        this.allCheckins.unshift(checkin)

        return {
          ok: true,
          checkin,
        }
      },
    },
  },
)
