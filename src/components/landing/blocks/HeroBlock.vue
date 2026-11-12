<script setup>
import { computed } from 'vue'

import { Swiper, SwiperSlide } from 'swiper/vue'
import { Autoplay } from 'swiper/modules'

import 'swiper/css'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useMediaStore } from '@/stores/useMediaStore'
import { useTenantStore } from '@/stores/useTenantStore'

const props = defineProps({
  data: Object,
  mediaAssets: { type: Array, default: null },
  publicGym: { type: Object, default: null },
})

const mediaStore = useMediaStore()
const tenantStore = useTenantStore()

const slides = computed(() => {
  return (Array.isArray(props.data?.slides) ? props.data.slides : [])
    .map((id) => {
      return (props.mediaAssets ?? mediaStore.assets).find((asset) => asset.id === id)
    })
    .filter(Boolean)
})

const gymName = computed(() => props.publicGym?.name || tenantStore.gym?.name || 'GMS FITNESS')
</script>

<template>
  <section class="relative min-h-[100svh] overflow-hidden">
    <!-- SLIDER BACKGROUND -->
    <div class="absolute inset-0 z-0">
      <Swiper
        :modules="[Autoplay]"
        :slides-per-view="1"
        :loop="true"
        :autoplay="{
          delay: 4000,
        }"
        class="h-full w-full"
      >
        <SwiperSlide v-for="slide in slides" :key="slide.id">
          <div class="relative h-full min-h-[100svh] w-full">
            <img :src="slide.url" class="absolute inset-0 h-full w-full object-cover" />

            <!-- Overlay -->
            <div class="absolute inset-0 bg-[var(--color-background)]/70" />
          </div>
        </SwiperSlide>
      </Swiper>
    </div>

    <!-- CONTENT -->
    <div
      class="relative z-10 flex min-h-[100svh] items-center justify-center px-4 pt-24 sm:px-6 sm:pt-32"
    >
      <div class="w-full max-w-4xl text-center">
        <p class="mb-4 break-words text-sm text-[var(--color-text-secondary)] sm:text-base">
          {{ gymName }}
        </p>

        <h1 class="break-words text-4xl font-black leading-tight sm:text-6xl md:text-7xl">
          {{ data.title }}
        </h1>

        <p class="mt-6 break-words text-base text-[var(--color-text-secondary)] sm:mt-8 sm:text-lg">
          {{ data.subtitle }}
        </p>

        <div class="mt-8 flex flex-col justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
          <BaseButton> Comenzar </BaseButton>

          <BaseButton variant="secondary"> Ver más </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>
