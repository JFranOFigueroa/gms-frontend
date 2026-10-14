<script setup>
import { computed, ref } from 'vue'

import { RouterLink } from 'vue-router'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore } from '@/stores/useUserStore'
import { useClassScheduleStore } from '@/stores/useClassScheduleStore'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { usePosStore } from '@/stores/usePosStore'

const authStore = useAuthStore()
const userStore = useUserStore()
const scheduleStore = useClassScheduleStore()
const checkinStore = useCheckinStore()
const posStore = usePosStore()

const isAdmin = computed(() => authStore.role === 'admin')
const isTrainer = computed(() => authStore.role === 'trainer')

const todayISO = new Date().toISOString().split('T')[0]

const activeMembers = computed(() => userStore.users.filter((user) => user.role === 'member' && user.active).length)
const activeTrainers = computed(() => userStore.users.filter((user) => user.role === 'trainer' && user.active).length)

const todayClasses = computed(() => {
  return scheduleStore.classes.filter((gymClass) => gymClass.date === todayISO)
})

const todayCheckins = computed(() => checkinStore.todaysCheckins)

const occupancy = computed(() => {
  const capacity = todayClasses.value.reduce((total, gymClass) => total + (Number(gymClass.capacity) || 0), 0)
  const attendees = todayClasses.value.reduce((total, gymClass) => total + (gymClass.attendees?.length || 0), 0)

  if (capacity <= 0) return 0

  return Math.round((attendees / capacity) * 100)
})

const posSalesToday = computed(() => {
  return posStore.sales.filter((sale) => sale.createdAt.split('T')[0] === todayISO)
})

const posRevenueToday = computed(() => {
  return posSalesToday.value.reduce((total, sale) => total + (Number(sale.total) || 0), 0)
})

const lowStockCount = computed(() => posStore.lowStockProducts.length)

const todaySchedule = computed(() => {
  return [...todayClasses.value].sort((a, b) => a.startTime.localeCompare(b.startTime))
})

const adminActivity = computed(() => {
  const checkinEvents = checkinStore.checkins.slice(0, 10).map((checkin) => ({
    id: `checkin-${checkin.id}`,
    title: `${checkin.userName} hizo check-in`,
    description: `${checkin.method} · ${checkin.role}`,
    timestamp: checkin.timestamp,
    type: 'check-in',
  }))

  const saleEvents = posStore.sales.slice(0, 10).map((sale) => ({
    id: `sale-${sale.id}`,
    title: `Venta #${sale.id} registrada`,
    description: `${sale.items.length} producto(s) · $${sale.total}`,
    timestamp: sale.createdAt,
    type: 'POS',
  }))

  return [...checkinEvents, ...saleEvents]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10)
})

const trainerSales = computed(() => {
  return posStore.sales
    .filter((sale) => sale.createdBy === authStore.user?.name)
    .slice(0, 10)
})

const detailOpen = ref(false)
const detailMetric = ref(null)

const openDetail = (metric) => {
  detailMetric.value = metric
  detailOpen.value = true
}

const closeDetail = () => {
  detailOpen.value = false
}

const hourlyOccupancy = computed(() => {
  const counts = Array.from({ length: 24 }, () => 0)

  checkinStore.todaysCheckins.forEach((checkin) => {
    counts[new Date(checkin.timestamp).getHours()] += 1
  })

  return counts
})

const hourlyMax = computed(() => Math.max(1, ...hourlyOccupancy.value))

const occupancyPeak = computed(() => {
  const max = Math.max(...hourlyOccupancy.value)
  const hour = hourlyOccupancy.value.findIndex((count) => count === max)

  return { hour: hour === -1 ? 0 : hour, count: max }
})

const productsByQuantity = computed(() => {
  return [...posStore.salesByProduct].sort((a, b) => b.qty - a.qty)
})

const productsByRevenue = computed(() => {
  return [...posStore.salesByProduct].sort((a, b) => b.revenue - a.revenue)
})

const topRevenueProduct = computed(() => productsByRevenue.value[0] || null)

const detailTitle = computed(() => {
  const titles = {
    occupancy: 'Detalle de ocupación',
    sales: 'Detalle de ventas',
    revenue: 'Detalle de ingresos',
    stock: 'Detalle de stock bajo',
  }

  return titles[detailMetric.value] || 'Detalle'
})

