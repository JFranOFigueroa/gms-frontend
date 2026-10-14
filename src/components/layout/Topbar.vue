<script setup>
import { computed } from 'vue'

import { useAuthStore } from '@/stores/useAuthStore'

defineEmits(['toggle-sidebar'])

const authStore = useAuthStore()

const userName = computed(() => authStore.user?.name || 'Usuario')

const userRole = computed(() => {
  switch (authStore.role) {
    case 'admin':
      return 'Administrador'

    case 'trainer':
      return 'Entrenador'

    case 'member':
      return 'Miembro'

    case 'guest':
      return 'Invitado'

    default:
      return 'Usuario'
  }
})

const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
</script>

<template>
  <header
    class="h-20 border-b border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-between px-6"
  >
    <!-- LEFT -->
    <div class="flex items-center gap-4">
      <!-- MOBILE MENU BUTTON -->
      <button
        class="lg:hidden w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        @click="$emit('toggle-sidebar')"
      >
        ☰
      </button>

      <!-- TITLE -->
      <div>
        <h2 class="text-2xl font-bold">Dashboard</h2>

        <p class="text-[var(--color-text-secondary)] text-sm">Bienvenido de vuelta</p>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="flex items-center gap-4">
      <!-- Notifications -->
      <button
        class="w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
      >
        🔔
      </button>

      <!-- User -->
      <div
        class="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-2"
      >
        <div
          class="w-10 h-10 rounded-xl bg-[var(--color-text)] text-[var(--color-background)] flex items-center justify-center font-bold"
        >
          {{ userInitial }}
        </div>

        <div class="hidden md:block">
          <p class="font-semibold">
            {{ userName }}
          </p>

          <p class="text-xs text-[var(--color-text-secondary)]">
            {{ userRole }}
          </p>
        </div>
      </div>
    </div>
  </header>
</template>
