<script setup>
import { useTenantStore } from '@/stores/useTenantStore'
import { RouterLink } from 'vue-router'

import { computed } from 'vue'

import { sidebarNavigation } from '@/config/sidebarNavigation'

import { useAuthStore } from '@/stores/useAuthStore'

const tenantStore = useTenantStore()

const authStore = useAuthStore()

const navigation = computed(() => {
  return sidebarNavigation[authStore.role] || []
})

defineProps({
  open: Boolean,
})

defineEmits(['close'])
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 bg-black/60 md:hidden" @click="$emit('close')">
      <aside class="w-72 h-full bg-[var(--color-surface)] border-r border-zinc-800 p-6" @click.stop>
        <div class="flex items-center justify-between mb-8">
          <RouterLink
            to="/"
            class="font-black leading-tight break-words text-xl xl:text-2xl 2xl:text-3xl max-w-full"
          >
            {{ tenantStore.gym.shortName }}
          </RouterLink>

          <button @click="$emit('close')" class="text-2xl">✕</button>
        </div>

        <nav class="space-y-3">
          <RouterLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            class="flex items-center px-4 py-3 rounded-2xl hover:bg-zinc-900 transition-all"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </aside>
    </div>
  </Transition>
</template>
