<script setup>
const props = defineProps({
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
    class="py-24 px-6"
    :class="data.background ? 'bg-[var(--color-surface)]' : 'bg-[var(--color-background)]'"
  >
    <div class="mx-auto" :class="[widthMap[data.maxWidth], alignMap[data.align]]">
      <p v-if="data.subtitle" class="text-zinc-500 uppercase tracking-[0.3em] mb-6">
        {{ data.subtitle }}
      </p>

      <h2 class="text-4xl md:text-6xl font-black leading-tight">
        {{ data.title }}
      </h2>

      <p class="text-zinc-300 text-lg mt-8 leading-relaxed">
        {{ data.text }}
      </p>
    </div>
  </section>
</template>
