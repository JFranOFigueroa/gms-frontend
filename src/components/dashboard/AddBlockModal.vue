<script setup>
import { blockRegistry } from '@/config/blockRegistry'

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(['close', 'select'])
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div
        class="w-full max-w-5xl bg-[var(--color-surface)] border border-zinc-800 rounded-3xl p-6"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-3xl font-black">Agregar Bloque</h2>

            <p class="text-zinc-500 mt-1">Selecciona un componente</p>
          </div>

          <button
            @click="emit('close')"
            class="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800"
          >
            ✕
          </button>
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <button
            v-for="block in blockRegistry"
            :key="block.type"
            class="text-left p-6 rounded-3xl border border-zinc-800 bg-zinc-900 hover:border-white transition-all"
            @click="emit('select', block)"
          >
            <div class="text-5xl mb-4">
              {{ block.preview }}
            </div>

            <h3 class="text-2xl font-bold">
              {{ block.label }}
            </h3>

            <p class="text-zinc-500 mt-2">
              {{ block.description }}
            </p>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
