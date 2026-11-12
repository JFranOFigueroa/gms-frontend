<script setup>
defineProps({
  modelValue: {
    type: [String, Number],

    default: '',
  },

  type: {
    type: String,

    default: 'text',
  },

  placeholder: {
    type: String,

    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <input
    :value="modelValue"
    :type="type"
    :placeholder="placeholder"
    class="h-14 w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
