<script setup>
import { computed } from 'vue'

import { RouterLink } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useModuleStore } from '@/stores/useModuleStore'
import { useTenantStore } from '@/stores/useTenantStore'

const authStore = useAuthStore()

const moduleStore = useModuleStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)

const checkinEnabled = computed(() => moduleStore.isModuleEnabled('checkin'))

const tenantStore = useTenantStore()
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      <!-- LOGO -->
      <RouterLink
        to="/"
        class="font-black leading-tight break-words text-xl xl:text-2xl 2xl:text-3xl max-w-full"
      >
        {{ tenantStore.gym.shortName }}
      </RouterLink>

      <!-- ACTIONS -->
      <div class="flex items-center gap-4">
        <RouterLink v-if="checkinEnabled" to="/checkin">
          <BaseButton size="sm" variant="secondary"> Check-in </BaseButton>
        </RouterLink>

        <!-- NOT AUTH -->
        <template v-if="!isAuthenticated">
          <RouterLink to="/guest-access">
            <BaseButton size="sm"> Clase muestra </BaseButton>
          </RouterLink>

          <RouterLink to="/auth/login">
            <BaseButton size="sm" variant="secondary"> Iniciar sesión </BaseButton>
          </RouterLink>
        </template>

        <!-- AUTHENTICATED -->
        <template v-else>
          <RouterLink to="/dashboard">
            <BaseButton> ☰ </BaseButton>
          </RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>
