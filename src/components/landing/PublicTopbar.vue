<script setup>
import { computed } from 'vue'

import { RouterLink } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { resolveApiUrl } from '@/api/http'

const props = defineProps({ publicGym: { type: Object, default: null } })

const authStore = useAuthStore()

const isAuthenticated = computed(() => authStore.isAuthenticated)
// Mantener los accesos visibles tanto en / como en /g/:slug.
// Las pantallas de destino conservan sus validaciones y límites del backend.
const selectedSlug = computed(() => props.publicGym?.slug || null)
const publicQuery = computed(() => selectedSlug.value ? { gym: selectedSlug.value } : {} )

const tenantStore = useTenantStore()
const logoSrc = computed(() => resolveApiUrl(props.publicGym?.logoUrl || props.publicGym?.logo_url))
</script>

<template>
  <header class="fixed top-0 left-0 right-0 z-50">
    <div class="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      <!-- LOGO -->
      <RouterLink
        :to="props.publicGym ? `/g/${props.publicGym.slug}` : `/`"
        class="font-black leading-tight break-words text-xl xl:text-2xl 2xl:text-3xl max-w-full"
      >
        <span class="inline-flex items-center gap-3">
          <img v-if="logoSrc" :src="logoSrc" alt="Logo del gimnasio" class="h-10 w-10 object-contain" />
          <span>{{ props.publicGym?.shortName || props.publicGym?.name || tenantStore.gym.shortName }}</span>
        </span>
      </RouterLink>

      <!-- ACTIONS -->
      <div class="flex items-center gap-4">
        <RouterLink :to="{ path: '/checkin', query: publicQuery }">
          <BaseButton size="sm" variant="secondary"> Check-in </BaseButton>
        </RouterLink>

        <!-- NOT AUTH -->
        <template v-if="!isAuthenticated">
          <RouterLink :to="{ path: '/guest-access', query: publicQuery }">
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
