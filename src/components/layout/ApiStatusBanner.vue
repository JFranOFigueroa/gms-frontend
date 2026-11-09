<script setup>
import { useIntegrationStore } from '@/stores/useIntegrationStore'
import { hydrateActiveGym } from '@/bootstrap/loadBackend'
const status = useIntegrationStore()
</script>
<template>
  <div
    v-if="status.errorList.length"
    class="mb-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    role="alert"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <strong>No se pudieron cargar algunos datos</strong>
      <button class="underline" type="button" @click="hydrateActiveGym()">
        Reintentar consultas
      </button>
    </div>
    <p v-for="entry in status.errorList" :key="entry.module" class="mt-1">
      {{ entry.module }}: {{ entry.message }}
      <button class="ml-2 underline" type="button" @click="status.clear(entry.module)">
        Ocultar
      </button>
    </p>
  </div>
</template>
