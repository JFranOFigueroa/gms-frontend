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
        path: 'calendar',
        component: () => import('@/pages/dashboard/CalendarPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'calendar',
        },
      },
      {
        path: 'landing-builder',
        name: 'landing-builder',
        component: () => import('@/pages/dashboard/LandingBuilderPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'media',
        name: 'media',
        component: () => import('@/pages/dashboard/MediaLibraryPage.vue'),
        meta: {
          requiresAuth: true,
        },
      },
      {
        path: 'class-templates',
        component: () => import('@/pages/dashboard/ClassTemplatesPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'calendar',
        },
      },
      {
        path: 'pos',
        name: 'pos',
        component: () => import('@/pages/dashboard/PosPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'pos',
          roles: ['admin', 'trainer'],
        },
      },
      {
        path: 'routines',
        name: 'routines',
        component: () => import('@/pages/dashboard/RoutinesPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'routines',
          roles: ['admin', 'trainer'],
        },
      },
      {
        path: 'routine',
        name: 'my-routine',
        component: () => import('@/pages/dashboard/MemberRoutinePage.vue'),
        meta: {
          requiresAuth: true,
          module: 'routines',
        },
      },
      {
        path: 'checkin',
        name: 'member-checkin',
        component: () => import('@/pages/dashboard/CheckInPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'checkin',
        },
      },
      {
        path: 'checkin-audit',
        name: 'checkin-audit',
        component: () => import('@/pages/dashboard/CheckInAuditPage.vue'),
        meta: {
          requiresAuth: true,
          module: 'checkin',
          roles: ['admin', 'trainer'],
        },
      },
      {
        path: 'users',
        name: 'users',
        component: () => import('@/pages/dashboard/UsersPage.vue'),
        meta: {
          requiresAuth: true,
          roles: ['admin'],
        },
      },
      {
        path: 'gyms',
        name: 'gyms',
        component: () => import('@/pages/dashboard/GymsPage.vue'),
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

  if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
    return '/dashboard'
  }

  if (to.meta.module && !moduleStore.isModuleEnabled(to.meta.module)) {
    return '/dashboard'
  }
})

export default router