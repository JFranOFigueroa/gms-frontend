import './style.css'
import './styles/theme.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { useAuthStore } from '@/stores/useAuthStore'
import { useTenantStore } from '@/stores/useTenantStore'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)

const authStore = useAuthStore()

authStore.restoreSession()

const tenantStore = useTenantStore()

tenantStore.restoreTenant()

app.use(router)

app.mount('#app')
