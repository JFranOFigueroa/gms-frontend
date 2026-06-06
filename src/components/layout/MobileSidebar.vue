<script setup>
import { useTenantStore } from '@/stores/useTenantStore'
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import { sidebarNavigation } from '@/config/sidebarNavigation'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'

const tenantStore = useTenantStore()
const authStore = useAuthStore()
const router = useRouter()

const navigation = computed(() => {
  return sidebarNavigation[authStore.role] || []
})

const emit = defineEmits(['close'])

const logout = () => {
  emit('close')

  authStore.logout()

  router.push('/')
}

defineProps({
  open: Boolean,
})
</script>

<template>
  <Transition name="fade">
    <div v-if="open" class="fixed inset-0 z-50 bg-black/60 lg:hidden" @click="$emit('close')">
      <aside
        class="w-72 h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] p-6"
        @click.stop
      >
        <div class="flex items-center justify-between mb-8">
          <RouterLink to="/" class="font-black leading-tight break-words text-xl max-w-full">
            {{ tenantStore.gym.shortName }}
          </RouterLink>

          <button class="text-2xl" @click="$emit('close')">✕</button>
        </div>

        <nav class="space-y-3">
          <RouterLink
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            class="flex items-center px-4 py-3 rounded-2xl hover:bg-[var(--color-surface-hover)] transition-all"
            @click="$emit('close')"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <div class="mt-8 pt-6 border-t border-[var(--color-border)]">
          <BaseButton class="w-full" variant="secondary" @click="logout">
            Cerrar sesión
          </BaseButton>
        </div>
      </aside>
    </div>
  </Transition>
</template>
