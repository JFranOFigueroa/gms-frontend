<script setup>
defineProps({
  tabs: { type: Array, required: true },
  modelValue: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div
    role="tablist"
    aria-label="Secciones del módulo"
    class="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3"
  >
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.id"
      :tabindex="modelValue === tab.id ? 0 : -1"
      class="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition"
      :class="
        modelValue === tab.id
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-contrast,#ffffff)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]'
      "
      @click="emit('update:modelValue', tab.id)"
      @keydown.left.prevent="
        emit(
          'update:modelValue',
          tabs[(tabs.findIndex((t) => t.id === modelValue) + tabs.length - 1) % tabs.length].id,
        )
      "
      @keydown.right.prevent="
        emit(
          'update:modelValue',
          tabs[(tabs.findIndex((t) => t.id === modelValue) + 1) % tabs.length].id,
        )
      "
    >
      {{ tab.label }}
    </button>
  </div>
</template>
