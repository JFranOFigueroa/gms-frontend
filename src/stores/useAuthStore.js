import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { sessionTokens, tokenStorage } from '@/api/http'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'
import { clearGymData } from '@/bootstrap/loadBackend'
const SELECTED_GYM = 'gymback:selected-gym'
const LEGACY_KEYS = [
  'gms-auth',
  'gms-users-v3',
  'gms-members-v1',
  'gms-pos-v2',
  'gms-landing-v2',
  'gms-class-schedule-v2',
  'gms-class-templates-v2',
  'gms-routines-v2',
  'gms-checkin-v3',
  'gms-gyms',
  'gms-modules',
  'gms-notifications',
]
const roleOrder = ['admin', 'owner', 'trainer', 'member']
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, token: null, gymAccess: [], restoring: false }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user && state.token),
    role: (state) => state.user?.role || null,
  },
  actions: {
    async authenticate(email, password) {
      return api.auth.login(email, password)
    },
    setTokens(access, refresh, expiresIn) {
      sessionTokens.set(access, refresh, expiresIn)
      this.token = access
    },
    setIdentity(user, access, { preserveGym = false } = {}) {
      this.gymAccess = Array.isArray(access) ? access : []
      this.user = { ...user, role: null, gymIds: this.gymAccess.map((g) => g.id) }
      const gyms = useGymsStore()
      const previous = preserveGym ? gyms.activeGymId : sessionStorage.getItem(SELECTED_GYM)
      if (!preserveGym || !gyms.gyms.length) gyms.setFromSession(this.gymAccess)
      const preferred =
        this.gymAccess.find((g) => g.id === previous)?.id ||
        (user.platformAdmin && gyms.gyms.some((g) => g.id === previous) ? previous : null) ||
        this.gymAccess.find((g) => g.id === user.defaultGymId)?.id ||
        this.gymAccess[0]?.id ||
        null
      this.selectGym(preferred)
    },
    login(payload) {
      if (!payload?.token || !payload.user) throw new Error('Respuesta de autenticación inválida.')
      this.setTokens(payload.token, payload.refreshToken, payload.expiresIn)
      this.setIdentity(payload.user, payload.gyms)
    },
    updateRenewedSession(payload) {
      if (!this.isAuthenticated) return
      this.token = payload.token
      this.setIdentity(payload.user, payload.gyms, { preserveGym: true })
    },
    selectGym(id) {
      const chosen = this.gymAccess.find((g) => g.id === id)
      if (
        id != null &&
        !chosen &&
        !(this.user?.platformAdmin && useGymsStore().gyms.some((g) => g.id === id))
      )
        throw new Error('No tienes acceso al gimnasio seleccionado.')
      const gyms = useGymsStore()
      gyms.setActiveGym(id)
      if (id) sessionStorage.setItem(SELECTED_GYM, id)
      else sessionStorage.removeItem(SELECTED_GYM)
      const roles = chosen?.roles || []
      const role =
        roleOrder.find((r) => roles.includes(r)) || (this.user?.platformAdmin ? 'admin' : null)
      if (this.user)
        this.user = {
          ...this.user,
          role,
          gymIds: this.gymAccess.map((g) => g.id),
          defaultGymId: this.user.defaultGymId,
          roles,
        }
    },
    async restoreSession() {
      for (const key of LEGACY_KEYS) localStorage.removeItem(key)
      const token = tokenStorage.get()
      if (!token) {
        this.clearSession()
        return
      }
      this.restoring = true
      try {
        // Un recargo del navegador conserva solo el acceso; el refresh vive en memoria.
        const session = await api.auth.me()
        this.login({ ...session, token })
      } catch {
        this.clearSession()
      } finally {
        this.restoring = false
      }
    },
    clearSession() {
      sessionTokens.clear()
      sessionStorage.removeItem(SELECTED_GYM)
      this.token = null
      this.user = null
      this.gymAccess = []
      clearGymData()
      useGymsStore().reset()
      useIntegrationStore().reset()
    },
    async logout() {
      const refresh = sessionTokens.getRefresh()
      try {
        if (refresh) await api.auth.logout(refresh)
      } catch {
        /* Incluso con conexión fallida, nunca retener una sesión cerrada. */
      } finally {
        this.clearSession()
      }
    },
  },
})
