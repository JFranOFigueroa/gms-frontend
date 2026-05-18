<script setup>
import { ref } from 'vue'

import { useRouter } from 'vue-router'

import BaseInput from '@/components/ui/BaseInput.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

const router = useRouter()

const name = ref('')

const phone = ref('')

const accessAsGuest = () => {
  // MOCK VALIDATION
  const alreadyUsed = localStorage.getItem(`guest-${phone.value}`)

  if (alreadyUsed) {
    alert('Este teléfono ya utilizó una clase muestra')

    return
  }

  localStorage.setItem(`guest-${phone.value}`, 'used')

  authStore.login({
    token: 'guest-token',

    user: {
      id: Date.now(),

      name: name.value,

      role: 'guest',

      phone: phone.value,
    },
  })

  router.push('/dashboard/calendar')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
    <div class="w-full max-w-md rounded-3xl border border-zinc-800 bg-[var(--color-surface)] p-8">
      <h1 class="text-4xl font-black mb-2">Clase muestra</h1>

      <p class="text-zinc-500 mb-8">Registra tu acceso temporal</p>

      <div class="space-y-6">
        <BaseInput v-model="name" placeholder="Nombre" />

        <BaseInput v-model="phone" placeholder="Teléfono" />

        <BaseButton class="w-full" @click="accessAsGuest"> Continuar </BaseButton>
      </div>
    </div>
  </div>
</template>
