<script setup>
import { useLandingStore } from '@/stores/useLandingStore'

import PublicTopbar from '@/components/landing/PublicTopbar.vue'

import BlockRenderer from '@/components/landing/BlockRenderer.vue'

const landingStore = useLandingStore()
</script>

<template>
  <PublicTopbar />
  <BlockRenderer :blocks="landingStore.sortedBlocks" />
</template>
