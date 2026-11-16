import './style.css'
import './styles/theme.css'

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useBranchesStore } from '@/stores/useBranchesStore'
import { hydrateActiveBranch, clearBranchData } from '@/bootstrap/loadBackend'
import { registerSessionHandlers } from '@/api/http'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)

const pinia = createPinia()

pinia.use(piniaPluginPersistedstate)

app.use(pinia)

/*
|--------------------------------------------------------------------------
| Restore persisted stores
|--------------------------------------------------------------------------
*/

const authStore = useAuthStore()
await authStore.restoreSession()

const tenantStore = useTenantStore()
tenantStore.restoreTenant()

// En cambios de sucursal se limpian datos anteriores antes de consultar el servidor.
const branchesStore = useBranchesStore()
watch(
  () => branchesStore.activeBranchId,
  async (newId, oldId) => {
    if (newId !== oldId) {
      clearBranchData()
      if (authStore.isAuthenticated && newId) await hydrateActiveBranch()
    }
  },
)
if (authStore.isAuthenticated) void hydrateActiveBranch()

app.use(router)
registerSessionHandlers({
  renewed: (session) => authStore.updateRenewedSession(session),
  expired: () => {
    authStore.clearSession()
    if (router.currentRoute.value.path !== '/auth/login') void router.replace('/auth/login')
  },
})

app.mount('#app')
