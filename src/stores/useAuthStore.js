import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { sessionTokens, tokenStorage } from '@/api/http'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'
import { clearBranchData } from '@/bootstrap/loadBackend'
const SELECTED_BRANCH = 'gymback:selected-branch'
const roleOrder = ['admin', 'owner', 'trainer', 'member']
export const useAuthStore = defineStore('auth', {
  state: () => ({ user: null, token: null, branchAccess: [], restoring: false }),
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
    setIdentity(user, access, { preserveBranch = false } = {}) {
      this.branchAccess = Array.isArray(access) ? access : []
      this.user = { ...user, role: null, branchIds: this.branchAccess.map((g) => g.id) }
      const branches = useBranchesStore()
      const previous = preserveBranch ? branches.activeBranchId : sessionStorage.getItem(SELECTED_BRANCH)
      if (!preserveBranch || !branches.branches.length) branches.setFromSession(this.branchAccess)
      const preferred =
        this.branchAccess.find((g) => g.id === previous)?.id ||
        (user.platformAdmin && branches.branches.some((g) => g.id === previous) ? previous : null) ||
        this.branchAccess.find((g) => g.id === user.defaultBranchId)?.id ||
        this.branchAccess[0]?.id ||
        null
      this.selectBranch(preferred)
    },
    login(payload) {
      if (!payload?.token || !payload.user) throw new Error('Respuesta de autenticación inválida.')
      this.setTokens(payload.token, payload.refreshToken, payload.expiresIn)
      this.setIdentity(payload.user, payload.branches)
    },
    updateRenewedSession(payload) {
      if (!this.isAuthenticated) return
      this.token = payload.token
      this.setIdentity(payload.user, payload.branches, { preserveBranch: true })
    },
    selectBranch(id) {
      const chosen = this.branchAccess.find((g) => g.id === id)
      if (
        id != null &&
        !chosen &&
        !(this.user?.platformAdmin && useBranchesStore().branches.some((g) => g.id === id))
      )
        throw new Error('No tienes acceso a la sucursal seleccionada.')
      const branches = useBranchesStore()
      branches.setActiveBranch(id)
      if (id) sessionStorage.setItem(SELECTED_BRANCH, id)
      else sessionStorage.removeItem(SELECTED_BRANCH)
      const roles = chosen?.roles || []
      // Los permisos de administrador global no dependen de la lista de acceso de una sucursal.
      const role = this.user?.platformAdmin ? 'admin' : roleOrder.find((r) => roles.includes(r)) || null
      if (this.user)
        this.user = {
          ...this.user,
          role,
          branchIds: this.branchAccess.map((g) => g.id),
          defaultBranchId: this.user.defaultBranchId,
          roles,
        }
    },
    async restoreSession() {
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
      sessionStorage.removeItem(SELECTED_BRANCH)
      this.token = null
      this.user = null
      this.branchAccess = []
      clearBranchData()
      useBranchesStore().reset()
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
