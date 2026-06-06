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
    px-5
    py-3
    text-base
  `,

  lg: `
    px-8
    py-4
    text-lg
  `,
}
</script>

<template>
  <button
    class="rounded-2xl transition-all duration-200 font-semibold whitespace-nowrap"
    :class="[variants[variant], sizes[size]]"
  >
    <slot />
  </button>
</template>
