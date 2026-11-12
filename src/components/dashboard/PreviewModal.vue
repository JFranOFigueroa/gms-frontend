<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BlockRenderer from '@/components/landing/BlockRenderer.vue'
import PreviewToolbar from '@/components/dashboard/PreviewToolbar.vue'

import { useScrollLock } from '@/composables/useScrollLock'

import { useLandingStore } from '@/stores/useLandingStore'
import { useBuilderStore } from '@/stores/useBuilderStore'

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(['close'])

const landingStore = useLandingStore()
const builderStore = useBuilderStore()

const { lock, unlock } = useScrollLock()

const previewWidth = computed(() => {
  const map = {
    desktop: 'w-full',
    tablet: 'w-[900px]',
    mobile: 'w-[430px]',
  }

  return map[builderStore.previewDevice]
})

const onKeydown = (event) => {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
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
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[9999] overflow-y-auto overflow-x-hidden bg-black/80 backdrop-blur-sm"
      >
        <div class="flex min-h-dvh items-start justify-center p-3 sm:p-4 md:p-6">
          <div
            class="my-3 w-full max-w-6xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl sm:my-4 md:my-6"
          >
            <div
              class="sticky top-3 z-10 flex flex-col gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:top-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4"
            >
              <div class="min-w-0">
                <h2 class="text-xl font-black sm:text-2xl">Vista previa</h2>

                <p class="text-xs text-[var(--color-text-secondary)] sm:text-sm">
                  Modo responsive
                </p>
              </div>

              <div class="flex flex-wrap items-center gap-2 sm:gap-3">
                <PreviewToolbar />

                <BaseButton variant="secondary" size="sm" @click="emit('close')">
                  Cerrar
                </BaseButton>
              </div>
            </div>

            <div
              class="flex justify-start overflow-x-auto bg-[var(--color-background)] p-3 sm:p-4 md:p-6"
            >
              <div
                class="mx-auto shrink-0 overflow-hidden rounded-3xl bg-black shadow-2xl transition-all duration-500"
                :class="previewWidth"
              >
                <BlockRenderer :blocks="landingStore.sortedBlocks" />
              </div>
            </div>
          </div>
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