const saleItems = computed(() => {
  return posStore.sales.flatMap((sale) =>
    sale.items.map((item) => ({
      ...item,
      createdAt: sale.createdAt,
      createdBy: sale.createdBy,
    })),
  )
})
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 class="text-4xl font-black">
          {{ isAdmin ? 'Dashboard administrativo' : 'Dashboard de entrenador' }}
        </h1>

        <p class="text-[var(--color-text-secondary)] mt-2">
          {{ isAdmin ? 'Resumen operativo del gimnasio' : 'Resumen de tu jornada y actividad' }}
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <RouterLink v-if="isAdmin" to="/dashboard/users">
          <BaseButton variant="secondary"> Usuarios </BaseButton>
        </RouterLink>

        <RouterLink to="/dashboard/pos">
          <BaseButton variant="secondary"> POS </BaseButton>
        </RouterLink>

        <RouterLink to="/dashboard/calendar">
          <BaseButton variant="secondary"> Calendario </BaseButton>
        </RouterLink>
      </div>
    </div>

    <!-- Admin stats -->
    <div v-if="isAdmin" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Miembros activos</p>
        <h3 class="text-5xl font-black mt-4">{{ activeMembers }}</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Entrenadores activos</p>
        <h3 class="text-5xl font-black mt-4">{{ activeTrainers }}</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Clases hoy</p>
        <h3 class="text-5xl font-black mt-4">{{ todayClasses.length }}</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Check-ins hoy</p>
        <h3 class="text-5xl font-black mt-4">{{ todayCheckins.length }}</h3>
      </BaseCard>
    </div>

    <!-- Admin secondary stats -->
    <div v-if="isAdmin" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <BaseCard class="cursor-pointer" @click="openDetail('occupancy')">
        <p class="text-[var(--color-text-secondary)]">Ocupación de clases hoy</p>
        <h3 class="text-5xl font-black mt-4">{{ occupancy }}%</h3>
      </BaseCard>

      <BaseCard class="cursor-pointer" @click="openDetail('sales')">
        <p class="text-[var(--color-text-secondary)]">Ventas POS hoy</p>
        <h3 class="text-5xl font-black mt-4">{{ posSalesToday.length }}</h3>
      </BaseCard>

      <BaseCard class="cursor-pointer" @click="openDetail('revenue')">
        <p class="text-[var(--color-text-secondary)]">Ingresos POS hoy</p>
        <h3 class="text-5xl font-black mt-4">${{ posRevenueToday }}</h3>
      </BaseCard>

      <BaseCard class="cursor-pointer" @click="openDetail('stock')">
        <p class="text-[var(--color-text-secondary)]">Stock bajo</p>
        <h3 class="text-5xl font-black mt-4">{{ lowStockCount }}</h3>
      </BaseCard>
    </div>

    <!-- Trainer stats -->
    <div v-if="isTrainer" class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Clases hoy</p>
        <h3 class="text-5xl font-black mt-4">{{ todayClasses.length }}</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Check-ins hoy</p>
        <h3 class="text-5xl font-black mt-4">{{ todayCheckins.length }}</h3>
      </BaseCard>

      <BaseCard class="cursor-pointer" @click="openDetail('sales')">
        <p class="text-[var(--color-text-secondary)]">Ventas POS hoy</p>
        <h3 class="text-5xl font-black mt-4">{{ posSalesToday.length }}</h3>
      </BaseCard>

      <BaseCard class="cursor-pointer" @click="openDetail('revenue')">
        <p class="text-[var(--color-text-secondary)]">Ingresos POS hoy</p>
        <h3 class="text-5xl font-black mt-4">${{ posRevenueToday }}</h3>
      </BaseCard>
    </div>

    <!-- Main content -->
    <div class="grid gap-6 xl:grid-cols-2">
      <!-- Agenda -->
      <BaseCard>
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-2xl font-bold">Agenda de hoy</h2>

            <RouterLink to="/dashboard/calendar">
              <BaseButton variant="secondary"> Ver calendario </BaseButton>
            </RouterLink>
          </div>

          <div v-if="!todaySchedule.length" class="text-[var(--color-text-secondary)]">
            No hay clases programadas para hoy
          </div>

          <div
            v-for="gymClass in todaySchedule"
            :key="gymClass.id"
            class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p class="font-semibold">
                {{ gymClass.name }}
              </p>

              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ gymClass.startTime }} - {{ gymClass.endTime }} · {{ gymClass.capacity }} cupos
              </p>
            </div>

            <div class="text-sm text-[var(--color-text-secondary)]">
              {{ gymClass.attendees?.length || 0 }} inscritos
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Admin activity -->
      <BaseCard v-if="isAdmin">
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-2xl font-bold">Actividad reciente</h2>

            <RouterLink to="/dashboard/checkin-audit">
              <BaseButton variant="secondary"> Auditoría </BaseButton>
            </RouterLink>
          </div>

          <div v-if="!adminActivity.length" class="text-[var(--color-text-secondary)]">
            No hay actividad reciente
          </div>

          <div
            v-for="activity in adminActivity"
            :key="activity.id"
            class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p class="font-semibold">
                {{ activity.title }}
              </p>

              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ activity.description }}
              </p>
            </div>

            <div class="text-right">
              <p class="text-xs rounded-full bg-[var(--color-primary)]/15 px-2 py-1 text-[var(--color-primary)]">
                {{ activity.type }}
              </p>

              <p class="text-xs text-[var(--color-text-secondary)] mt-1">
                {{ new Date(activity.timestamp).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Trainer sales -->
      <BaseCard v-if="isTrainer">
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-2xl font-bold">Mis ventas recientes</h2>

            <RouterLink to="/dashboard/pos">
              <BaseButton variant="secondary"> POS </BaseButton>
            </RouterLink>
          </div>

          <div v-if="!trainerSales.length" class="text-[var(--color-text-secondary)]">
            Aún no tienes ventas registradas
          </div>

          <div
            v-for="sale in trainerSales"
            :key="sale.id"
            class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col gap-1 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <p class="font-semibold">
                Venta #{{ sale.id }}
              </p>

              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ sale.items.map((item) => `${item.name} x${item.qty}`).join(', ') }}
              </p>
            </div>

            <div class="text-right">
              <p class="font-bold">
                ${{ sale.total }}
              </p>

              <p class="text-xs text-[var(--color-text-secondary)] mt-1">
                {{ new Date(sale.createdAt).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseModal :open="detailOpen" @close="closeDetail">
        <div class="space-y-6">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-3xl font-black">
              {{ detailTitle }}
            </h2>

            <BaseButton variant="secondary" @click="closeDetail"> Cerrar </BaseButton>
          </div>

          <!-- Occupancy detail -->
          <div v-if="detailMetric === 'occupancy'" class="space-y-5">
            <BaseCard>
              <div class="space-y-2">
                <p class="text-[var(--color-text-secondary)]">Ocupación actual</p>
                <h3 class="text-5xl font-black">
                  {{ occupancy }}%
                </h3>
                <p class="text-[var(--color-text-secondary)]">
                  {{ todayClasses.length ? 'Clases programadas hoy' : 'Sin clases programadas hoy' }}
                </p>
              </div>
            </BaseCard>

            <BaseCard>
              <div class="space-y-4">
                <h3 class="text-2xl font-bold">Ocupación por hora</h3>

                <div class="flex h-56 items-end gap-1">
                  <div
                    v-for="(count, hour) in hourlyOccupancy"
                    :key="hour"
                    class="flex flex-1 flex-col items-center gap-1"
                  >
                    <div
                      class="w-full rounded-t-md bg-[var(--color-primary)]/70"
                      :style="{ height: `${Math.max(4, (count / hourlyMax) * 100)}%` }"
                      :title="`${hour}:00 - ${count} check-ins`"
                    />

                    <span v-if="hour % 3 === 0" class="text-[10px] text-[var(--color-text-secondary)]">
                      {{ hour }}h
                    </span>
                  </div>
                </div>

                <p class="text-[var(--color-text-secondary)]">
                  Pico: {{ occupancyPeak.hour }}:00 con {{ occupancyPeak.count }} check-in(s)
                </p>
              </div>
            </BaseCard>
          </div>

          <!-- Sales detail -->
          <div v-if="detailMetric === 'sales'" class="space-y-4">
            <BaseCard>
              <div class="space-y-2">
                <p class="text-[var(--color-text-secondary)]">Ventas de hoy</p>
                <h3 class="text-5xl font-black">
                  {{ posSalesToday.length }}
                </h3>
              </div>
            </BaseCard>

            <div v-if="!productsByQuantity.length" class="text-[var(--color-text-secondary)]">
              No hay productos vendidos todavía
            </div>

            <BaseCard v-for="product in productsByQuantity" :key="product.productId">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="font-semibold">
                    {{ product.name }}
                  </p>
                  <p class="text-sm text-[var(--color-text-secondary)]">
                    {{ product.qty }} unidades vendidas
                  </p>
                </div>
                <p class="font-bold">
                  ${{ product.revenue }}
                </p>
              </div>
            </BaseCard>
          </div>

          <!-- Revenue detail -->
          <div v-if="detailMetric === 'revenue'" class="space-y-4">
            <BaseCard>
              <div class="space-y-2">
                <p class="text-[var(--color-text-secondary)]">Ingresos de hoy</p>
                <h3 class="text-5xl font-black">
                  ${{ posRevenueToday }}
                </h3>

                <p v-if="topRevenueProduct" class="text-[var(--color-text-secondary)]">
                  Producto con más ingresos: {{ topRevenueProduct.name }} (${{ topRevenueProduct.revenue }})
                </p>
              </div>
            </BaseCard>

            <div v-if="!productsByRevenue.length" class="text-[var(--color-text-secondary)]">
              No hay ingresos registrados
            </div>

            <BaseCard v-for="product in productsByRevenue" :key="product.productId">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="font-semibold">
                    {{ product.name }}
                  </p>
                  <p class="text-sm text-[var(--color-text-secondary)]">
                    {{ product.qty }} unidades
                  </p>
                </div>
                <p class="font-bold">
                  ${{ product.revenue }}
                </p>
              </div>
            </BaseCard>
          </div>

          <!-- Stock detail -->
          <div v-if="detailMetric === 'stock'" class="space-y-4">
            <div v-if="!posStore.lowStockProducts.length" class="text-[var(--color-text-secondary)]">
              No hay productos con stock bajo
            </div>

            <BaseCard v-for="product in posStore.lowStockProducts" :key="product.id">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="font-semibold">
                    {{ product.name }}
                  </p>
                  <p class="text-sm text-[var(--color-text-secondary)]">
                    {{ product.category }} · SKU {{ product.sku }}
                  </p>
                </div>
                <p class="font-bold text-red-400">
                  Stock: {{ product.stock }}
                </p>
              </div>
            </BaseCard>
          </div>
        </div>
      </BaseModal>
    </div>
  </div>
</template>