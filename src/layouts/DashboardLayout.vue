<script setup>
import { ref } from 'vue'

import Sidebar from '@/components/layout/Sidebar.vue'
import Topbar from '@/components/layout/Topbar.vue'
import MobileSidebar from '@/components/layout/MobileSidebar.vue'

const sidebarOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-[var(--color-background)] text-white flex">
    <div class="hidden md:block">
      <Sidebar />
    </div>

    <MobileSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

    <div class="flex-1 flex flex-col">
      <Topbar @toggle-sidebar="sidebarOpen = true" />

      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>
  </div>
</template>
