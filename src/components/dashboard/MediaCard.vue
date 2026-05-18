<script setup>
defineProps({
  asset: Object,
})
</script>

<template>
  <div class="bg-[var(--color-surface)] border border-zinc-800 rounded-3xl overflow-hidden">
    <!-- Image -->
    <div class="aspect-video">
      <img :src="asset.url" :alt="asset.name" class="w-full h-full object-cover" />
    </div>

    <!-- Info -->
    <div class="p-4">
      <h3 class="font-bold">
        {{ asset.name }}
      </h3>

      <p class="text-zinc-500 text-sm mt-1">
        {{ asset.type }}
      </p>
    </div>
  </div>
</template>
