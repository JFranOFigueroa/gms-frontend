import { useAuthStore } from '@/stores/useAuthStore'
import { useGymsStore } from '@/stores/useGymsStore'
import { useIntegrationStore } from '@/stores/useIntegrationStore'
import { useUserStore } from '@/stores/useUserStore'
import { useMemberStore } from '@/stores/useMemberStore'
import { usePlanStore } from '@/stores/usePlanStore'
import { usePosStore } from '@/stores/usePosStore'
import { useRoutineStore } from '@/stores/useRoutineStore'
import { useClassTemplateStore } from '@/stores/useClassTemplateStore'
import { useClassScheduleStore } from '@/stores/useClassScheduleStore'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { useLandingStore } from '@/stores/useLandingStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useThemeStore } from '@/stores/useThemeStore'
import { useModuleStore } from '@/stores/useModuleStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { useBookingStore } from '@/stores/useBookingStore'
import { useLandingPublicationStore } from '@/stores/useLandingPublicationStore'
import { useDashboardSummaryStore } from '@/stores/useDashboardSummaryStore'
import { useMyReservationsStore } from '@/stores/useMyReservationsStore'

/** Las consultas se deduplican por gimnasio y respetan los módulos habilitados. */
let lastPending = null
export function hydrateActiveGym() {
  const auth = useAuthStore()
  const gym = useGymsStore().activeGymId
  if (!auth.isAuthenticated) return Promise.resolve()
  if (lastPending?.gym === gym) return lastPending.promise
  const promise = (async () => {
    const admin = auth.role === 'admin'
    if (!gym) {
      if (admin) await Promise.allSettled([useGymsStore().load()])
      return
    }
    const staff = ['admin', 'owner', 'trainer'].includes(auth.role)
    const owner = ['admin', 'owner'].includes(auth.role)
    await Promise.allSettled([useModuleStore().load(gym)])
    const modules = useModuleStore()
    const tasks = [usePlanStore().load(gym)]
    if (modules.isModuleEnabled('routines')) tasks.push(useRoutineStore().load(gym))
    if (modules.isModuleEnabled('calendar'))
      tasks.push(useClassScheduleStore().load(gym), useClassTemplateStore().load(gym))
    if (staff) tasks.push(useMemberStore().load(gym))
    if (owner) tasks.push(useUserStore().load(gym))
    if (auth.role === 'member') {
      tasks.push(useMemberStore().loadMine(gym))
      if (modules.isModuleEnabled('checkin')) tasks.push(useCheckinStore().loadMine(gym))
      if (modules.isModuleEnabled('calendar')) tasks.push(useMyReservationsStore().load(gym))
    }
    if (staff && modules.isModuleEnabled('pos')) tasks.push(usePosStore().load(gym))
    if (staff && modules.isModuleEnabled('checkin')) tasks.push(useCheckinStore().load(gym))
    if (owner)
      tasks.push(
        useMemberStore().loadPayments(gym),
        useLandingStore().load(gym),
        useMediaStore().load(gym),
        useThemeStore().load(gym),
        useLandingPublicationStore().load(gym),
        useDashboardSummaryStore().load(gym),
      )
    if (admin) tasks.push(useGymsStore().load())
    await Promise.allSettled(tasks)
  })()
  lastPending = { gym, promise }
  promise.finally(() => {
    if (lastPending?.promise === promise) lastPending = null
  })
  return promise
}

export function clearGymData() {
  useUserStore().allUsers = []
  useMemberStore().allMembers = []
  useMemberStore().allPayments = []
  usePlanStore().allPlans = []
  usePosStore().allProducts = []
  usePosStore().allSales = []
  usePosStore().clearCart()
  useRoutineStore().allRoutines = []
  useClassScheduleStore().allClasses = []
  useClassTemplateStore().allTemplates = []
  useCheckinStore().allCheckins = []
  useLandingStore().allBlocks = []
  useLandingPublicationStore().clear()
  useDashboardSummaryStore().clear()
  useMyReservationsStore().clear()
  useMemberStore().ownMember = null
  useCheckinStore().ownCheckins = []
  useClassScheduleStore().availabilityByClass = {}
  useMediaStore().clear()
  useThemeStore().selectedPreset = null
  const modules = useModuleStore()
  modules.modules = { calendar: false, routines: false, checkin: false, pos: false }
  modules.loaded = false
  useBookingStore().bookings = []
  useBookingStore().settings = { allowMultipleNormalPerDay: false }
  useNotificationStore().reset()
  useIntegrationStore().reset()
}
