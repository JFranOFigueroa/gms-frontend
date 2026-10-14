import { defineStore } from 'pinia'

const todayKey = (timestamp = Date.now()) => {
  return new Date(timestamp).toISOString().split('T')[0]
}

export const useCheckinStore = defineStore(
  'checkin',

  {
    state: () => ({
      activeToken: null,
      tokenExpiresAt: null,
      checkins: [],
    }),

    persist: true,

    getters: {
      tokenIsValid: (state) => {
        return !!state.activeToken && !!state.tokenExpiresAt && state.tokenExpiresAt > Date.now()
      },

      todaysCheckins: (state) => {
        const today = todayKey()

        return state.checkins.filter((checkin) => todayKey(new Date(checkin.timestamp).getTime()) === today)
      },

      stats(state) {
        const today = todayKey()

        return {
          total: state.checkins.length,
          today: state.checkins.filter((checkin) => todayKey(new Date(checkin.timestamp).getTime()) === today).length,
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

        const checkin = {
          id: Date.now(),
          userId: normalizedUserId,
          userName: userName || 'Invitado',
          role: role || 'member',
          method,
          token,
          timestamp: new Date().toISOString(),
        }

        this.checkins.unshift(checkin)

        return {
          ok: true,
          checkin,
        }
      },
    },
  },
)