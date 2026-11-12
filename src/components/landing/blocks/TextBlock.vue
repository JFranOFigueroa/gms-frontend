<script setup>
defineProps({
  data: Object,
})

const widthMap = {
  sm: 'max-w-2xl',

  md: 'max-w-3xl',

  lg: 'max-w-5xl',

  xl: 'max-w-6xl',

  '4xl': 'max-w-7xl',
}

const alignMap = {
  left: 'text-left',

  center: 'text-center',

  right: 'text-right',
}
</script>

<template>
  <section
    class="px-4 py-12 sm:px-6 sm:py-24"
    :class="data.background ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-background)]'"
  >
    <div class="mx-auto" :class="[widthMap[data.maxWidth], alignMap[data.align]]">
      <p
        v-if="data.subtitle"
        class="mb-4 break-words text-xs uppercase tracking-[0.2em] text-[var(--color-text-secondary)] sm:mb-6 sm:text-sm sm:tracking-[0.3em]"
      >
        {{ data.subtitle }}
      </p>

      <h2 class="break-words text-3xl font-black leading-tight sm:text-4xl md:text-6xl">
        {{ data.title }}
      </h2>

      <p
        class="mt-6 break-words text-base leading-relaxed text-[var(--color-text-secondary)] sm:mt-8 sm:text-lg"
      >
        {{ data.text }}
      </p>
    </div>
  </section>
</template>
