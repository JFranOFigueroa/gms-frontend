<script setup>
import { computed } from 'vue'

import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper/modules'

import 'swiper/css'

import BaseButton from '@/components/ui/BaseButton.vue'

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
</script>

<template>
  <section class="pt-32 relative h-screen overflow-hidden">
    <!-- SLIDER BACKGROUND -->
    <div class="absolute inset-0 z-0">
      <Swiper
        :modules="[Autoplay]"
        :slides-per-view="1"
        :loop="true"
        :autoplay="{
          delay: 4000,
        }"
        class="w-full h-full"
      >
        <SwiperSlide v-for="slide in slides" :key="slide.id">
          <div class="relative w-full h-screen">
            <img :src="slide.url" class="absolute inset-0 w-full h-full object-cover" />

            <!-- Overlay -->
            <div class="absolute inset-0 bg-black/70" />
          </div>
        </SwiperSlide>
      </Swiper>
    </div>

    <!-- CONTENT -->
    <div class="relative z-10 h-full flex items-center justify-center px-6">
      <div class="max-w-4xl text-center">
        <p class="text-zinc-300 mb-4">
          {{ data.badge }}
        </p>

        <h1 class="text-5xl md:text-7xl font-black leading-tight">
          {{ data.title }}
        </h1>

        <p class="text-zinc-300 text-lg mt-8">
          {{ data.subtitle }}
        </p>

        <div class="mt-10 flex justify-center gap-4">
          <BaseButton> Comenzar </BaseButton>

          <BaseButton variant="secondary"> Ver más </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
