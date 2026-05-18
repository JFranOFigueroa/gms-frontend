<script setup>
import { computed } from 'vue'

import { useLandingStore } from '@/stores/useLandingStore'

import { editorRegistry } from '@/config/editorRegistry'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { Trash2 } from 'lucide-vue-next'
import { GripVertical } from 'lucide-vue-next'

import { ref } from 'vue'

import MediaSelectorModal from './MediaSelectorModal.vue'

const mediaModalOpen = ref(false)

const editorComponent = computed(() => {
  return editorRegistry[props.block.type]
})

const updateImage = (imageId) => {
  landingStore.updateBlock(
    props.block.id,

    {
      data: {
        ...props.block.data,
        imageId,
      },
    },
  )

  mediaModalOpen.value = false
}

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
        ...props.block.data,

        slides: updatedSlides,
      },
    },
  )
}

const props = defineProps({
  block: Object,
})

const landingStore = useLandingStore()

const title = computed({
  get: () => props.block.data.title,

  set: (value) => {
    landingStore.updateBlock(
      props.block.id,

      {
        data: {
          ...props.block.data,
          title: value,
        },
      },
    )
  },
})
</script>

<template>
  <BaseCard>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3">
            <div
              class="w-3 h-3 rounded-full"
              :class="block.enabled ? 'bg-green-500' : 'bg-red-500'"
            />
            <div
              class="drag-handle cursor-grab active:cursor-grabbing w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center"
            >
              <GripVertical class="w-5 h-5 text-zinc-500" />
            </div>
            <h3 class="text-2xl font-bold capitalize">
              {{ block.type }}
            </h3>
          </div>

          <p class="text-zinc-500 mt-2">
            Orden:
            {{ block.order }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            class="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-all"
            @click="landingStore.removeBlock(block.id)"
          >
            <Trash2 class="w-5 h-5" />
          </button>

          <BaseButton variant="secondary" @click="landingStore.toggleBlock(block.id)">
            {{ block.enabled ? 'Ocultar' : 'Mostrar' }}
          </BaseButton>
        </div>
      </div>

      <!-- Config -->
      <component :is="editorComponent" :block="block" />
    </div>
  </BaseCard>
</template>
