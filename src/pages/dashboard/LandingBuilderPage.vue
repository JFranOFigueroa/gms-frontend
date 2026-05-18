<script setup>
import { useLandingStore } from '@/stores/useLandingStore'

import BlockList from '@/components/dashboard/BlockList.vue'
import ThemeEditor from '@/components/dashboard/ThemeEditor.vue'
import LandingPreview from '@/components/dashboard/LandingPreview.vue'
import PreviewToolbar from '@/components/dashboard/PreviewToolbar.vue'
import GymSettingsCard from '@/components/dashboard/GymSettingsCard.vue'

import { ref } from 'vue'

import AddBlockModal from '@/components/dashboard/AddBlockModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const addBlockModal = ref(false)

const handleAddBlock = (config) => {
  landingStore.addBlock(config)

  addBlockModal.value = false
}

const landingStore = useLandingStore()
</script>

<template>
  <div class="flex flex-col xl:grid xl:grid-cols-5 gap-6 min-h-[calc(100vh-120px)]">
    <!-- LEFT PANEL -->
    <div class="xl:col-span-2 overflow-auto pr-2 space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-4xl font-black">Landing Builder</h1>

        <p class="text-zinc-500 mt-2">Administra la estructura visual del sitio</p>
      </div>

      <GymSettingsCard />

      <!-- Theme -->
      <ThemeEditor />

      <BaseButton @click="addBlockModal = true"> Agregar Bloque </BaseButton>

      <AddBlockModal
        :open="addBlockModal"
        @close="addBlockModal = false"
        @select="handleAddBlock"
      />

      <!-- Blocks -->
      <BlockList :blocks="landingStore.blocks" />
    </div>

    <!-- PREVIEW -->
    <div class="xl:col-span-3 min-h-[700px]">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-2xl font-black">Preview</h2>

          <p class="text-zinc-500">Vista responsive</p>
        </div>

        <PreviewToolbar />
      </div>

      <LandingPreview />
    </div>
  </div>
</template>
