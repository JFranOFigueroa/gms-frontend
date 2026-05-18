<script setup>
defineProps({
  modelValue: String,
  placeholder: String,
  type: {
    type: String,
    default: 'text',
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <input
    :type="type"
    :placeholder="placeholder"
    :value="modelValue"
    @input="$emit('update:modelValue', $event.target.value)"
    class="w-full bg-[var(--color-surface)] border border-zinc-800 rounded-2xl px-4 py-3 outline-none focus:border-white transition-all"
  />
</template>
