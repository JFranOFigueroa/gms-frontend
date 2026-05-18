<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
})

const variants = {
  primary: 'bg-white text-black hover:bg-zinc-200',

  secondary: 'bg-zinc-800 text-white hover:bg-zinc-700',

  danger: 'bg-red-500 text-white hover:bg-red-400',
}
</script>

<template>
  <button
    class="px-5 py-3 rounded-2xl transition-all duration-200 font-semibold"
    :class="variants[variant]"
  >
    <slot />
  </button>
</template>
