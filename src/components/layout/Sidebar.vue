<script setup>
import { computed } from 'vue'

import { RouterLink } from 'vue-router'

import { sidebarNavigation } from '@/config/sidebarNavigation'

import { useAuthStore } from '@/stores/useAuthStore'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useRouter } from 'vue-router'

import { useTenantStore } from '@/stores/useTenantStore'

const tenantStore = useTenantStore()

const authStore = useAuthStore()

const navigation = computed(() => {
  return sidebarNavigation[authStore.role] || []
})

const router = useRouter()

const logout = () => {
  authStore.logout()

  router.push('/')
}
</script>

<template>
  <aside class="w-72 border-r border-zinc-800 bg-[var(--color-surface)] h-screen">
    <!-- HEADER -->
    <div class="p-6 border-b border-zinc-800">
      <RouterLink
        to="/"
        class="font-black leading-tight break-words text-xl xl:text-2xl 2xl:text-3xl max-w-full"
      >
        {{ tenantStore.gym.shortName }}
      </RouterLink>

      <p class="text-zinc-500 mt-2 text-sm leading-relaxed break-words">
        {{ tenantStore.gym.name }}
      </p>
    </div>

    <!-- NAV -->
    <nav class="p-4 space-y-2">
      <RouterLink
        v-for="item in navigation"
        :key="item.path"
        :to="item.path"
        class="flex items-center px-4 py-3 rounded-2xl hover:bg-zinc-900 transition-all"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="p-4 border-t border-zinc-800 mt-auto">
      <BaseButton class="w-full" variant="secondary" @click="logout"> Cerrar sesión </BaseButton>
    </div>
  </aside>
</template>
