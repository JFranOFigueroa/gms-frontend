<script setup>
import { computed } from 'vue'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import { useLandingStore } from '@/stores/useLandingStore'

const props = defineProps({
  block: Object,
})

const landingStore = useLandingStore()

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

    <!-- SUBTITLE -->
    <div>
      <label class="block mb-2 text-zinc-400"> Subtítulo </label>

      <BaseInput
        :model-value="block.data.subtitle"
        @update:modelValue="updateField('subtitle', $event)"
      />
    </div>

    <!-- CONTENT -->
    <div>
      <label class="block mb-2 text-zinc-400"> Contenido </label>

      <textarea
        rows="6"
        class="w-full rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] px-5 py-4 outline-none focus:border-white transition-all"
        :value="block.data.text"
        @input="updateField('text', $event.target.value)"
      />
    </div>

    <!-- ALIGN -->
    <div>
      <label class="block mb-2 text-zinc-400"> Alineación </label>

      <div class="flex gap-3">
        <BaseButton variant="secondary" @click="updateField('align', 'left')"> Left </BaseButton>

        <BaseButton variant="secondary" @click="updateField('align', 'center')">
          Center
        </BaseButton>

        <BaseButton variant="secondary" @click="updateField('align', 'right')"> Right </BaseButton>
      </div>
    </div>

    <!-- WIDTH -->
    <div>
      <label class="block mb-2 text-zinc-400"> Anchura </label>

      <div class="flex flex-wrap gap-3">
        <BaseButton variant="secondary" @click="updateField('maxWidth', 'sm')"> SM </BaseButton>

        <BaseButton variant="secondary" @click="updateField('maxWidth', 'md')"> MD </BaseButton>

        <BaseButton variant="secondary" @click="updateField('maxWidth', 'lg')"> LG </BaseButton>

        <BaseButton variant="secondary" @click="updateField('maxWidth', 'xl')"> XL </BaseButton>

        <BaseButton variant="secondary" @click="updateField('maxWidth', '4xl')"> 4XL </BaseButton>
      </div>
    </div>

    <!-- BACKGROUND -->
    <div class="flex items-center justify-between">
      <span> Fondo alternativo </span>

      <BaseButton variant="secondary" @click="updateField('background', !block.data.background)">
        {{ block.data.background ? 'Activo' : 'Inactivo' }}
      </BaseButton>
    </div>
  </div>
</template>
