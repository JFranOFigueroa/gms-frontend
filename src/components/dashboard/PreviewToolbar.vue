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
  <div class="flex flex-wrap items-center gap-2 sm:gap-3">
    <BaseButton
      v-for="device in devices"
      :key="device.id"
      variant="secondary"
      size="sm"
      :aria-label="'Vista ' + device.label"
      :title="device.label"
      @click="builderStore.setPreviewDevice(device.id)"
      :class="{
        '!border-[var(--color-primary)]': builderStore.previewDevice === device.id,
      }"
    >
      <component :is="device.icon" class="h-4 w-4 sm:h-5 sm:w-5" />
    </BaseButton>
  </div>
</template>
