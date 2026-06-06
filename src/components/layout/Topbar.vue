<script setup>
defineEmits(['toggle-sidebar'])
</script>

<template>
  <header
    class="h-20 border-b border-[var(--color-border)] bg-[var(--color-background)] flex items-center justify-between px-6"
  >
    <!-- LEFT -->
    <div class="flex items-center gap-4">
      <!-- MOBILE MENU BUTTON -->
      <button
        class="lg:hidden w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        @click="$emit('toggle-sidebar')"
      >
        ☰
      </button>

      <!-- TITLE -->
      <div>
        <h2 class="text-2xl font-bold">Dashboard</h2>

        <p class="text-[var(--color-text-secondary)] text-sm">Bienvenido de vuelta</p>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="flex items-center gap-4">
      <!-- Notifications -->
      <button
        class="w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
      >
        🔔
      </button>

      <!-- User -->
      <div
        class="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-2"
      >
        <div
          class="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold"
        >
          A
        </div>

        <div class="hidden md:block">
          <p class="font-semibold">Admin</p>

          <p class="text-xs text-[var(--color-text-secondary)]">Administrator</p>
        </div>
      </div>
    </div>
  </header>
</template>
