<script setup>
import { ref } from 'vue'

import Sidebar from '@/components/layout/Sidebar.vue'
import Topbar from '@/components/layout/Topbar.vue'
import MobileSidebar from '@/components/layout/MobileSidebar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
    <Sidebar />

    <MobileSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex flex-col lg:ml-72">
      <header
        class="sticky top-0 z-40 bg-[var(--color-background)] border-b border-[var(--color-border)]"
      >
        <Topbar @toggle-sidebar="sidebarOpen = true" />
      </header>

      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
