import './style.css'
import './styles/theme.css'

import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useGymsStore } from '@/stores/useGymsStore'
import { hydrateActiveGym, clearGymData } from '@/bootstrap/loadBackend'
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

// En cambios de gimnasio se limpian datos anteriores antes de consultar el servidor.
const gymsStore = useGymsStore()
watch(
  () => gymsStore.activeGymId,
  async (newId, oldId) => {
    if (newId !== oldId) {
      clearGymData()
      if (authStore.isAuthenticated && newId) await hydrateActiveGym()
    }
  },
)
if (authStore.isAuthenticated && gymsStore.activeGymId) void hydrateActiveGym()

app.use(router)
registerSessionHandlers({
  renewed: (session) => authStore.updateRenewedSession(session),
  expired: () => {
    authStore.clearSession()
    if (router.currentRoute.value.path !== '/auth/login') void router.replace('/auth/login')
  },
})

app.mount('#app')
