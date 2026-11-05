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
const chooseGym = computed(() => Boolean(pending.value) && gyms.value.length > 0)

async function credentialsLogin() {
  loginError.value = ''
  if (!email.value.trim() || !password.value) {
    loginError.value = 'Ingresa tu correo y contraseña.'
    return
  }
  loading.value = true
  try {
    const session = await authStore.authenticate(email.value.trim().toLowerCase(), password.value)
    if (!session?.token || !session?.user) throw new Error('No se pudo iniciar sesión. Intenta nuevamente.')
    if (!session.user.platformAdmin && !session.gyms?.length) {
      throw new Error('Tu cuenta no tiene gimnasios activos asociados.')
    }
    pending.value = session
    selectedGym.value = session.gyms?.find(g => g.id === session.user.defaultGymId)?.id || session.gyms?.[0]?.id || ''
    if (session.gyms?.length <= 1) await completeLogin()
  } catch (error) { loginError.value = error.message }
  finally { loading.value = false }
}

async function completeLogin() {
  if (!pending.value) return
  if (gyms.value.length && !selectedGym.value) { loginError.value = 'Selecciona un gimnasio.'; return }
  loading.value = true
  try {
    authStore.login(pending.value)
    if (selectedGym.value) authStore.selectGym(selectedGym.value)
    pending.value = null
    password.value = ''
    await hydrateActiveGym()
    const role = authStore.role
    const destination = role === 'member'
      ? moduleStore.isModuleEnabled('checkin') ? '/dashboard/checkin'
        : moduleStore.isModuleEnabled('routines') ? '/dashboard/routine' : '/dashboard'
      : '/dashboard'
    await router.replace(destination)
  } catch (error) { loginError.value = error.message }
  finally { loading.value = false }
}
</script>
<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
    <div class="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
      <h1 class="font-black leading-tight break-words text-xl xl:text-2xl 2xl:text-3xl max-w-full">{{ tenantStore.gym.shortName }}</h1>
      <p class="text-[var(--color-text-secondary)] mb-8">Iniciar sesión</p>
      <div class="space-y-6">
        <template v-if="!chooseGym">
          <BaseInput v-model="email" placeholder="Correo" />
          <BaseInput v-model="password" placeholder="Contraseña" type="password" />
        </template>
        <template v-else>
          <p class="text-[var(--color-text-secondary)]">Selecciona el gimnasio al que deseas ingresar.</p>
          <select v-model="selectedGym" class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <option v-for="gym in gyms" :key="gym.id" :value="gym.id">{{ gym.name }} · {{ (gym.roles || []).join(', ') }}</option>
          </select>
        </template>
        <p v-if="loginError" class="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400" role="alert">{{ loginError }}</p>
        <BaseButton class="w-full" :disabled="loading" @click="chooseGym ? completeLogin() : credentialsLogin()">
          {{ loading ? 'Verificando…' : chooseGym ? 'Ingresar al gimnasio' : 'Entrar' }}
        </BaseButton>
        <button v-if="chooseGym" type="button" class="w-full text-sm underline" @click="pending=null; loginError=''">Cambiar cuenta</button>
        <div class="space-y-3 pt-4 text-center">
          <RouterLink to="/" class="block text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">Volver al inicio</RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
