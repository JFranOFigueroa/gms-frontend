import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'
import { addMonths, addYears, calculateNextPaymentDate, todayISO } from '@/utils/date'

const buildCode = (members) => {
  const max = members.reduce((accumulator, member) => {
    const numeric = Number(String(member.code || '').replace(/\D/g, ''))

    return Number.isFinite(numeric) ? Math.max(accumulator, numeric) : accumulator
  }, 1000)

  return `M-${max + 1}`
}

export const useMemberStore = defineStore(
  'members',

  {
    state: () => ({
      allMembers: [
        {
          id: 1001,
          gymId: 1,
          code: 'M-1001',
          name: 'Miembro Demo',
          email: 'member@gym.com',
          password: 'member123',
          birthDate: '1998-05-12',
          phone: '5550000003',
          address: 'Av. Principal 123',
          emergencyContactName: 'Laura Demo',
          emergencyContactPhone: '5550000099',
          photo: null,
          startDate: '2026-01-03',
          paymentModality: 'yearly',
          lastPaymentDate: '2026-01-03',
          nextPaymentDate: '2027-01-03',
          active: true,
          notes: 'Miembro de demostración.',
          createdAt: '2026-01-03',
        },
        {
          id: 1002,
          gymId: 1,
          code: 'M-1002',
          name: 'Miembro Vencido',
          email: 'expired@gym.com',
          password: 'member123',
          birthDate: '1995-02-20',
          phone: '5550000004',
          address: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          photo: null,
          startDate: '2025-06-01',
          paymentModality: 'monthly',
          lastPaymentDate: '2025-12-01',
          nextPaymentDate: '2026-01-01',
          active: true,
          notes: 'Pago vencido para demostrar el rechazo de acceso.',
          createdAt: '2025-06-01',
        },
        {
          id: 1003,
          gymId: 1,
          code: 'M-1003',
          name: 'Miembro Inactivo',
          email: 'inactive@gym.com',
          password: 'member123',
          birthDate: '1990-09-10',
          phone: '5550000005',
          address: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          photo: null,
          startDate: '2025-03-01',
          paymentModality: 'monthly',
          lastPaymentDate: '2026-10-01',
          nextPaymentDate: '2026-11-01',
          active: false,
          notes: 'Cuenta desactivada para demostrar el rechazo de acceso.',
          createdAt: '2025-03-01',
        },
      ],
      allPayments: [
        {
          id: 1,
          gymId: 1,
          memberId: 1001,
          memberName: 'Miembro Demo',
          amount: 5000,
          method: 'cash',
          concept: 'yearly',
          paidAt: '2026-01-03',
          periodStart: '2026-01-03',
          nextPaymentDate: '2027-01-03',
          notes: 'Anualidad de demostración',
          createdBy: 'Owner Demo',
          createdAt: '2026-01-03T10:00:00.000Z',
        },
      ],
    }),

    persist: {
      key: 'gms-members-v1',
    },

    getters: {
      members(state) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        return state.allMembers.filter((member) => {
          return member.gymId == null || member.gymId === activeGymId
        })
      },

      activeMembers() {
        return this.members.filter((member) => member.active)
      },

      inactiveMembers() {
        return this.members.filter((member) => !member.active)
      },

      expiredMembers() {
        return this.members.filter((member) => member.active && this.isPaymentExpired(member))
      },

      payments(state) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        return state.allPayments.filter((payment) => {
          return payment.gymId == null || payment.gymId === activeGymId
        })
      },

      paymentsThisMonth() {
        const month = todayISO().slice(0, 7)

        return this.payments.filter((payment) => payment.paidAt?.startsWith(month))
      },

      collectedThisMonth() {
        return this.paymentsThisMonth.reduce((total, payment) => total + (Number(payment.amount) || 0), 0)
      },
    },

    actions: {
      isPaymentExpired(member) {
        if (!member?.nextPaymentDate) return true

        return member.nextPaymentDate < todayISO()
      },

      getAccessStatus(member) {
        if (!member) {
          return { allowed: false, code: 'not_found', reason: 'Miembro no encontrado' }
        }

        const gymsStore = useGymsStore()

        if (member.gymId != null && member.gymId !== gymsStore.activeGymId) {
          return {
            allowed: false,
            code: 'wrong_gym',
            reason: 'Miembro de otro gimnasio',
          }
        }

        if (!member.active) {
          return { allowed: false, code: 'inactive', reason: 'Usuario desactivado' }
        }

        if (!member.nextPaymentDate) {
          return { allowed: false, code: 'no_payment', reason: 'Sin pago registrado' }
        }

        if (this.isPaymentExpired(member)) {
          return {
            allowed: false,
            code: 'expired',
            reason: `Pago vencido el ${member.nextPaymentDate}`,
          }
        }

        return { allowed: true, code: 'ok', reason: 'Acceso permitido' }
      },

      findById(id) {
        return this.allMembers.find((member) => String(member.id) === String(id)) || null
      },

      findByEmail(email) {
        const query = (email || '').trim().toLowerCase()

        if (!query) return null

        return this.allMembers.find((member) => member.email.toLowerCase() === query) || null
      },

      findByCode(code) {
        const raw = (code || '').trim()

        if (!raw) return null

        const normalized = raw.replace(/^GMS-MEMBER:/i, '').trim().toLowerCase()

        return (
          this.allMembers.find((member) => {
            return (
              member.code?.toLowerCase() === normalized ||
              member.email?.toLowerCase() === normalized ||
              String(member.id) === normalized
            )
          }) || null
        )
      },

      memberPayments(memberId) {
        return this.payments
          .filter((payment) => String(payment.memberId) === String(memberId))
          .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))
      },

      addMember(payload) {
        const gymsStore = useGymsStore()
        const id = Date.now()
        const paymentModality = payload.paymentModality || 'monthly'
        const startDate = payload.startDate || todayISO()

        const member = {
          ...payload,
          id,
          gymId: gymsStore.activeGymId,
          code: payload.code || buildCode(this.allMembers),
          startDate,
          paymentModality,
          nextPaymentDate:
            payload.nextPaymentDate || calculateNextPaymentDate(startDate, paymentModality),
          active: payload.active !== false,
          createdAt: new Date().toISOString().split('T')[0],
        }

        this.allMembers.unshift(member)

        return member
      },

      updateMember(id, payload) {
        const index = this.allMembers.findIndex((member) => String(member.id) === String(id))

        if (index === -1) return

        const current = this.allMembers[index]
        const paymentModality = payload.paymentModality || current.paymentModality
        const startDate = payload.startDate || current.startDate

        this.allMembers[index] = {
          ...current,
          ...payload,
          paymentModality,
          startDate,
          nextPaymentDate:
            payload.nextPaymentDate ||
            current.nextPaymentDate ||
            calculateNextPaymentDate(startDate, paymentModality),
        }
      },

      setMemberActive(id, active) {
        const member = this.allMembers.find((entry) => String(entry.id) === String(id))

        if (!member) return

        member.active = active
      },

      deactivateMember(id) {
        this.setMemberActive(id, false)
      },

      reactivateMember(id) {
        this.setMemberActive(id, true)
      },

      removeMember(id) {
        this.allMembers = this.allMembers.filter((member) => String(member.id) !== String(id))
        this.allPayments = this.allPayments.filter((payment) => String(payment.memberId) !== String(id))
      },

      registerPayment(memberId, payload) {
        const member = this.findById(memberId)

        if (!member) return { ok: false, reason: 'Miembro no encontrado' }

        const amount = Number(payload.amount) || 0

        if (amount <= 0) {
          return { ok: false, reason: 'El monto debe ser mayor a cero' }
        }

        const paidAt = payload.paidAt || todayISO()
        const periodicity = payload.periodicity || member.paymentModality || 'monthly'
        const periods = Math.max(1, Number(payload.periods) || 1)

        const base =
          member.nextPaymentDate && member.nextPaymentDate > paidAt
            ? member.nextPaymentDate
            : paidAt

        const nextPaymentDate =
          periodicity === 'yearly' ? addYears(base, periods) : addMonths(base, periods)

        const payment = {
          id: Date.now(),
          gymId: member.gymId,
          memberId: member.id,
          memberName: member.name,
          amount,
          method: payload.method || 'cash',
          concept: payload.concept || 'membership',
          periodicity,
          periods,
          paidAt,
          periodStart: base,
          nextPaymentDate,
          notes: payload.notes || '',
          createdBy: payload.createdBy || 'Sistema',
          createdAt: new Date().toISOString(),
        }

        this.allPayments.unshift(payment)

        member.lastPaymentDate = paidAt
        member.nextPaymentDate = nextPaymentDate
        member.paymentModality = periodicity

        return { ok: true, payment }
      },
    },
  },
)
