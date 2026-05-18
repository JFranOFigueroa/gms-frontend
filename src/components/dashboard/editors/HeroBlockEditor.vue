<script setup>
import { computed, ref } from 'vue'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import MediaSelectorModal from '@/components/dashboard/MediaSelectorModal.vue'

import { useLandingStore } from '@/stores/useLandingStore'

const props = defineProps({
  block: Object,
})

const landingStore = useLandingStore()

const mediaModalOpen = ref(false)

const title = computed({
  get() {
    return props.block.data.title
  },

  set(value) {
    landingStore.updateBlock(
      props.block.id,

      {
        data: {
          title: value,
        },
      },
    )
  },
})

const subtitle = computed({
  get() {
    return props.block.data.subtitle
  },

  set(value) {
    landingStore.updateBlock(
      props.block.id,

      {
        data: {
          subtitle: value,
        },
      },
    )
  },
})

const addSlide = (imageId) => {
  const slides = props.block.data.slides || []

  const alreadySelected = slides.includes(imageId)

  const updatedSlides = alreadySelected
    ? slides.filter((id) => id !== imageId)
    : [...slides, imageId]

  landingStore.updateBlock(
    props.block.id,

    {
      data: {
        slides: updatedSlides,
      },
    },
  )
}
</script>

<template>
  <div class="space-y-4">
    <div>
      <label class="block mb-2 text-zinc-400"> Título </label>

      <BaseInput v-model="title" />
    </div>

    <div>
      <label class="block mb-2 text-zinc-400"> Subtítulo </label>

      <BaseInput v-model="subtitle" />
    </div>

    <BaseButton variant="secondary" @click="mediaModalOpen = true"> Seleccionar Slides </BaseButton>

    <MediaSelectorModal
      :open="mediaModalOpen"
      :selected="block.data.slides || []"
      @close="mediaModalOpen = false"
      @select="addSlide"
    />
  </div>
</template>
