<script setup>
defineProps({ items: { type: Array, required: true } })
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="item in items"
      :key="item.label"
      class="flex min-h-24 items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5"
    >
      <div class="min-w-0">
        <p class="font-semibold">{{ item.label }}</p>
        <p v-if="item.detail" class="mt-1 text-xs text-[var(--color-text-secondary)]">
          {{ item.detail }}
        </p>
      </div>
      <strong class="shrink-0 text-2xl font-black tabular-nums">{{ item.value }}</strong>
    </div>
  </div>
</template>
