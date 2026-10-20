<script setup>
import { ref } from 'vue'

import { useRouter } from 'vue-router'

import BaseInput from '@/components/ui/BaseInput.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useAuthStore } from '@/stores/useAuthStore'

import { RouterLink } from 'vue-router'

import { useTenantStore } from '@/stores/useTenantStore'

import { useModuleStore } from '@/stores/useModuleStore'

import { useGymsStore } from '@/stores/useGymsStore'

import { useUserStore } from '@/stores/useUserStore'

import { useMemberStore } from '@/stores/useMemberStore'

const tenantStore = useTenantStore()

const authStore = useAuthStore()

const moduleStore = useModuleStore()

const gymsStore = useGymsStore()

const userStore = useUserStore()

const memberStore = useMemberStore()

const router = useRouter()

const email = ref('')

const password = ref('')

const loginError = ref('')

const login = () => {
  loginError.value = ''

  const normalizedEmail = email.value.trim().toLowerCase()

  if (!normalizedEmail) {
    loginError.value = 'Ingresa tu correo'
    return
  }

  const staff = userStore.findByEmail(normalizedEmail)
  const member = staff ? null : memberStore.findByEmail(normalizedEmail)

  const fallbackRole = normalizedEmail.includes('admin')
    ? 'admin'
    : normalizedEmail.includes('owner')
      ? 'owner'
      : normalizedEmail.includes('trainer')
        ? 'trainer'
        : 'member'

  const role = staff?.role || (member ? 'member' : fallbackRole)
  const matched = staff || member

  if (matched?.password && password.value !== matched.password) {
    loginError.value = 'Contraseña incorrecta'
    return
  }

  if (staff && staff.active === false) {
    loginError.value = 'Tu cuenta de staff está desactivada'
    return
  }

  const canSwitchGym = ['admin', 'owner', 'trainer'].includes(role)

  authStore.login({
    token: 'fake-jwt-token',

    user: {
      id: matched?.id ?? 1,

      name: matched?.name ?? 'Demo User',

      email: normalizedEmail,

      role,

      gymIds: canSwitchGym ? matched?.gymIds ?? null : null,

      defaultGymId: canSwitchGym ? matched?.defaultGymId ?? null : null,
    },
  })

  if (role !== 'member' && matched?.defaultGymId) {
    gymsStore.setActiveGym(matched.defaultGymId)
  }

  if (role === 'member' && matched?.gymId) {
    gymsStore.setActiveGym(matched.gymId)
  }

  const redirectTo =
    role === 'member'
      ? moduleStore.isModuleEnabled('checkin')
        ? '/dashboard/checkin'
        : moduleStore.isModuleEnabled('routines')
          ? '/dashboard/routine'
          : '/dashboard'
      : '/dashboard'

  router.push(redirectTo)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
    <div class="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
      <h1 class="font-black leading-tight break-words text-xl xl:text-2xl 2xl:text-3xl max-w-full">
        {{ tenantStore.gym.shortName }}
      </h1>

      <p class="text-[var(--color-text-secondary)] mb-8">Iniciar sesión</p>

      <div class="space-y-6">
        <BaseInput v-model="email" placeholder="Correo" />

        <BaseInput v-model="password" placeholder="Contraseña" type="password" />

        <p
          v-if="loginError"
          class="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {{ loginError }}
        </p>

        <BaseButton class="w-full" @click="login"> Entrar </BaseButton>

        <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 text-sm">
          <p class="font-semibold">Cuentas demo</p>

          <ul class="mt-2 space-y-1 text-[var(--color-text-secondary)]">
            <li>admin@gym.com · admin de GMS</li>
            <li>owner@gym.com · propietario</li>
            <li>trainer@gym.com · entrenador</li>
            <li>member@gym.com · miembro activo</li>
            <li>expired@gym.com · pago vencido</li>
            <li>inactive@gym.com · cuenta desactivada</li>
          </ul>

          <p class="mt-3 text-xs text-[var(--color-text-secondary)]">
            Staff: cualquier contraseña. Miembros: member123.
          </p>
        </div>

        <div class="space-y-3 pt-4 text-center">
          <RouterLink
            v-if="moduleStore.isModuleEnabled('checkin')"
            to="/checkin"
            class="block text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-all"
          >
            Check-in en recepción
          </RouterLink>

          <RouterLink
            to="/guest-access"
            class="block text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-all"
          >
            Ingresar como invitado
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
