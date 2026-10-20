<script setup>
import { computed, ref, watch } from 'vue'

import { useRouter } from 'vue-router'

import { ROLE_LABELS } from '@/config/permissions'

import { useAuthStore } from '@/stores/useAuthStore'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { useGymsStore } from '@/stores/useGymsStore'
import { useNotificationStore } from '@/stores/useNotificationStore'
import { usePosStore } from '@/stores/usePosStore'

defineEmits(['toggle-sidebar'])

const authStore = useAuthStore()
const checkinStore = useCheckinStore()
const gymsStore = useGymsStore()
const notificationStore = useNotificationStore()
const posStore = usePosStore()
const router = useRouter()

const notificationOpen = ref(false)

const canSwitchGym = computed(() => ['admin', 'owner', 'trainer'].includes(authStore.role))

const isStaff = computed(() => ['admin', 'owner', 'trainer'].includes(authStore.role))

const availableGyms = computed(() => {
  if (authStore.role === 'admin') return gymsStore.gyms

  const allowedIds = authStore.user?.gymIds

  if (!allowedIds?.length) {
    return gymsStore.gyms.filter((gym) => gym.id === gymsStore.activeGymId)
  }

  return gymsStore.gyms.filter((gym) => allowedIds.includes(gym.id))
})

const changeGym = (event) => {
  const gymId = Number(event.target.value)

  if (!availableGyms.value.some((gym) => gym.id === gymId)) return

  gymsStore.setActiveGym(gymId)

  posStore.clearCart()
}

watch(
  availableGyms,
  (gyms) => {
    if (!canSwitchGym.value || !gyms.length) return

    if (!gyms.some((gym) => gym.id === gymsStore.activeGymId)) {
      gymsStore.setActiveGym(gyms[0].id)
    }
  },
  { immediate: true },
)

const userName = computed(() => authStore.user?.name || 'Usuario')

const userRole = computed(() => ROLE_LABELS[authStore.role] || 'Usuario')

const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const syncNotifications = () => {
  checkinStore.checkins.slice(0, 10).forEach((checkin) => {
    const denied = checkin.allowed === false

    notificationStore.ensureNotification({
      id: `checkin-${checkin.id}`,
      type: denied ? 'acceso' : 'check-in',
      title: denied ? `Acceso denegado: ${checkin.userName}` : `${checkin.userName} hizo check-in`,
      description: denied ? checkin.reason : `${checkin.method} · ${checkin.role}`,
      timestamp: checkin.timestamp,
      target: '/dashboard/checkin-audit',
    })
  })

  posStore.sales.slice(0, 10).forEach((sale) => {
    notificationStore.ensureNotification({
      id: `sale-${sale.id}`,
      type: 'POS',
      title: `Venta #${sale.id} registrada`,
      description: `${sale.items.length} producto(s) · $${sale.total}`,
      timestamp: sale.createdAt,
      target: '/dashboard/pos',
    })
  })

  const lowStockIds = new Set(posStore.lowStockProducts.map((product) => product.id))

  posStore.lowStockProducts.forEach((product) => {
    notificationStore.ensureNotification({
      id: `stock-${product.id}`,
      type: 'stock',
      title: `Stock bajo: ${product.name}`,
      description: `Quedan ${product.stock} unidades`,
      timestamp: new Date().toISOString(),
      target: '/dashboard/pos',
    })
  })

  notificationStore.items
    .filter((notification) => notification.id.startsWith('stock-'))
    .forEach((notification) => {
      const id = Number(notification.id.replace('stock-', ''))

      if (!lowStockIds.has(id)) {
        notificationStore.removeNotification(notification.id)
      }
    })
}

watch(
  () => [authStore.role, checkinStore.checkins, posStore.sales, posStore.lowStockProducts],
  () => {
    if (isStaff.value) syncNotifications()
  },
  { immediate: true, deep: true },
)

const toggleNotifications = () => {
  notificationOpen.value = !notificationOpen.value

  if (notificationOpen.value) {
    notificationStore.markAllAsRead()
  }
}

const openNotification = (notification) => {
  notificationStore.markAsRead(notification.id)
  notificationOpen.value = false

  if (notification.target) {
    router.push(notification.target)
  }
}
</script>

<template>
  <header
    class="h-20 border-b border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-between px-6"
  >
    <!-- LEFT -->
    <div class="flex items-center gap-4">
      <!-- MOBILE MENU BUTTON -->
      <button
        class="lg:hidden w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        @click="$emit('toggle-sidebar')"
      >
        ☰
      </button>

      <!-- TITLE -->
      <div>
        <h2 class="text-2xl font-bold">Dashboard</h2>

        <p class="text-[var(--color-text-secondary)] text-sm">Bienvenido de vuelta</p>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="flex items-center gap-4">
      <!-- Gym selector -->
      <div v-if="canSwitchGym" class="hidden sm:block">
        <select
          :value="gymsStore.activeGymId"
          class="h-12 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
          @change="changeGym"
        >
          <option v-for="gym in availableGyms" :key="gym.id" :value="gym.id">
            {{ gym.name }}
          </option>
        </select>
      </div>

      <!-- Notifications -->
      <div v-if="isStaff" class="relative">
        <button
          class="relative w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
          @click="toggleNotifications"
        >
          🔔

          <span
            v-if="notificationStore.unreadCount"
            class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white"
          >
            {{ notificationStore.unreadCount }}
          </span>
        </button>

        <div
          v-if="notificationOpen"
          class="fixed inset-0 z-40"
          @click="notificationOpen = false"
        />

        <div
          v-if="notificationOpen"
          class="absolute right-0 top-14 z-50 w-80 max-h-96 overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl"
        >
          <div class="mb-3 flex items-center justify-between gap-3">
            <h3 class="text-lg font-bold">Notificaciones</h3>

            <span class="text-sm text-[var(--color-text-secondary)]">
              {{ notificationStore.items.length }}
            </span>
          </div>

          <div v-if="!notificationStore.items.length" class="text-[var(--color-text-secondary)]">
            No hay notificaciones
          </div>

          <button
            v-for="notification in notificationStore.sortedItems"
            :key="notification.id"
            type="button"
            class="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/40 p-3 text-left transition hover:border-[var(--color-primary)]"
            @click="openNotification(notification)"
          >
            <div class="flex items-center justify-between gap-3">
              <p class="font-semibold">
                {{ notification.title }}
              </p>

              <span class="rounded-full bg-[var(--color-primary)]/15 px-2 py-1 text-xs text-[var(--color-primary)]">
                {{ notification.type }}
              </span>
            </div>

            <p class="mt-1 text-sm text-[var(--color-text-secondary)]">
              {{ notification.description }}
            </p>

            <p class="mt-1 text-xs text-[var(--color-text-secondary)]">
              {{ new Date(notification.timestamp).toLocaleString() }}
            </p>
          </button>
        </div>
      </div>

      <!-- User -->
      <div
        class="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-2"
      >
        <div
          class="w-10 h-10 rounded-xl bg-[var(--color-text)] text-[var(--color-background)] flex items-center justify-center font-bold"
        >
          {{ userInitial }}
        </div>

        <div class="hidden md:block">
          <p class="font-semibold">
            {{ userName }}
          </p>

          <p class="text-xs text-[var(--color-text-secondary)]">
            {{ userRole }}
          </p>
        </div>
      </div>
    </div>
  </header>
</template>