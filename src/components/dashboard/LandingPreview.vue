<script setup>
import { computed } from 'vue'

import BlockRenderer from '@/components/landing/BlockRenderer.vue'

import { useLandingStore } from '@/stores/useLandingStore'

import { useBuilderStore } from '@/stores/useBuilderStore'

const landingStore = useLandingStore()

const builderStore = useBuilderStore()

const previewWidth = computed(() => {
  const map = {
    desktop: 'w-full',

    tablet: 'w-[900px]',

    mobile: 'w-[430px]',
  }

  return map[builderStore.previewDevice]
})
</script>

<template>
  <div
    class="h-full rounded-3xl border border-[var(--color-border)] bg-zinc-950 overflow-hidden flex flex-col"
  >
    <!-- TOPBAR -->
    <div class="h-14 border-b border-[var(--color-border)] px-6 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full bg-red-500" />

        <div class="w-3 h-3 rounded-full bg-yellow-500" />

        <div class="w-3 h-3 rounded-full bg-green-500" />
      </div>

      <div class="text-sm text-[var(--color-text-secondary)]">Preview</div>
    </div>

    <!-- VIEWPORT -->
    <div class="flex-1 overflow-auto bg-[var(--color-surface)] p-6 flex justify-center">
      <div
        class="transition-all duration-500 bg-black rounded-3xl overflow-hidden shadow-2xl min-h-full"
        :class="previewWidth"
      >
        <BlockRenderer :blocks="landingStore.sortedBlocks" />
      </div>
    </div>
  </div>
</template>
