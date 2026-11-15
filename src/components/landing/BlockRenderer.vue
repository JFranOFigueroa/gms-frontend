<script setup>
import { blockRegistry } from './blockRegistry'

defineProps({
  blocks: { type: Array, required: true },
  mediaAssets: { type: Array, default: null },
  publicSite: { type: Object, default: null },
})

const resolveComponent = (type) => {
  return blockRegistry[type]
}
</script>

<template>
  <component
    v-for="block in blocks"
    :key="block.id"
    :is="resolveComponent(block.type)"
    :data="block.data"
    :media-assets="mediaAssets"
    :public-site="publicSite"
  />
</template>
