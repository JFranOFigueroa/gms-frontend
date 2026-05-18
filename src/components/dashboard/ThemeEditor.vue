<script setup>
import { useThemeStore } from '@/stores/useThemeStore'

import BaseCard from '@/components/ui/BaseCard.vue'

const themeStore = useThemeStore()

const updateAccent = (event) => {
  themeStore.currentTheme.colors.accent = event.target.value
}
</script>

<template>
  <BaseCard>
    <h3 class="text-2xl font-bold mb-6">Theme Editor</h3>

    <div class="space-y-4">
      <div>
        <label class="block mb-2 text-zinc-400"> Accent Color </label>

        <input
          type="color"
          :value="themeStore.currentTheme.colors.accent"
          @input="updateAccent"
          class="w-full h-14 rounded-xl overflow-hidden border border-zinc-800"
        />
      </div>
    </div>
  </BaseCard>
</template>
