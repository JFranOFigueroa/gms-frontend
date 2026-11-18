<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModuleTabs from '@/components/dashboard/ModuleTabs.vue'
import ModuleKpis from '@/components/dashboard/ModuleKpis.vue'
import RoutinesPage from '@/pages/dashboard/RoutinesPage.vue'
import ClassTemplatesPage from '@/pages/dashboard/ClassTemplatesPage.vue'
import { useRoutineStore } from '@/stores/useRoutineStore'
import { useClassTemplateStore } from '@/stores/useClassTemplateStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useModuleStore } from '@/stores/useModuleStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const modules = useModuleStore()
const routines = useRoutineStore()
const templates = useClassTemplateStore()
const canViewRoutines = computed(() => modules.isModuleEnabled('routines'))
const canViewTemplates = computed(() => ['admin', 'owner'].includes(auth.role) && modules.isModuleEnabled('calendar'))
const tabs = computed(() => [
  ...(canViewRoutines.value ? [{ id: 'routines', label: 'Rutinas' }] : []),
  ...(canViewTemplates.value ? [{ id: 'templates', label: 'Plantillas' }] : []),
])
const activeTab = computed({
  get: () => tabs.value.some((t) => t.id === route.query.tab) ? route.query.tab : tabs.value[0]?.id || 'routines',
  set: (tab) => router.replace({ path: '/dashboard/routines', query: { ...route.query, tab } }),
})
const stats = computed(() => [
  { label: 'Rutinas disponibles', value: routines.routines.length, detail: 'Biblioteca de la sucursal' },
  { label: 'Rutinas publicadas', value: routines.publishedRoutines.length, detail: 'Visibles para los miembros' },
  ...(canViewTemplates.value ? [{ label: 'Plantillas disponibles', value: templates.templates.length, detail: 'Tipos de clase para el calendario' }] : []),
])
// No se borran ni se trasladan los endpoints originales del calendario.
watch(canViewTemplates, (enabled) => {
  if (enabled) templates.load().catch(() => {})
}, { immediate: true })
</script>

<template>
  <div class="space-y-6">
    <div><h1 class="text-3xl font-black sm:text-4xl">Rutinas</h1><p class="mt-1 text-sm text-[var(--color-text-secondary)]">Gestiona rutinas de entrenamiento y plantillas de clases de la sucursal.</p></div>
    <ModuleKpis :items="stats" />
    <ModuleTabs v-if="tabs.length > 1" v-model="activeTab" :tabs="tabs" />
    <RoutinesPage v-if="activeTab === 'routines' && canViewRoutines" embedded />
    <ClassTemplatesPage v-else-if="activeTab === 'templates' && canViewTemplates" embedded />
    <p v-else class="text-[var(--color-text-secondary)]">El módulo no está disponible para esta sucursal.</p>
  </div>
</template>
