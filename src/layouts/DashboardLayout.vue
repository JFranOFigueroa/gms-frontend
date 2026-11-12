<script setup>
import { ref } from 'vue'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import ApiStatusBanner from '@/components/layout/ApiStatusBanner.vue'
import MobileSidebar from '@/components/layout/MobileSidebar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="min-h-dvh bg-[var(--color-background)] text-[var(--color-text)]">
    <AppSidebar />

    <MobileSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex min-h-dvh min-w-0 flex-col lg:ml-72">
      <header
        class="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]"
      >
        <AppTopbar @toggle-sidebar="sidebarOpen = true" />
      </header>

      <main class="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <ApiStatusBanner />
        <RouterView />
      </main>
    </div>
  </div>
</template>
