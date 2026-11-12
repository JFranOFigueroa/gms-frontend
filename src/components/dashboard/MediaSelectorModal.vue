<script setup>
import { onBeforeUnmount, watch } from 'vue'

import { Check } from 'lucide-vue-next'

import { useScrollLock } from '@/composables/useScrollLock'

import { useMediaStore } from '@/stores/useMediaStore'

const props = defineProps({
  open: Boolean,

  selected: {
    type: Array,
    default: () => [],
  },
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

const mediaStore = useMediaStore()
// Fotografías que ya figuraban en el frontend original. Solo referencia visual, nunca datos de negocio.
const designReferences = [
  {
    name: 'Hero Banner',
    url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200',
  },
  {
    name: 'Gym Interior',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200',
  },
]

const isSelected = (id) => {
  return props.selected.includes(id)
}
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
        aria-label="Seleccionar imágenes"
        class="flex max-h-[90dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
      >
        <!-- HEADER -->
        <div class="mb-6 flex shrink-0 items-start justify-between gap-3">
          <div class="min-w-0">
            <h2 class="text-2xl font-black sm:text-3xl">Seleccionar Imágenes</h2>

            <p class="mt-1 text-sm text-[var(--color-text-secondary)] sm:text-base">
              Elige imágenes para el Hero Carousel
            </p>
          </div>

          <button
            type="button"
            aria-label="Cerrar"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xl sm:h-12 sm:w-12"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <!-- GRID -->
        <div
          class="grid max-h-[70dvh] flex-1 grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
        >
          <div v-if="!mediaStore.assets.length" class="space-y-4 sm:col-span-2 lg:col-span-3">
            <p class="text-sm text-[var(--color-text-secondary)]">
              Todavía no hay imágenes disponibles para seleccionar.
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <div
                v-for="photo in designReferences"
                :key="photo.url"
                class="overflow-hidden rounded-3xl border border-[var(--color-border)]"
              >
                <img
                  :src="photo.url"
                  :alt="photo.name + ' (imagen de referencia)'"
                  class="w-full aspect-video object-cover"
                />
                <p class="p-3 text-sm text-[var(--color-text-secondary)]">
                  {{ photo.name }} · referencia visual
                </p>
              </div>
            </div>
          </div>
          <button
            v-for="asset in mediaStore.assets"
            :key="asset.id"
            class="group relative rounded-3xl overflow-hidden border-2 transition-all duration-300"
            :class="
              isSelected(asset.id)
                ? 'border-[var(--color-primary)] scale-[0.98]'
                : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
            "
            @click="emit('select', asset.id)"
          >
            <!-- IMAGE -->
            <img
              :src="asset.url"
              :alt="asset.name"
              class="aspect-video w-full object-cover transition-all duration-500 group-hover:scale-105"
            />

            <!-- OVERLAY -->
            <div
              class="absolute inset-0 transition-all"
              :class="
                isSelected(asset.id)
                  ? 'bg-[var(--color-background)]/20'
                  : 'bg-[var(--color-background)]/0 group-hover:bg-[var(--color-background)]/20'
              "
            />

            <!-- CHECK -->
            <div
              v-if="isSelected(asset.id)"
              class="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-text)] text-[var(--color-background)] shadow-2xl sm:h-10 sm:w-10"
            >
              <Check class="w-5 h-5" />
            </div>

            <!-- INFO -->
            <div
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-left sm:p-4"
            >
              <h3 class="truncate text-sm font-bold sm:text-base">
                {{ asset.name }}
              </h3>
            </div>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
