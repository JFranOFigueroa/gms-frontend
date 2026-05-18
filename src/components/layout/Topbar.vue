<script setup>
defineEmits(['toggle-sidebar'])
</script>

<template>
  <header
    class="h-20 border-b border-zinc-800 bg-[var(--color-background)] flex items-center justify-between px-6"
  >
    <!-- LEFT -->
    <div class="flex items-center gap-4">
      <!-- MOBILE MENU BUTTON -->
      <button
        class="md:hidden w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-zinc-800"
        @click="$emit('toggle-sidebar')"
      >
        ☰
      </button>

      <!-- TITLE -->
      <div>
        <h2 class="text-2xl font-bold">Dashboard</h2>

        <p class="text-zinc-500 text-sm">Bienvenido de vuelta</p>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="flex items-center gap-4">
      <!-- Notifications -->
      <button class="w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-zinc-800">
        🔔
      </button>

      <!-- User -->
      <div
        class="flex items-center gap-3 bg-[var(--color-surface)] border border-zinc-800 rounded-2xl px-4 py-2"
      >
        <div
          class="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold"
        >
          A
        </div>

        <div class="hidden md:block">
          <p class="font-semibold">Admin</p>

          <p class="text-xs text-zinc-500">Administrator</p>
        </div>
      </div>
    </div>
  </header>
</template>
