<script setup>
import { computed, ref } from 'vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useLandingStore } from '@/stores/useLandingStore'

import { canManageModules } from '@/config/permissions'

import BlockList from '@/components/dashboard/BlockList.vue'
import ThemeEditor from '@/components/dashboard/ThemeEditor.vue'
import GymSettingsCard from '@/components/dashboard/GymSettingsCard.vue'
import ModuleSettingsCard from '@/components/dashboard/ModuleSettingsCard.vue'
import AddBlockModal from '@/components/dashboard/AddBlockModal.vue'
import PreviewModal from '@/components/dashboard/PreviewModal.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

const authStore = useAuthStore()

const addBlockModal = ref(false)

const previewModal = ref(false)

const showModuleSettings = computed(() => canManageModules(authStore.role))

const handleAddBlock = (config) => {
  landingStore.addBlock(config)

  addBlockModal.value = false
}

const landingStore = useLandingStore()
</script>

<template>
  <div class="space-y-0">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-4xl font-black">Landing Builder</h1>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Administra la estructura visual del sitio
        </p>
      </div>

      <BaseButton @click="previewModal = true"> Vista previa </BaseButton>
    </div>

    <AddBlockModal
      :open="addBlockModal"
      @close="addBlockModal = false"
      @select="handleAddBlock"
    />

    <PreviewModal :open="previewModal" @close="previewModal = false" />

    <div class="max-w-5xl space-y-6">
      <GymSettingsCard />

      <ModuleSettingsCard v-if="showModuleSettings" />

      <ThemeEditor />

      <BaseButton @click="addBlockModal = true"> Agregar Bloque </BaseButton>

      <!-- Blocks -->
      <BlockList :blocks="landingStore.blocks" />
    </div>
  </div>
</template>
