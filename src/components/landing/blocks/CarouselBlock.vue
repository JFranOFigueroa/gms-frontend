<script setup>
import { ref } from 'vue'

import 'swiper/css'

import { computed } from 'vue'

import { useMediaStore } from '@/stores/useMediaStore'

const props = defineProps({
  data: Object,
})

const mediaStore = useMediaStore()

const slides = computed(() => {
  return props.data.slides
    ?.map((id) => {
      return mediaStore.assets.find((asset) => asset.id === id)
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
  <section class="py-24 bg-[var(--color-background)]">
    <div class="max-w-7xl mx-auto px-6">
      <!-- HEADER -->
      <div v-if="data.title" class="text-center mb-12">
        <h2 class="text-5xl font-black">
          {{ data.title }}
        </h2>
      </div>

      <!-- SLIDER -->
      <div class="flex" :class="alignmentClass">
        <div
          class="grid gap-6 w-fit"
          :class="{
            'grid-cols-1': slides.length === 1,

            'grid-cols-1 md:grid-cols-2': slides.length === 2,

            'grid-cols-1 md:grid-cols-2 xl:grid-cols-3': slides.length >= 3,
          }"
        >
          <button
            v-for="slide in slides"
            :key="slide.id"
            type="button"
            class="rounded-3xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] hover:scale-[1.02] transition-all"
            @click="activeImage = slide"
          >
            <img :src="slide.url" class="w-full aspect-[4/3] object-cover" />
          </button>
        </div>
      </div>
    </div>
  </section>
  <Transition name="fade">
    <div
      v-if="activeImage"
      class="fixed inset-0 z-[999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
    >
      <!-- CLOSE -->
      <button
        type="button"
        class="absolute top-6 right-6 w-14 h-14 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-2xl"
        @click="activeImage = null"
      >
        ✕
      </button>

      <!-- IMAGE -->
      <img :src="activeImage.url" class="max-w-full max-h-full rounded-3xl shadow-2xl" />
    </div>
  </Transition>
</template>
