import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'
import { useMemberStore } from '@/stores/useMemberStore'
import { toDateOnly } from '@/utils/date'

const todayKey = (timestamp = Date.now()) => toDateOnly(new Date(timestamp))

export const useCheckinStore = defineStore(
  'checkin',

  {
    state: () => ({
      activeToken: null,
      tokenExpiresAt: null,
      allCheckins: [],
    }),

    persist: {
      key: 'gms-checkin-v3',
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

      grantedToday() {
        return this.todaysCheckins.filter((checkin) => checkin.allowed !== false)
      },

      deniedToday() {
        return this.todaysCheckins.filter((checkin) => checkin.allowed === false)
      },

      stats() {
        return {
          total: this.checkins.length,
          today: this.todaysCheckins.length,
          granted: this.grantedToday.length,
          denied: this.deniedToday.length,
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
        if (!token) return false

        if (token === this.activeToken && this.tokenIsValid) return true

        return this.isKioskTokenValid(token)
      },

      /**
       * El kiosco y la app del miembro pueden estar en pestañas distintas.
       * Mientras compartan navegador, el token rotativo se valida leyendo la
       * copia que el kiosco publica en localStorage. Entre dispositivos hace
       * falta validación de servidor.
       */
      isKioskTokenValid(token) {
        if (typeof localStorage === 'undefined') return false

        try {
          const raw = localStorage.getItem('gms-kiosk-token')

          if (!raw) return false

          const parsed = JSON.parse(raw)

          return parsed.token === token && Number(parsed.expiresAt) > Date.now()
        } catch {
          return false
        }
      },

      hasCheckedInToday(userId) {
        if (!userId) return false

        const today = todayKey()

        return this.checkins.some((checkin) => {
          return (
            String(checkin.userId) === String(userId) &&
            checkin.allowed !== false &&
            todayKey(new Date(checkin.timestamp).getTime()) === today
          )
        })
      },

      recordAccess({ member, userId, userName, role, method, token = null, allowed, reason }) {
        const gymsStore = useGymsStore()

        const checkin = {
          id: Date.now(),
          gymId: gymsStore.activeGymId,
          userId: member?.id ?? userId ?? null,
          userName: member?.name ?? userName ?? 'Invitado',
          role: role || (member ? 'member' : 'guest'),
          method,
          token,
          allowed: allowed !== false,
          reason: reason || (allowed !== false ? 'Acceso permitido' : 'Acceso denegado'),
          timestamp: new Date().toISOString(),
        }

        this.allCheckins.unshift(checkin)

        return checkin
      },

      /**
       * Check-in desde la cuenta del miembro (QR rotativo o token manual).
       * Valida estado de cuenta y vigencia de pago.
       */
      checkIn({ userId, userName, role, method, token = null }) {
        const memberStore = useMemberStore()

        if (role === 'member') {
          const member = memberStore.findById(userId)

          if (!member) {
            const reason = 'Miembro no encontrado'

            this.recordAccess({
              userId,
              userName,
              role,
              method,
              token,
              allowed: false,
              reason,
            })

            return { ok: false, allowed: false, reason }
          }

          const access = memberStore.getAccessStatus(member)

          if (!access.allowed) {
            this.recordAccess({
              member,
              method,
              token,
              allowed: false,
              reason: access.reason,
            })

            return { ok: false, allowed: false, reason: access.reason }
          }

          if (this.hasCheckedInToday(member.id)) {
            const reason = 'Ya registraste check-in hoy'

            this.recordAccess({
              member,
              method,
              token,
              allowed: false,
              reason,
            })

            return { ok: false, allowed: false, reason }
          }

          const checkin = this.recordAccess({
            member,
            method,
            token,
            allowed: true,
            reason: access.reason,
          })

          return { ok: true, allowed: true, checkin }
        }

        const normalizedUserId = userId || `guest:${userName || 'invitado'}`

        if (this.hasCheckedInToday(normalizedUserId)) {
          const reason = 'Ya registraste check-in hoy'

          this.recordAccess({
            userId: normalizedUserId,
            userName,
            role,
            method,
            token,
            allowed: false,
            reason,
          })

          return { ok: false, allowed: false, reason }
        }

        const checkin = this.recordAccess({
          userId: normalizedUserId,
          userName,
          role,
          method,
          token,
          allowed: true,
          reason: 'Acceso permitido',
        })

        return { ok: true, allowed: true, checkin }
      },

      /**
       * Check-in desde el kiosco standalone de la entrada.
       */
      registerAccess({ member, method, token = null }) {
        const memberStore = useMemberStore()
        const access = memberStore.getAccessStatus(member)

        if (!access.allowed) {
          const checkin = this.recordAccess({
            member,
            method,
            token,
            allowed: false,
            reason: access.reason,
          })

          return { ...access, ok: false, checkin }
        }

        if (this.hasCheckedInToday(member.id)) {
          const reason = 'Ya registró su entrada hoy'

          const checkin = this.recordAccess({
            member,
            method,
            token,
            allowed: false,
            reason,
          })

          return { allowed: false, code: 'duplicate', reason, ok: false, checkin }
        }

        const checkin = this.recordAccess({
          member,
          method,
          token,
          allowed: true,
          reason: access.reason,
        })

        return { allowed: true, ok: true, reason: access.reason, checkin }
      },
    },
  },
)
