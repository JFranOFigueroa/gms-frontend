<script setup>
import BaseCard from '@/components/ui/BaseCard.vue'
</script>

<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Miembros activos</p>

        <h3 class="text-5xl font-black mt-4">248</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Clases hoy</p>

        <h3 class="text-5xl font-black mt-4">12</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Ocupación</p>

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
            class="h-96 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-center text-[var(--color-text-secondary)]"
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
            <div class="p-4 rounded-2xl var(--color-surface)">Nuevo miembro registrado</div>

            <div class="p-4 rounded-2xl var(--color-surface)">Clase Full Body completada</div>

            <div class="p-4 rounded-2xl var(--color-surface)">Membresía renovada</div>
          </div>
        </BaseCard>
      </div>
    </div>
  </div>
</template>
