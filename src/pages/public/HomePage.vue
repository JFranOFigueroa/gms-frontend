<script setup>
import { computed, onMounted } from 'vue'
import { usePublicLandingStore } from '@/stores/usePublicLandingStore'
import { themePresets } from '@/config/themePresets'
import PublicTopbar from '@/components/landing/PublicTopbar.vue'
import BlockRenderer from '@/components/landing/BlockRenderer.vue'

const publicStore = usePublicLandingStore()
onMounted(() => publicStore.load())

const site = computed(() => publicStore.page?.site || null)
const blocks = computed(() => publicStore.page?.blocks || [])
const hasHero = computed(() => blocks.value[0]?.type === 'hero')
const publicStyles = computed(() => {
  if (!publicStore.page?.theme) return {}
  const theme = publicStore.page.theme
  const preset = themePresets.find(
    (item) => item.id === (theme.preset || theme.themePreset || theme.theme_preset),
  )
  const entries = {}
  // Lista blanca tanto para colores del tema como para sus ajustes personalizados.
  const colors = { ...preset?.colors, ...theme.colors, ...theme.overrides }
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
    class="min-h-dvh bg-[var(--color-background)] text-[var(--color-text)]"
  >
    <div v-if="publicStore.loading" role="status" class="mx-auto max-w-3xl p-12 text-center">
      Cargando página…
    </div>
    <div
      v-else-if="publicStore.error"
      role="alert"
      class="mx-auto max-w-3xl p-12 text-center"
    >
      <h1 class="text-2xl font-bold">Página no disponible</h1>
      <p class="mt-3 text-[var(--color-text-secondary)]">{{ publicStore.error }}</p>
    </div>
    <template v-else>
      <PublicTopbar :site="site" />
      <div
        v-if="!blocks.length"
        class="mx-auto max-w-3xl px-4 pb-12 pt-24 text-center text-[var(--color-text-secondary)] sm:p-12"
      >
        El sitio todavía no tiene contenido público.
      </div>
      <template v-else>
        <div v-if="!hasHero" class="h-16 sm:h-20" aria-hidden="true" />
        <BlockRenderer
          :blocks="blocks"
          :public-site="site"
          :media-assets="publicStore.page?.mediaAssets || []"
        />
      </template>
    </template>
  </div>
</template>
