import { createRouter, createWebHistory } from 'vue-router'

import PublicLayout from '@/layouts/PublicLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DashboardLayout from '@/layouts/DashboardLayout.vue'

import HomePage from '@/pages/public/HomePage.vue'
import LoginPage from '@/pages/auth/LoginPage.vue'
import DashboardPage from '@/pages/dashboard/DashboardPage.vue'

import { useAuthStore } from '@/stores/useAuthStore'

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
      },
      {
        path: 'landing-builder',
        name: 'landing-builder',
        component: () => import('@/pages/dashboard/LandingBuilderPage.vue'),
      },
      {
        path: 'media',
        name: 'media',
        component: () => import('@/pages/dashboard/MediaLibraryPage.vue'),
      },
      {
        path: 'class-templates',

        component: () => import('@/pages/dashboard/ClassTemplatesPage.vue'),
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

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/auth/login'
  }
})

export default router
