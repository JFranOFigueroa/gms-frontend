<script setup>
defineProps({
  open: {
    type: Boolean,

    default: false,
  },
})

const emit = defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
        @click.self="emit('close')"
      >
        <div
          class="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-[var(--color-surface)] p-8 shadow-2xl"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
