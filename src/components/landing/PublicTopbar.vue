<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import { RouterLink, useRoute } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { resolveApiUrl } from '@/api/http'

import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({ site: { type: Object, default: null } })

const authStore = useAuthStore()
const route = useRoute()

const { lock, unlock } = useScrollLock()

const menuOpen = ref(false)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const logoSrc = computed(() => resolveApiUrl(props.site?.logoUrl || props.site?.logo_url))
const siteName = computed(() => props.site?.shortName || props.site?.name || 'GymBack')

const onKeydown = (event) => {
  if (event.key === 'Escape') menuOpen.value = false
}

const closeMenu = () => {
  menuOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

watch(menuOpen, (open) => {
  if (open) {
    lock()
    window.addEventListener('keydown', onKeydown)
  } else {
    unlock()
    window.removeEventListener('keydown', onKeydown)
  }
})

watch(
  () => route.fullPath,
  () => closeMenu(),
)

onBeforeUnmount(() => {
  unlock()
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <header class="fixed left-0 right-0 top-0 z-50">
    <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-6">
      <!-- LOGO -->
      <RouterLink
        to="/"
        class="min-w-0 max-w-full break-words text-lg font-black leading-tight sm:text-xl xl:text-2xl 2xl:text-3xl"
      >
        <span class="inline-flex items-center gap-2 sm:gap-3">
          <img
            v-if="logoSrc"
            :src="logoSrc"
            alt="Logo del sitio"
            class="h-8 w-8 shrink-0 object-contain sm:h-10 sm:w-10"
          />
          <span class="truncate">{{ siteName }}</span>
        </span>
      </RouterLink>

      <!-- DESKTOP ACTIONS -->
      <div class="hidden items-center gap-3 sm:flex">
        <template v-if="!isAuthenticated">
          <RouterLink to="/guest-access">
            <BaseButton size="sm"> Clase muestra </BaseButton>
          </RouterLink>

          <RouterLink to="/auth/login">
            <BaseButton size="sm" variant="secondary"> Iniciar sesión </BaseButton>
          </RouterLink>
        </template>

        <template v-else>
          <RouterLink to="/dashboard">
            <BaseButton> Ir al panel </BaseButton>
          </RouterLink>
        </template>
      </div>

      <!-- MOBILE MENU BUTTON -->
      <button
        type="button"
        aria-label="Abrir menú"
        :aria-expanded="menuOpen"
        aria-controls="public-mobile-menu"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xl sm:hidden"
        @click="toggleMenu"
      >
        {{ menuOpen ? '✕' : '☰' }}
      </button>
    </div>

    <Transition name="fade">
      <div v-if="menuOpen" class="sm:hidden">
        <div class="fixed inset-0 z-40 bg-black/60" @click="closeMenu" />

        <nav
          id="public-mobile-menu"
          class="fixed inset-x-4 top-[4.5rem] z-50 max-h-[calc(100dvh-6rem)] space-y-2 overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-2xl"
        >
          <template v-if="!isAuthenticated">
            <RouterLink to="/guest-access" class="block" @click="closeMenu">
              <BaseButton class="w-full" size="sm"> Clase muestra </BaseButton>
            </RouterLink>

            <RouterLink to="/auth/login" class="block" @click="closeMenu">
              <BaseButton class="w-full" size="sm" variant="secondary"> Iniciar sesión </BaseButton>
            </RouterLink>
          </template>

          <RouterLink v-else to="/dashboard" class="block" @click="closeMenu">
            <BaseButton class="w-full"> Ir al panel </BaseButton>
          </RouterLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
