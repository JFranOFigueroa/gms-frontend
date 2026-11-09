<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLandingStore } from '@/stores/useLandingStore'
import { usePublicLandingStore } from '@/stores/usePublicLandingStore'
import { themePresets } from '@/config/themePresets'
import PublicTopbar from '@/components/landing/PublicTopbar.vue'
import BlockRenderer from '@/components/landing/BlockRenderer.vue'

const route = useRoute()
const landingStore = useLandingStore() // Se mantiene la vista raíz ya existente.
const publicStore = usePublicLandingStore()
const slug = computed(() => (typeof route.params.slug === 'string' ? route.params.slug : null))
watch(
  slug,
  async (value) => {
    if (value) await publicStore.load(value)
    else publicStore.clear()
  },
  { immediate: true },
)
const publicGym = computed(() => publicStore.page?.gym || null)
const blocks = computed(() =>
  slug.value ? publicStore.page?.blocks || [] : landingStore.sortedBlocks,
)
const publicStyles = computed(() => {
  if (!slug.value || !publicStore.page?.theme) return {}
  const theme = publicStore.page.theme
  const preset = themePresets.find(
    (item) => item.id === (theme.preset || theme.themePreset || theme.theme_preset),
  )
  const entries = {}
  // Lista blanca tanto para colores del tema como para sus ajustes personalizados.
  const colors = { ...(preset?.colors || {}), ...(theme.colors || {}), ...(theme.overrides || {}) }
  for (const [key, value] of Object.entries(colors)) {
    if (
      /^[a-zA-Z-]{1,40}$/.test(key) &&
      typeof value === 'string' &&
      /^(#[a-f\d]{3,8}|rgb\([\d\s,.%]+\)|[a-z]{3,24})$/i.test(value)
    )
      entries[key] = value
  }
  return Object.fromEntries(
    Object.entries(entries).map(([k, v]) => [
      `--color-${k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())}`,
      v,
    ]),
  )
})
</script>

<template>
  <div
    :style="publicStyles"
    class="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]"
  >
    <template v-if="slug">
      <div v-if="publicStore.loading" role="status" class="mx-auto max-w-3xl p-12 text-center">
        Cargando página del gimnasio…
      </div>
      <div
        v-else-if="publicStore.error || !publicStore.page"
        role="alert"
        class="mx-auto max-w-3xl p-12 text-center"
      >
        <h1 class="text-2xl font-bold">Página no disponible</h1>
        <p class="mt-3 text-[var(--color-text-secondary)]">
          {{ publicStore.error || 'No hay contenido público.' }}
        </p>
      </div>
      <template v-else>
        <PublicTopbar :public-gym="publicGym" />
        <div v-if="!blocks.length" class="mx-auto max-w-3xl p-12 text-center">
          Este gimnasio todavía no ha agregado contenido a su página.
        </div>
        <BlockRenderer
          v-else
          :blocks="blocks"
          :public-gym="publicGym"
          :media-assets="publicStore.page?.mediaAssets || []"
        />
      </template>
    </template>
    <template v-else>
      <PublicTopbar />
      <div
        v-if="!blocks.length"
        class="mx-auto max-w-3xl p-12 text-center text-[var(--color-text-secondary)]"
      >
        Visita el enlace de tu gimnasio para conocer sus instalaciones y servicios.
      </div>
      <BlockRenderer v-else :blocks="blocks" />
    </template>
  </div>
</template>
