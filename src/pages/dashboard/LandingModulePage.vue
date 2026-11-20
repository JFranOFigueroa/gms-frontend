<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ModuleTabs from '@/components/dashboard/ModuleTabs.vue'
import ModuleKpis from '@/components/dashboard/ModuleKpis.vue'
import LandingBuilderPage from '@/pages/dashboard/LandingBuilderPage.vue'
import MediaLibraryPage from '@/pages/dashboard/MediaLibraryPage.vue'
import { useLandingStore } from '@/stores/useLandingStore'
import { useMediaStore } from '@/stores/useMediaStore'

const route = useRoute()
const router = useRouter()
const landing = useLandingStore()
const media = useMediaStore()
const tabs = [
  { id: 'editor', label: 'Editor' },
  { id: 'media', label: 'Multimedia' },
]
const activeTab = computed({
  get: () => (route.query.tab === 'media' ? 'media' : 'editor'),
  set: (tab) =>
    router.replace({ path: '/dashboard/landing-builder', query: { ...route.query, tab } }),
})
const stats = computed(() => [
  {
    label: 'Bloques de la landing',
    value: landing.blocks.length,
    detail: 'Contenido del sitio público',
  },
  {
    label: 'Bloques visibles',
    value: landing.sortedBlocks.length,
    detail: 'Configurados como activos',
  },
  {
    label: 'Recursos multimedia',
    value: media.assets.length,
    detail: 'Biblioteca global de imágenes',
  },
])
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-black sm:text-4xl">Landing Builder</h1>
      <p class="mt-1 text-sm text-[var(--color-text-secondary)]">
        Edita la landing global y gestiona sus recursos multimedia.
      </p>
    </div>
    <ModuleKpis :items="stats" />
    <ModuleTabs v-model="activeTab" :tabs="tabs" />
    <LandingBuilderPage v-if="activeTab === 'editor'" embedded />
    <MediaLibraryPage v-else embedded />
  </div>
</template>
