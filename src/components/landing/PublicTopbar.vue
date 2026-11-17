<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { RouterLink, useRoute } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { resolveApiUrl } from '@/api/http'

import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps({
  site: { type: Object, default: null },
  branches: { type: Array, default: () => [] },
})

const authStore = useAuthStore()
const route = useRoute()

const { lock, unlock } = useScrollLock()

const menuOpen = ref(false)
const checkInOpen = ref(false)
const checkInMenu = ref(null)

const isAuthenticated = computed(() => authStore.isAuthenticated)
const logoSrc = computed(() => resolveApiUrl(props.site?.logoUrl || props.site?.logo_url))
const siteName = computed(() => props.site?.shortName || props.site?.name || 'GymBack')
const checkInBranches = computed(() =>
  (props.branches || []).filter((branch) => branch?.code && branch?.name),
)
const singleCheckInBranch = computed(() =>
  checkInBranches.value.length === 1 ? checkInBranches.value[0] : null,
)
const checkInTarget = (branch) => ({ path: '/checkin', query: { branch: branch.code } })

const onKeydown = (event) => {
  if (event.key === 'Escape') {
    menuOpen.value = false
    checkInOpen.value = false
  }
}

const onDocumentClick = (event) => {
  if (checkInOpen.value && !checkInMenu.value?.contains(event.target)) checkInOpen.value = false
}

const closeMenu = () => {
  menuOpen.value = false
  checkInOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
  checkInOpen.value = false
}

const toggleCheckIn = () => {
  checkInOpen.value = !checkInOpen.value
}

watch(menuOpen, (open) => {
  if (open) lock()
  else unlock()
})

watch(checkInOpen, (open) => {
  if (open) document.addEventListener('click', onDocumentClick)
  else document.removeEventListener('click', onDocumentClick)
})

watch(
  () => route.fullPath,
  () => closeMenu(),
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  unlock()
  window.removeEventListener('keydown', onKeydown)
  document.removeEventListener('click', onDocumentClick)
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
          <div v-if="checkInBranches.length" ref="checkInMenu" class="relative">
            <RouterLink v-if="singleCheckInBranch" :to="checkInTarget(singleCheckInBranch)">
              <BaseButton size="sm"> Check-in </BaseButton>
            </RouterLink>
            <template v-else>
              <BaseButton
                size="sm"
                aria-haspopup="menu"
                :aria-expanded="checkInOpen"
                @click.stop="toggleCheckIn"
              >
                Check-in
              </BaseButton>
              <div
                v-if="checkInOpen"
                role="menu"
                class="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl"
              >
                <p class="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Elige una sucursal
                </p>
                <RouterLink
                  v-for="branch in checkInBranches"
                  :key="branch.id"
                  :to="checkInTarget(branch)"
                  role="menuitem"
                  class="block rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[var(--color-surface-hover)]"
                  @click="checkInOpen = false"
                >
                  {{ branch.name }}
                </RouterLink>
              </div>
            </template>
          </div>

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
          <div v-if="!isAuthenticated && checkInBranches.length" class="space-y-2 pb-2">
            <p class="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
              Check-in
            </p>
            <RouterLink
              v-if="singleCheckInBranch"
              :to="checkInTarget(singleCheckInBranch)"
              class="block"
              @click="closeMenu"
            >
              <BaseButton class="w-full" size="sm">
                Check-in en {{ singleCheckInBranch.name }}
              </BaseButton>
            </RouterLink>
            <template v-else>
              <RouterLink
                v-for="branch in checkInBranches"
                :key="branch.id"
                :to="checkInTarget(branch)"
                class="block"
                @click="closeMenu"
              >
                <BaseButton class="w-full" size="sm" variant="secondary">
                  {{ branch.name }}
                </BaseButton>
              </RouterLink>
            </template>
          </div>

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
