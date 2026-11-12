<script setup>
import { onBeforeUnmount, watch } from 'vue'

import { blockRegistry } from '@/config/blockRegistry'

import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(['close', 'select'])

const { lock, unlock } = useScrollLock()

const onKeydown = (event) => {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      lock()
      window.addEventListener('keydown', onKeydown)
    } else {
      unlock()
      window.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  unlock()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-background)]/70 p-4 backdrop-blur-sm sm:p-6"
      @click.self="emit('close')"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Agregar bloque"
        class="max-h-[90dvh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
      >
        <!-- Header -->
        <div class="mb-6 flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-2xl font-black sm:text-3xl">Agregar Bloque</h2>

            <p class="mt-1 text-sm text-[var(--color-text-secondary)] sm:text-base">
              Selecciona un componente
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] sm:h-12 sm:w-12"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          <button
            v-for="block in blockRegistry"
            :key="block.type"
            class="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-all hover:border-[var(--color-primary)] sm:p-6"
            @click="emit('select', block)"
          >
            <div class="mb-4 text-4xl sm:text-5xl">
              {{ block.preview }}
            </div>

            <h3 class="text-xl font-bold sm:text-2xl">
              {{ block.label }}
            </h3>

            <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
              {{ block.description }}
            </p>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
