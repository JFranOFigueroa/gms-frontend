<script setup>
import { useMediaStore } from '@/stores/useMediaStore'

import MediaUploader from './MediaUploader.vue'
import MediaCard from './MediaCard.vue'

const mediaStore = useMediaStore()
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-black">Media Library</h1>

        <p class="text-zinc-500 mt-2">Gestiona imágenes y recursos visuales</p>
      </div>
    </div>

    <!-- Upload -->
    <MediaUploader />

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <MediaCard v-for="asset in mediaStore.assets" :key="asset.id" :asset="asset" />
    </div>
  </div>
</template>
