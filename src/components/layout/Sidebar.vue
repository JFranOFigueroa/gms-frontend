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
  <aside
    class="hidden lg:flex fixed left-0 top-0 w-72 h-screen flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]"
  >
    <!-- HEADER -->
    <div class="p-6 border-b border-[var(--color-border)]">
      <RouterLink
        to="/"
        class="font-black leading-tight break-words text-xl xl:text-2xl 2xl:text-3xl max-w-full"
      >
        {{ tenantStore.gym.shortName }}
      </RouterLink>

      <p class="text-[var(--color-text-secondary)] mt-2 text-sm leading-relaxed break-words">
        {{ tenantStore.gym.name }}
      </p>
    </div>

    <!-- NAV -->
    <nav class="p-4 space-y-2">
      <RouterLink
        v-for="item in navigation"
        :key="item.path"
        :to="item.path"
        class="flex items-center px-4 py-3 rounded-2xl hover:bg-[var(--color-surface-hover)] transition-all"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="p-4 border-t border-[var(--color-border)] mt-auto">
      <BaseButton class="w-full" variant="secondary" @click="logout"> Cerrar sesión </BaseButton>
    </div>
  </aside>
</template>
