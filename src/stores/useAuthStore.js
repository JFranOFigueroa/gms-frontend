import { defineStore } from 'pinia'

export const useAuthStore = defineStore(
  'auth',

  {
    state: () => ({
      user: null,

      token: null,
    }),

    getters: {
      isAuthenticated: (state) => !!state.user,

      role: (state) => state.user?.role,
    },

    actions: {
      login(payload) {
        this.user = payload.user

        this.token = payload.token

        localStorage.setItem(
          'gms-auth',

          JSON.stringify({
            user: this.user,

            token: this.token,
          }),
        )
      },

      logout() {
        this.user = null

        this.token = null

        localStorage.removeItem('gms-auth')
      },

      restoreSession() {
        const stored = localStorage.getItem('gms-auth')

        if (!stored) return

        try {
          const parsed = JSON.parse(stored)

          this.user = parsed.user

          this.token = parsed.token
        } catch {
          this.logout()
        }
      },
    },
  },
)
