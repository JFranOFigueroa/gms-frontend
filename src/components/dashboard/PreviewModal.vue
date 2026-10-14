<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BlockRenderer from '@/components/landing/BlockRenderer.vue'
import PreviewToolbar from '@/components/dashboard/PreviewToolbar.vue'

import { useLandingStore } from '@/stores/useLandingStore'
import { useBuilderStore } from '@/stores/useBuilderStore'

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(['close'])

const landingStore = useLandingStore()
const builderStore = useBuilderStore()

const previewWidth = computed(() => {
  const map = {
    desktop: 'w-full',
    tablet: 'w-[900px]',
    mobile: 'w-[430px]',
  }

  return map[builderStore.previewDevice]
})

const lockScroll = () => {
  document.documentElement.style.overflow = 'hidden'
  document.body.style.overflow = 'hidden'
  const main = document.querySelector('main')
  if (main) main.style.overflow = 'hidden'
}

const unlockScroll = () => {
  document.documentElement.style.overflow = ''
  document.body.style.overflow = ''
  const main = document.querySelector('main')
  if (main) main.style.overflow = ''
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) lockScroll()
    else unlockScroll()
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  unlockScroll()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed top-0 left-0 right-0 bottom-0 z-[9999] bg-black/80 backdrop-blur-sm overflow-y-auto overflow-x-hidden"
      >
        <div class="min-h-screen flex items-start justify-center p-4 md:p-6">
          <div class="w-full max-w-6xl my-4 md:my-6 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl overflow-hidden">
            <div class="sticky top-4 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <div>
                <h2 class="text-2xl font-black">Vista previa</h2>

                <p class="text-sm text-[var(--color-text-secondary)]">Modo responsive</p>
              </div>

              <div class="flex items-center gap-3">
                <PreviewToolbar />

                <BaseButton variant="secondary" @click="emit('close')"> Cerrar </BaseButton>
              </div>
            </div>

            <div class="bg-[var(--color-background)] p-4 md:p-6 flex justify-center">
              <div
                class="transition-all duration-500 bg-black rounded-3xl overflow-hidden shadow-2xl"
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