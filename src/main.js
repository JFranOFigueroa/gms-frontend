import './style.css'
import './styles/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'
import { useThemeStore } from '@/stores/useThemeStore'

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
authStore.restoreSession()

const tenantStore = useTenantStore()
tenantStore.restoreTenant()

app.use(router)

app.mount('#app')
