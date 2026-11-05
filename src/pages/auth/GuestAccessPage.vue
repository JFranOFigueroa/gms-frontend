<script setup>
import { RouterLink } from 'vue-router'
</script>
<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-6">
    <div class="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 space-y-5">
      <h1 class="text-4xl font-black">Clase muestra</h1>
      <p class="text-[var(--color-text-secondary)]">El registro de invitados estará disponible próximamente.</p>
      <RouterLink class="underline" to="/auth/login">Regresar al inicio de sesión</RouterLink>
    </div>
  </div>
</template>
