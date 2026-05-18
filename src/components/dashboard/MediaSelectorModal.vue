<script setup>
import { computed } from 'vue'

import { Check } from 'lucide-vue-next'

import { useMediaStore } from '@/stores/useMediaStore'

const props = defineProps({
  open: Boolean,

  selected: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'select'])

const mediaStore = useMediaStore()

const isSelected = (id) => {
  return props.selected.includes(id)
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <div
        class="w-full max-w-6xl bg-[var(--color-surface)] border border-zinc-800 rounded-3xl p-6"
      >
        <!-- HEADER -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-3xl font-black">Seleccionar Imágenes</h2>

            <p class="text-zinc-500 mt-1">Elige imágenes para el Hero Carousel</p>
          </div>

          <button
            @click="emit('close')"
            class="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 text-xl"
          >
            ✕
          </button>
        </div>

        <!-- GRID -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh] overflow-auto pr-2">
          <button
            v-for="asset in mediaStore.assets"
            :key="asset.id"
            class="group relative rounded-3xl overflow-hidden border-2 transition-all duration-300"
            :class="
              isSelected(asset.id)
                ? 'border-white scale-[0.98]'
                : 'border-zinc-800 hover:border-zinc-500'
            "
            @click="emit('select', asset.id)"
          >
            <!-- IMAGE -->
            <img
              :src="asset.url"
              class="w-full aspect-video object-cover transition-all duration-500 group-hover:scale-105"
            />

            <!-- OVERLAY -->
            <div
              class="absolute inset-0 transition-all"
              :class="isSelected(asset.id) ? 'bg-black/20' : 'bg-black/0 group-hover:bg-black/20'"
            />

            <!-- CHECK -->
            <div
              v-if="isSelected(asset.id)"
              class="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-2xl"
            >
              <Check class="w-5 h-5" />
            </div>

            <!-- INFO -->
            <div
              class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent text-left"
            >
              <h3 class="font-bold">
                {{ asset.name }}
              </h3>
            </div>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
