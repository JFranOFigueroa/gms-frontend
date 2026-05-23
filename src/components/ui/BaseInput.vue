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
    class="w-full h-14 px-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder:text-zinc-500 outline-none transition-all focus:border-zinc-600 focus:ring-2 focus:ring-zinc-700"
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>
