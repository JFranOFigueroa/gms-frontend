<script setup>
import { ref } from 'vue'

import { useLandingStore } from '@/stores/useLandingStore'

import BlockList from '@/components/dashboard/BlockList.vue'
import ThemeEditor from '@/components/dashboard/ThemeEditor.vue'
import SiteSettingsCard from '@/components/dashboard/SiteSettingsCard.vue'
import AddBlockModal from '@/components/dashboard/AddBlockModal.vue'
import PreviewModal from '@/components/dashboard/PreviewModal.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

const addBlockModal = ref(false)
const previewModal = ref(false)
const error = ref('')
const landingStore = useLandingStore()

const handleAddBlock = async (config) => {
  error.value = ''
  try {
    await landingStore.addBlock(config)
    addBlockModal.value = false
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="space-y-0">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-black sm:text-4xl">Landing del sitio</h1>

        <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
          Contenido público único de la marca. No depende de sucursales.
        </p>
      </div>

      <BaseButton @click="previewModal = true"> Vista previa </BaseButton>
    </div>

    <AddBlockModal :open="addBlockModal" @close="addBlockModal = false" @select="handleAddBlock" />

    <PreviewModal :open="previewModal" @close="previewModal = false" />

    <div class="w-full max-w-5xl space-y-6">
      <p v-if="error" role="alert" class="text-red-400">{{ error }}</p>

      <SiteSettingsCard />

      <ThemeEditor />

      <BaseButton @click="addBlockModal = true"> Agregar bloque </BaseButton>

      <!-- Blocks -->
      <BlockList :blocks="landingStore.blocks" />
    </div>
  </div>
</template>
