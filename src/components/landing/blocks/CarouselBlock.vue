<script setup>
import { ref } from 'vue'

import 'swiper/css'

import { computed } from 'vue'

import { useMediaStore } from '@/stores/useMediaStore'

const props = defineProps({
  data: Object,
  mediaAssets: { type: Array, default: null },
  publicGym: { type: Object, default: null },
})

const mediaStore = useMediaStore()

const slides = computed(() => {
  return (Array.isArray(props.data?.slides) ? props.data.slides : [])
    .map((id) => {
      return (props.mediaAssets ?? mediaStore.assets).find((asset) => asset.id === id)
    })
    .filter(Boolean)
})

const alignmentClass = computed(() => {
  const map = {
    left: 'justify-start',

    center: 'justify-center',

    right: 'justify-end',
  }

  return map[props.data.align] || 'justify-center'
})

const activeImage = ref(null)
</script>

<template>
  <section class="bg-[var(--color-background)] py-12 sm:py-24">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <!-- HEADER -->
      <div v-if="data.title" class="mb-8 text-center sm:mb-12">
        <h2 class="break-words text-3xl font-black sm:text-4xl md:text-5xl">
          {{ data.title }}
        </h2>
      </div>

      <!-- SLIDER -->
      <div class="flex" :class="alignmentClass">
        <div
          class="grid w-fit gap-4 sm:gap-6"
          :class="{
            'grid-cols-1': slides.length === 1,

            'grid-cols-1 sm:grid-cols-2': slides.length === 2,

            'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3': slides.length >= 3,
          }"
        >
          <button
            v-for="slide in slides"
            :key="slide.id"
            type="button"
            class="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:scale-[1.02]"
            @click="activeImage = slide"
          >
            <img
              :src="slide.url"
              alt=""
              class="aspect-[4/3] w-full object-cover"
            />
          </button>
        </div>
      </div>
    </div>
  </section>
  <Transition name="fade">
    <div
      v-if="activeImage"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-[var(--color-background)]/90 p-4 backdrop-blur-sm sm:p-6"
    >
      <!-- CLOSE -->
      <button
        type="button"
        aria-label="Cerrar imagen"
        class="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xl sm:right-6 sm:top-6 sm:h-14 sm:w-14 sm:text-2xl"
        @click="activeImage = null"
      >
        ✕
      </button>

      <!-- IMAGE -->
      <img
        :src="activeImage.url"
        alt=""
        class="max-h-full max-w-full rounded-3xl shadow-2xl"
      />
    </div>
  </Transition>
</template>
