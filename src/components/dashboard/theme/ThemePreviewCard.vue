<script setup>
defineProps({
  preset: {
    type: Object,
    required: true,
  },

  selected: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])
</script>

<template>
  <button
    class="w-full text-left rounded-3xl overflow-hidden border-2 transition-all"
    :class="selected ? 'border-[var(--color-primary)]' : 'border-[var(--color-border)]'"
    @click="emit('select')"
  >
    <div
      class="h-24"
      :style="{
        background: preset.colors.background,
      }"
    >
      <div class="h-full p-4 flex flex-col justify-center gap-2">
        <div
          class="w-20 h-3 rounded-full"
          :style="{
            background: preset.colors.text,
          }"
        />

        <div
          class="w-12 h-3 rounded-full"
          :style="{
            background: preset.colors.primary,
          }"
        />
      </div>
    </div>

    <div class="p-4 bg-[var(--color-surface)]">
      <h3 class="font-bold">
        {{ preset.name }}
      </h3>

      <p class="text-sm var(--color-text-secondary) mt-1">
        {{ preset.description }}
      </p>
    </div>
  </button>
</template>
