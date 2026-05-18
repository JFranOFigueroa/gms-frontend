<script setup>
defineProps({
  title: String,
  subtitle: String,
})
</script>

<template>
  <section class="py-20 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="mb-12">
        <h2 class="text-4xl font-bold">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="text-zinc-400 mt-4">
          {{ subtitle }}
        </p>
      </div>

      <slot />
    </div>
  </section>
</template>
