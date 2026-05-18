<script setup>
import { computed } from 'vue'

import { VueDraggable } from 'vue-draggable-plus'

import BlockEditorCard from './BlockEditorCard.vue'

import { useLandingStore } from '@/stores/useLandingStore'

const props = defineProps({
  blocks: Array,
})

const landingStore = useLandingStore()

const draggableBlocks = computed({
  get() {
    return props.blocks
  },

  set(value) {
    landingStore.blocks = value

    landingStore.recalculateOrder()
  },
})
</script>

<template>
  <VueDraggable
    v-model="draggableBlocks"
    class="space-y-6"
    :animation="200"
    ghost-class="ghost-block"
    handle=".drag-handle"
  >
    <BlockEditorCard v-for="block in draggableBlocks" :key="block.id" :block="block" />
  </VueDraggable>
</template>
