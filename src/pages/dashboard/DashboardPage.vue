<script setup>
import BaseCard from '@/components/ui/BaseCard.vue'
</script>

<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BaseCard>
        <p class="text-zinc-500">Miembros activos</p>

        <h3 class="text-5xl font-black mt-4">248</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-zinc-500">Clases hoy</p>

        <h3 class="text-5xl font-black mt-4">12</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-zinc-500">Ocupación</p>

        <h3 class="text-5xl font-black mt-4">78%</h3>
      </BaseCard>
    </div>

    <!-- Main -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Calendar Preview -->
      <div class="xl:col-span-2">
        <BaseCard>
          <h3 class="text-2xl font-bold mb-6">Calendario</h3>

          <div
            class="h-96 rounded-2xl border border-zinc-800 bg-[var(--color-background)] flex items-center justify-center text-zinc-500"
          >
            Calendar Preview
          </div>
        </BaseCard>
      </div>

      <!-- Activity -->
      <div>
        <BaseCard>
          <h3 class="text-2xl font-bold mb-6">Actividad reciente</h3>

          <div class="space-y-4">
            <div class="p-4 rounded-2xl bg-zinc-800">Nuevo miembro registrado</div>

            <div class="p-4 rounded-2xl bg-zinc-800">Clase Full Body completada</div>

            <div class="p-4 rounded-2xl bg-zinc-800">Membresía renovada</div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
