<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModuleTabs from '@/components/dashboard/ModuleTabs.vue'
import ModuleKpis from '@/components/dashboard/ModuleKpis.vue'
import UsersPage from '@/pages/dashboard/UsersPage.vue'
import BranchesPage from '@/pages/dashboard/BranchesPage.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBranchesStore } from '@/stores/useBranchesStore'
import { useUserStore } from '@/stores/useUserStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const branches = useBranchesStore()
const users = useUserStore()
const canViewBranches = computed(() => auth.role === 'admin')
const tabs = computed(() => [
  { id: 'users', label: 'Usuarios' },
  ...(canViewBranches.value ? [{ id: 'branches', label: 'Sucursales' }] : []),
])
const activeTab = computed({
  get: () => tabs.value.some((tab) => tab.id === route.query.tab) ? route.query.tab : 'users',
  set: (tab) => router.replace({ path: '/dashboard/management', query: { ...route.query, tab } }),
})
const stats = computed(() => [
  { label: 'Personal de la sucursal', value: users.users.length, detail: 'Propietarios y entrenadores vinculados' },
  { label: 'Personal activo', value: users.activeUsers.length, detail: 'Cuentas activas vinculadas' },
  ...(canViewBranches.value ? [{ label: 'Sucursales registradas', value: branches.branches.length, detail: 'Sucursales de la plataforma' }] : []),
])
</script>

<template>
  <div class="space-y-6">
    <div><h1 class="text-3xl font-black sm:text-4xl">Gestión</h1><p class="mt-1 text-sm text-[var(--color-text-secondary)]">Administra usuarios y sucursales sin salir de esta sección.</p></div>
    <ModuleKpis :items="stats" />
    <ModuleTabs v-if="tabs.length > 1" v-model="activeTab" :tabs="tabs" />
    <UsersPage v-if="activeTab === 'users'" embedded />
    <BranchesPage v-else-if="activeTab === 'branches' && canViewBranches" embedded />
  </div>
</template>
