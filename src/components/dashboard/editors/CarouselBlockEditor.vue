<script setup>
import { ref } from 'vue'

import BaseInput from '@/components/ui/BaseInput.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import MediaSelectorModal from '@/components/dashboard/MediaSelectorModal.vue'

import { useLandingStore } from '@/stores/useLandingStore'

const props = defineProps({
  block: Object,
})

const landingStore = useLandingStore()

const mediaModalOpen = ref(false)

const updateField = (field, value) => {
  landingStore.updateBlock(
    props.block.id,

    {
      data: {
        [field]: value,
      },
    },
  )
}

const toggleSlide = (imageId) => {
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
  <div class="space-y-6">
    <!-- TITLE -->
    <div>
      <label class="block mb-2 text-zinc-400"> Título </label>

      <BaseInput
        :model-value="block.data.title"
        @update:modelValue="updateField('title', $event)"
      />
    </div>

    <!-- BUTTON -->
    <BaseButton variant="secondary" @click="mediaModalOpen = true">
      Seleccionar Imágenes
    </BaseButton>

    <!-- SELECTOR -->
    <MediaSelectorModal
      :open="mediaModalOpen"
      :selected="block.data.slides || []"
      @close="mediaModalOpen = false"
      @select="toggleSlide"
    />

    <!-- COUNT -->
    <div class="text-zinc-500 text-sm">
      {{ block.data.slides?.length || 0 }}

      imágenes seleccionadas
    </div>
  </div>
</template>
