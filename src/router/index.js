import { createRouter, createWebHistory } from 'vue-router'

import PublicLayout from '@/layouts/PublicLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

import HomePage from '@/pages/public/HomePage.vue'
import LoginPage from '@/pages/auth/LoginPage.vue'
import DashboardPage from '@/pages/dashboard/DashboardPage.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useModuleStore } from '@/stores/useModuleStore'

const routes = [
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomePage,
      },
    ],
  },

  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        name: 'login',
        component: LoginPage,
      },
    ],
  },

  {
    path: '/guest-access',
    component: () => import('@/pages/auth/GuestAccessPage.vue'),
  },

  {
    path: '/checkin',
    name: 'standalone-checkin',
    component: () => import('@/pages/public/StandaloneCheckInPage.vue'),
  },

  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: DashboardPage,
      },
      {
        path: 'disponibilidad',
        component: () => import('@/pages/dashboard/TrainerUnavailablePage.vue'),
        meta: { roles: ['trainer'] },
      },
      {
        path: 'calendar',
        component: () => import('@/pages/dashboard/CalendarPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'calendar',
          roles: ['admin', 'owner', 'member', 'guest'],
        },
      },
      {
        path: 'landing-builder',
        name: 'landing-builder',
        component: () => import('@/pages/dashboard/LandingModulePage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['admin', 'owner'],
        },
      },
      {
        path: 'media',
        name: 'media',
        redirect: (to) => ({
          path: '/dashboard/landing-builder',
          query: { ...to.query, tab: 'media' },
        }),
        meta: {
          requiresAuth: true,
          roles: ['admin', 'owner'],
        },
      },
      {
        path: 'class-templates',
        redirect: (to) => ({
          path: '/dashboard/routines',
          query: { ...to.query, tab: 'templates' },
        }),
        meta: {
          requiresAuth: true,
          module: 'calendar',
          roles: ['admin', 'owner'],
        },
      },
      {
        path: 'pos',
        name: 'pos',
        component: () => import('@/pages/dashboard/PosPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'pos',
          roles: ['admin', 'owner', 'trainer'],
        },
      },
      {
        path: 'routines',
        name: 'routines',
        component: () => import('@/pages/dashboard/RoutinesModulePage.vue'),
        meta: {
          requiresAuth: true,
          moduleAny: ['routines', 'calendar'],
          roles: ['admin', 'owner', 'trainer'],
        },
      },
      {
        path: 'routine',
        name: 'my-routine',
        component: () => import('@/pages/dashboard/MemberRoutinePage.vue'),
        meta: {
          requiresAuth: true,
          module: 'routines',
          roles: ['member'],
        },
      },
      {
        path: 'checkin',
        name: 'member-checkin',
        component: () => import('@/pages/dashboard/CheckInPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'checkin',
          roles: ['member', 'guest'],
        },
      },
      {
        path: 'checkin-audit',
        name: 'checkin-audit',
        component: () => import('@/pages/dashboard/CheckInAuditPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'checkin',
          roles: ['admin', 'owner'],
        },
      },
      {
        path: 'members',
        name: 'members',
        component: () => import('@/pages/dashboard/MembersPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['admin', 'owner'],
        },
      },
      {
        path: 'management',
        name: 'management',
        component: () => import('@/pages/dashboard/ManagementPage.vue'),
        meta: { requiresAuth: true, roles: ['admin', 'owner'] },
      },
      {
        path: 'users',
        name: 'users',
        redirect: (to) => ({ path: '/dashboard/management', query: { ...to.query, tab: 'users' } }),
        meta: {
          requiresAuth: true,
          roles: ['admin', 'owner'],
        },
      },
      {
        path: 'branches',
        name: 'branches',
        redirect: (to) => ({
          path: '/dashboard/management',
          query: { ...to.query, tab: 'branches' },
        }),
        meta: {
          requiresAuth: true,
          roles: ['admin'],
        },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const moduleStore = useModuleStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/auth/login'
  }

  if (to.name === 'dashboard' && authStore.role === 'trainer') {
    if (moduleStore.isModuleEnabled('pos')) return '/dashboard/pos'
    if (moduleStore.isModuleEnabled('routines')) return '/dashboard/routines'
    return '/dashboard/disponibilidad'
  }

  // El kiosco público no requiere haber cargado módulos de una sesión privada.
  if (
    to.name === 'standalone-checkin' &&
    authStore.isAuthenticated &&
    moduleStore.loaded &&
    !moduleStore.isModuleEnabled('checkin')
  ) {
    return '/'
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
    if (authStore.role === 'trainer') return '/dashboard'
    if (['member', 'guest'].includes(authStore.role)) {
      if (moduleStore.isModuleEnabled('checkin')) return '/dashboard/checkin'
      if (moduleStore.isModuleEnabled('routines')) return '/dashboard/routine'
    }

    return '/dashboard'
  }

  if (
    to.meta.moduleAny &&
    moduleStore.loaded &&
    !to.meta.moduleAny.some((key) => moduleStore.isModuleEnabled(key))
  )
    return '/dashboard'

  if (
    to.name === 'routines' &&
    authStore.role === 'trainer' &&
    moduleStore.loaded &&
    !moduleStore.isModuleEnabled('routines')
  )
    return '/dashboard'

  if (to.meta.module && moduleStore.loaded && !moduleStore.isModuleEnabled(to.meta.module)) {
    return '/dashboard'
  }
})

export default router
