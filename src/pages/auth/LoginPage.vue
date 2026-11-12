<script setup>
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useModuleStore } from '@/stores/useModuleStore'
import { hydrateActiveGym } from '@/bootstrap/loadBackend'

const authStore = useAuthStore()
const tenantStore = useTenantStore()
const moduleStore = useModuleStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const loginError = ref('')
const loading = ref(false)
const pending = ref(null)
const selectedGym = ref('')
const gyms = computed(() => pending.value?.gyms || [])
// Mostrar siempre el paso de selección, incluso con un solo gimnasio.
// Un administrador sin gimnasios también debe poder iniciar sesión y crear el primero.
const chooseGym = computed(() => Boolean(pending.value))

async function credentialsLogin() {
  loginError.value = ''
  if (!email.value.trim() || !password.value) {
    loginError.value = 'Ingresa tu correo y contraseña.'
    return
  }
  loading.value = true
  try {
    const session = await authStore.authenticate(email.value.trim().toLowerCase(), password.value)
    if (!session?.token || !session?.user)
      throw new Error('No se pudo iniciar sesión. Intenta nuevamente.')
    if (!session.user.platformAdmin && !session.gyms?.length) {
      throw new Error('Tu cuenta no tiene gimnasios activos asociados.')
    }
    pending.value = session
    selectedGym.value =
      session.gyms?.find((g) => g.id === session.user.defaultGymId)?.id ||
      session.gyms?.[0]?.id ||
      ''
  } catch (error) {
    loginError.value = error.message
  } finally {
    loading.value = false
  }
}

async function completeLogin() {
  if (!pending.value) return
  if (gyms.value.length && !selectedGym.value) {
    loginError.value = 'Selecciona un gimnasio.'
    return
  }
  loading.value = true
  try {
    authStore.login(pending.value)
    if (selectedGym.value) authStore.selectGym(selectedGym.value)
    pending.value = null
    password.value = ''
    await hydrateActiveGym()
    const role = authStore.role
    const destination =
      role === 'trainer'
        ? moduleStore.isModuleEnabled('pos')
          ? '/dashboard/pos'
          : moduleStore.isModuleEnabled('routines')
            ? '/dashboard/routines'
            : '/dashboard/disponibilidad'
        : role === 'member'
        ? moduleStore.isModuleEnabled('checkin')
          ? '/dashboard/checkin'
          : moduleStore.isModuleEnabled('routines')
            ? '/dashboard/routine'
            : '/dashboard'
        : '/dashboard'
    await router.replace(destination)
  } catch (error) {
    loginError.value = error.message
  } finally {
    loading.value = false
  }
}

const resetGymSelection = () => {
  pending.value = null
  loginError.value = ''
}
</script>
<template>
  <div
    class="flex min-h-dvh items-center justify-center bg-[var(--color-background)] p-4 sm:p-6"
  >
    <div
      class="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8"
    >
      <h1 class="max-w-full break-words text-xl font-black leading-tight sm:text-2xl 2xl:text-3xl">
        {{ tenantStore.gym.shortName }}
      </h1>
      <p class="text-[var(--color-text-secondary)] mb-8">Iniciar sesión</p>
      <div class="space-y-6">
        <template v-if="!chooseGym">
          <BaseInput v-model="email" placeholder="Correo" />
          <BaseInput v-model="password" placeholder="Contraseña" type="password" />
        </template>
        <template v-else>
          <p class="text-[var(--color-text-secondary)]">
            {{ gyms.length ? 'Selecciona el gimnasio al que deseas ingresar.' : 'Todavía no hay gimnasios disponibles. Ingresa para configurar el primero.' }}
          </p>
          <select
            v-if="gyms.length"
            v-model="selectedGym"
            class="h-14 w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base"
          >
            <option v-for="gym in gyms" :key="gym.id" :value="gym.id">
              {{ gym.name }}
            </option>
          </select>
        </template>
        <p
          v-if="loginError"
          class="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          role="alert"
        >
          {{ loginError }}
        </p>
        <BaseButton
          class="w-full"
          :disabled="loading"
          @click="chooseGym ? completeLogin() : credentialsLogin()"
        >
          {{ loading ? 'Verificando…' : chooseGym ? gyms.length ? 'Ingresar al gimnasio' : 'Ingresar a administración' : 'Entrar' }}
        </BaseButton>
        <button
          v-if="chooseGym"
          type="button"
          class="w-full text-sm underline"
          @click="resetGymSelection"
        >
          Cambiar cuenta
        </button>
        <div class="space-y-3 pt-4 text-center">
          <RouterLink
            to="/"
            class="block text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            >Volver al inicio</RouterLink
          >
        </div>
      </div>
    </div>
  </div>
</template>
