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
    class="h-full rounded-3xl border border-[var(--color-border)] bg-[var(--color-background)] overflow-hidden flex flex-col"
  >
    <!-- TOPBAR -->
    <div
      class="flex h-14 items-center justify-between border-b border-[var(--color-border)] px-4 sm:px-6"
    >
      <div class="flex items-center gap-2">
        <div class="h-3 w-3 rounded-full bg-red-500" />

        <div class="h-3 w-3 rounded-full bg-yellow-500" />

        <div class="h-3 w-3 rounded-full bg-green-500" />
      </div>

      <div class="text-sm text-[var(--color-text-secondary)]">Preview</div>
    </div>

    <!-- VIEWPORT -->
    <div class="flex flex-1 justify-start overflow-auto bg-[var(--color-surface)] p-3 sm:p-6">
      <div
        class="mx-auto min-h-full shrink-0 overflow-hidden rounded-3xl bg-[var(--color-background)] shadow-2xl transition-all duration-500"
        :class="previewWidth"
      >
        <BlockRenderer :blocks="landingStore.sortedBlocks" />
      </div>
    </div>
  </div>
</template>
