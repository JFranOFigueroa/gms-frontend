<script setup>
import { RouterLink } from 'vue-router'
</script>
<template>
  <div
    class="flex min-h-dvh items-center justify-center bg-[var(--color-background)] p-4 sm:p-6"
  >
    <div
      class="w-full max-w-md space-y-5 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8"
    >
      <h1 class="text-3xl font-black sm:text-4xl">Clase muestra</h1>
      <p class="text-[var(--color-text-secondary)]">
        El registro de invitados estará disponible próximamente.
      </p>
      <RouterLink class="underline" to="/auth/login">Regresar al inicio de sesión</RouterLink>
    </div>
  </div>
</template>
