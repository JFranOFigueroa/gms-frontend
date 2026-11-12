<script setup>
import { computed } from 'vue'

import { GripVertical, Trash2 } from 'lucide-vue-next'

import { useLandingStore } from '@/stores/useLandingStore'

import { editorRegistry } from '@/config/editorRegistry'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  block: Object,
})

const landingStore = useLandingStore()

const editorComponent = computed(() => {
  return editorRegistry[props.block.type]
})
</script>

<template>
  <BaseCard>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div class="min-w-0">
          <div class="flex items-center gap-3">
            <div
              class="w-3 h-3 rounded-full"
              :class="block.enabled ? 'bg-green-500' : 'bg-red-500'"
            />
            <div
              class="drag-handle cursor-grab active:cursor-grabbing w-10 h-10 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center"
            >
              <GripVertical class="w-5 h-5 text-[var(--color-text-secondary)]" />
            </div>
            <h3 class="truncate text-xl font-bold capitalize sm:text-2xl">
              {{ block.type }}
            </h3>
          </div>

          <p class="text-[var(--color-text-secondary)] mt-2">
            Orden:
            {{ block.order }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button
            type="button"
            aria-label="Eliminar bloque"
            class="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 transition-all hover:bg-red-500/20"
            @click="landingStore.removeBlock(block.id).catch((e) => alert(e.message))"
          >
            <Trash2 class="w-5 h-5" />
          </button>

          <BaseButton
            variant="secondary"
            @click="landingStore.toggleBlock(block.id).catch((e) => alert(e.message))"
          >
            {{ block.enabled ? 'Ocultar' : 'Mostrar' }}
          </BaseButton>
        </div>
      </div>

      <!-- Config -->
      <component :is="editorComponent" :block="block" />
    </div>
  </BaseCard>
</template>
