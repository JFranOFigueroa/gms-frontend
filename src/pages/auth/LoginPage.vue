<script setup>
import { ref } from 'vue'

import { useRouter } from 'vue-router'

import BaseInput from '@/components/ui/BaseInput.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useAuthStore } from '@/stores/useAuthStore'

import { RouterLink } from 'vue-router'

import { useTenantStore } from '@/stores/useTenantStore'

const tenantStore = useTenantStore()

const authStore = useAuthStore()

const router = useRouter()

const email = ref('')

const password = ref('')

const login = () => {
  authStore.login({
    token: 'fake-jwt-token',

    user: {
      id: 1,

      name: 'Demo User',

      role: email.value.includes('admin')
        ? 'admin'
        : email.value.includes('trainer')
          ? 'trainer'
          : 'member',
    },
  })

  router.push('/dashboard')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
    <div
      class="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8"
    >
      <h1 class="font-black leading-tight break-words text-xl xl:text-2xl 2xl:text-3xl max-w-full">
        {{ tenantStore.gym.shortName }}
      </h1>

      <p class="text-[var(--color-text-secondary)] mb-8">Iniciar sesión</p>

      <div class="space-y-6">
        <BaseInput v-model="email" placeholder="Correo" />

        <BaseInput v-model="password" placeholder="Contraseña" type="password" />

        <!-- ROLE SIM -->

        <BaseButton class="w-full" @click="login"> Entrar </BaseButton>

        <div class="pt-4 text-center">
          <RouterLink
            to="/guest-access"
            class="text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-all"
          >
            Ingresar como invitado
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
