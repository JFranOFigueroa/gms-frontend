<script setup>
defineProps({
  title: String,
  subtitle: String,
})
</script>

<template>
  <section class="px-4 py-12 sm:px-6 sm:py-20">
    <div class="mx-auto max-w-7xl">
      <div class="mb-8 sm:mb-12">
        <h2 class="text-3xl font-bold sm:text-4xl">
          {{ title }}
        </h2>

        <p v-if="subtitle" class="mt-3 text-sm text-[var(--color-text-secondary)] sm:mt-4 sm:text-base">
          {{ subtitle }}
        </p>
      </div>

      <slot />
    </div>
  </section>
</template>
