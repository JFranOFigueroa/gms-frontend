<script setup>
import { Monitor, Tablet, Smartphone } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useBuilderStore } from '@/stores/useBuilderStore'

const builderStore = useBuilderStore()

const devices = [
  {
    id: 'desktop',

    icon: Monitor,

    label: 'Desktop',
  },

  {
    id: 'tablet',

    icon: Tablet,

    label: 'Tablet',
  },

  {
    id: 'mobile',

    icon: Smartphone,

    label: 'Mobile',
  },
]
</script>

<template>
  <div class="flex items-center gap-3">
    <BaseButton
      v-for="device in devices"
      :key="device.id"
      variant="secondary"
      @click="builderStore.setPreviewDevice(device.id)"
      :class="{
        '!border-white': builderStore.previewDevice === device.id,
      }"
    >
      <component :is="device.icon" class="w-5 h-5" />
    </BaseButton>
  </div>
</template>
