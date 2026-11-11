<script setup>
import { useModuleStore } from '@/stores/useModuleStore'

const modules = useModuleStore()
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-3 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8">
    <h1 class="text-3xl font-black">Módulos no disponibles</h1>
    <p class="text-[var(--color-text-secondary)]">
      Tu perfil de entrenador tiene acceso únicamente a Ventas y Rutinas.
      Contacta al propietario si necesitas habilitar alguno de estos módulos.
    </p>
    <p v-if="!modules.loaded" class="text-sm text-[var(--color-text-secondary)]">
      No se pudo comprobar la configuración de los módulos. Intenta actualizar la página.
    </p>
  </div>
</template>
