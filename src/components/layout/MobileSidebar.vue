<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

import { RouterLink, useRouter } from 'vue-router'

import { sidebarNavigation } from '@/config/sidebarNavigation'

import { useAuthStore } from '@/stores/useAuthStore'
import { useGymsStore } from '@/stores/useGymsStore'
import { useModuleStore } from '@/stores/useModuleStore'
import { useTenantStore } from '@/stores/useTenantStore'

import { useScrollLock } from '@/composables/useScrollLock'

import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(['close'])

const tenantStore = useTenantStore()
const gyms = useGymsStore()
const authStore = useAuthStore()
const moduleStore = useModuleStore()
const router = useRouter()

const { lock, unlock } = useScrollLock()

const closeButton = ref(null)

let previouslyFocused = null

const publicHome = computed(() =>
  authStore.role === 'owner' && gyms.activeGym?.slug
    ? `/g/${encodeURIComponent(gyms.activeGym.slug)}`
    : '/',
)

const navigation = computed(() => {
  return (sidebarNavigation[authStore.role] || []).filter((item) => {
    return !item.module || moduleStore.isModuleEnabled(item.module)
  })
})

const onKeydown = (event) => {
  if (event.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      previouslyFocused = document.activeElement

      lock()

      window.addEventListener('keydown', onKeydown)

      await nextTick()

      closeButton.value?.focus()
    } else {
      unlock()

      window.removeEventListener('keydown', onKeydown)

      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()

      previouslyFocused = null
    }
  },
)

onBeforeUnmount(() => {
  unlock()
  window.removeEventListener('keydown', onKeydown)
})

const logout = async () => {
  emit('close')

  await authStore.logout()

  router.push('/')
}
</script>

<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-[var(--color-background)]/60 lg:hidden"
      @click="emit('close')"
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        class="flex h-dvh w-72 max-w-[85vw] flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
        @click.stop
      >
        <div class="mb-6 flex shrink-0 items-center justify-between gap-3">
          <RouterLink
            :to="publicHome"
            class="max-w-full break-words text-xl font-black leading-tight"
            @click="emit('close')"
          >
            {{ tenantStore.gym.shortName }}
          </RouterLink>

          <button
            ref="closeButton"
            type="button"
            aria-label="Cerrar menú"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]/40 text-xl"
            @click="emit('close')"
          >
            ✕
          </button>
        </div>

        <nav class="flex-1 space-y-2 overflow-y-auto pr-1">
          <RouterLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            class="flex items-center rounded-2xl px-4 py-3 transition-all hover:bg-[var(--color-surface-hover)]"
            @click="emit('close')"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="mt-4 shrink-0 border-t border-[var(--color-border)] pt-4">
          <BaseButton class="w-full" variant="secondary" @click="logout">
            Cerrar sesión
          </BaseButton>
        </div>
      </aside>
    </div>
  </Transition>
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
