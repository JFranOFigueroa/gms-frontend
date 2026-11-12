<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
  },

  size: {
    type: String,
    default: 'md',
  },
})

const variants = {
  primary: `
    bg-[var(--color-primary)]
    text-[var(--color-primary-contrast,#ffffff)]
    hover:opacity-90
  `,

  secondary: `
    bg-[var(--color-surface)]
    text-[var(--color-text)]
    hover:bg-[var(--color-surface-hover)]
    border
    border-[var(--color-border)]
  `,

  danger: `
    bg-red-500
    text-white
    hover:bg-red-400
  `,
}

const sizes = {
  sm: `
    px-3
    py-2
    text-sm
  `,

  md: `
    px-4
    py-3
    text-sm
    sm:px-5
    sm:text-base
  `,

  lg: `
    px-6
    py-3
    text-base
    sm:px-8
    sm:py-4
    sm:text-lg
  `,
}
</script>

<template>
  <button
    class="inline-flex max-w-full items-center justify-center gap-2 rounded-2xl text-center font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variants[variant], sizes[size]]"
  >
    <slot />
  </button>
</template>
