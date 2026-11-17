import { useAuthStore } from '@/stores/useAuthStore'
import { useBranchesStore } from '@/stores/useBranchesStore'
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
import { useDashboardSummaryStore } from '@/stores/useDashboardSummaryStore'
import { useMyReservationsStore } from '@/stores/useMyReservationsStore'

/** Las consultas de sucursal se deduplican y respetan los módulos habilitados. */
let lastPending = null
export function hydrateActiveBranch() {
  const auth = useAuthStore()
  const branch = useBranchesStore().activeBranchId
  if (!auth.isAuthenticated) return Promise.resolve()
  if (lastPending?.branch === branch) return lastPending.promise
  const promise = (async () => {
    const admin = auth.role === 'admin'
    const siteEditor = ['admin', 'owner'].includes(auth.role)
    const siteTasks = []
    if (siteEditor) {
      siteTasks.push(useLandingStore().load(), useMediaStore().load(), useThemeStore().load())
    }
    if (!branch) {
      if (admin) await Promise.allSettled([useBranchesStore().load()])
      await Promise.allSettled(siteTasks)
      return
    }
    const staff = ['admin', 'owner', 'trainer'].includes(auth.role)
    const owner = ['admin', 'owner'].includes(auth.role)
    await Promise.allSettled([useModuleStore().load(branch)])
    const modules = useModuleStore()
    const tasks = []
    if (auth.role !== 'trainer') tasks.push(usePlanStore().load(branch))
    if (modules.isModuleEnabled('routines')) tasks.push(useRoutineStore().load(branch))
    if (auth.role !== 'trainer' && modules.isModuleEnabled('calendar'))
      tasks.push(useClassScheduleStore().load(branch), useClassTemplateStore().load(branch))
    if (owner) tasks.push(useMemberStore().load(branch))
    if (owner) tasks.push(useUserStore().load(branch))
    if (auth.role === 'member') {
      tasks.push(useMemberStore().loadMine(branch))
      if (modules.isModuleEnabled('checkin')) tasks.push(useCheckinStore().loadMine(branch))
      if (modules.isModuleEnabled('calendar')) tasks.push(useMyReservationsStore().load(branch))
    }
    if (staff && modules.isModuleEnabled('pos')) tasks.push(usePosStore().load(branch))
    if (owner && modules.isModuleEnabled('checkin')) tasks.push(useCheckinStore().load(branch))
    if (owner)
      tasks.push(useMemberStore().loadPayments(branch), useDashboardSummaryStore().load(branch))
    if (admin) tasks.push(useBranchesStore().load())
    await Promise.allSettled([...tasks, ...siteTasks])
  })()
  lastPending = { branch, promise }
  promise.finally(() => {
    if (lastPending?.promise === promise) lastPending = null
  })
  return promise
}

export function clearBranchData() {
  useUserStore().allUsers = []
  useMemberStore().allMembers = []
  useMemberStore().allPayments = []
  usePlanStore().allPlans = []
  usePosStore().allProducts = []
  usePosStore().allSales = []
  usePosStore().clearCart()
  usePosStore().checkoutSubmitting = false
  useMemberStore().pendingPayment = null
  useMemberStore().paymentSubmitting = false
  useRoutineStore().allRoutines = []
  useClassScheduleStore().allClasses = []
  useClassTemplateStore().allTemplates = []
  useCheckinStore().allCheckins = []
  useLandingStore().allBlocks = []
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
