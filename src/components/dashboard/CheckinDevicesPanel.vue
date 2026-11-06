<script setup>
import { computed, onUnmounted, ref, watch } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { api } from '@/api/service'
import { useAuthStore } from '@/stores/useAuthStore'

const props = defineProps({
  gymId: { type: String, required: true },
  gymSlug: { type: String, default: '' },
})
const auth = useAuthStore()
const canManage = computed(() => auth.isAuthenticated &&
  (auth.user?.platformAdmin === true || auth.role === 'owner'))
const devices = ref([])
const deviceName = ref('')
const loading = ref(false)
const saving = ref(false)
const errorText = ref('')
const successText = ref('')
const copyStatus = ref('')
const confirmation = ref(null)
const issuedCode = ref(null) // Solo memoria; nunca se almacena ni se registra en consola.
let codeTimer = null
let disposed = false
let generation = 0
let latestLoad = 0
const busy = computed(() => loading.value || saving.value)
const currentCode = computed(() => issuedCode.value?.code || '')

function clearCode() {
  clearTimeout(codeTimer)
  codeTimer = null
  issuedCode.value = null
  copyStatus.value = ''
}
function showCode(response, label) {
  clearCode()
  if (!response?.activationCode) {
    successText.value = 'Operación realizada. El servidor no devolvió un código de activación.'
    return
  }
  const expiresAt = response.activationExpiresAt || null
  const remaining = expiresAt ? Date.parse(expiresAt) - Date.now() : 10 * 60 * 1000
  if (!Number.isFinite(remaining) || remaining <= 0) {
    successText.value = 'El código entregado por el servidor ya caducó. Genera uno nuevo.'
    return
  }
  issuedCode.value = { code: response.activationCode, label, expiresAt }
  codeTimer = setTimeout(clearCode, Math.min(remaining, 10 * 60 * 1000))
}
function formatDate(iso) {
  if (!iso) return 'Sin actividad registrada'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Sin actividad registrada' : date.toLocaleString('es-MX')
}
function messageFor(error) {
  if (error?.status === 401) return 'La sesión terminó. Inicia sesión nuevamente.'
  if (error?.status === 403) return 'No tienes permiso para administrar dispositivos de este gimnasio.'
  if (error?.status === 404) return 'El dispositivo ya no existe o el gimnasio no está disponible.'
  if (error?.status === 409) return 'No se pudo completar por un conflicto de datos. Actualiza la lista.'
  if (error?.status === 429) return 'Demasiadas solicitudes. Intenta nuevamente más tarde.'
  return 'No se pudo confirmar la operación. Actualiza la lista antes de volver a intentarlo.'
}
function normalizeDevices(data) {
  const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : [])
  return items
}
async function refreshDevices() {
  const epoch = generation
  const run = ++latestLoad
  if (!canManage.value || !props.gymId) return
  loading.value = true
  try {
    const data = await api.checkinDevices.list(props.gymId)
    if (disposed || epoch !== generation || run !== latestLoad) return
    devices.value = normalizeDevices(data)
    errorText.value = ''
  } catch (error) {
    if (disposed || epoch !== generation || run !== latestLoad) return
    devices.value = []
    errorText.value = messageFor(error)
  } finally {
    if (!disposed && epoch === generation && run === latestLoad) loading.value = false
  }
}
async function mutate(operation, successMessage) {
  if (busy.value || !canManage.value) return
  saving.value = true
  errorText.value = ''
  successText.value = ''
  confirmation.value = null
  const run = generation
  try {
    const { response, label } = await operation()
    if (disposed || run !== generation) return
    successText.value = label && !response?.activationCode
      ? 'Operación realizada, pero el servidor no devolvió un código. Usa «Regenerar código».'
      : successMessage
    if (response?.activationCode) showCode(response, label)
    await refreshDevices()
  } catch (error) {
    if (!disposed && run === generation) errorText.value = messageFor(error)
  } finally {
    if (!disposed && run === generation) saving.value = false
  }
}
function createDevice() {
  const name = deviceName.value.trim()
  if (!name) { errorText.value = 'Escribe un nombre para identificar el dispositivo.'; return }
  if (name.length > 120) { errorText.value = 'Usa un nombre de hasta 120 caracteres.'; return }
  clearCode()
  mutate(async () => {
    const response = await api.checkinDevices.create(props.gymId, name)
    deviceName.value = ''
    return { response, label:name }
  }, 'Dispositivo creado. Copia su código de activación antes de cerrar esta sección.')
}
function ask(kind, device) {
  if (busy.value) return
  const id = device.deviceId || device.id
  if (!id) { errorText.value = 'No se recibió el identificador interno del dispositivo. Actualiza la lista.'; return }
  confirmation.value = { kind, id, name:device.deviceName || 'Dispositivo', active:device.active === true }
  errorText.value = ''
  successText.value = ''
}
const confirmationText = computed(() => {
  if (!confirmation.value) return ''
  const { kind, name, active } = confirmation.value
  if (kind === 'reissue') return `¿Regenerar el código para «${name}»? Sus sesiones anteriores quedarán revocadas.`
  if (kind === 'remove') return `¿Eliminar «${name}»? Su acceso de kiosco dejará de funcionar.`
  if (kind === 'toggle') return active
    ? `¿Desactivar «${name}»? No podrá registrar accesos hasta habilitarlo nuevamente.`
    : `¿Habilitar «${name}»? Podrá utilizarse si tiene una sesión válida.`
  return ''
})
function confirmOperation() {
  const selected = confirmation.value
  if (!selected || busy.value) return
  clearCode()
  if (selected.kind === 'reissue') {
    mutate(async () => ({
      response: await api.checkinDevices.reissue(props.gymId, selected.id), label:selected.name,
    }), 'Código regenerado. Las sesiones anteriores del dispositivo quedaron revocadas.')
  } else if (selected.kind === 'remove') {
    mutate(async () => {
      await api.checkinDevices.remove(props.gymId, selected.id)
      return { response:null }
    }, 'Dispositivo eliminado.')
  } else if (selected.kind === 'toggle') {
    mutate(async () => {
      await api.checkinDevices.update(props.gymId, selected.id, !selected.active)
      return { response:null }
    }, selected.active ? 'Dispositivo desactivado.' : 'Dispositivo habilitado.')
  }
}
async function copyCode() {
  if (!currentCode.value) return
  try {
    await navigator.clipboard.writeText(currentCode.value)
    copyStatus.value = 'Código copiado. Úsalo únicamente en el kiosco correspondiente.'
  } catch {
    copyStatus.value = 'Selecciona el código y cópialo manualmente.'
  }
}
watch(() => [props.gymId, canManage.value], () => {
  generation++
  devices.value = []
  confirmation.value = null
  errorText.value = ''; successText.value = ''
  clearCode()
  if (canManage.value && props.gymId) refreshDevices()
}, { immediate:true })
onUnmounted(() => { disposed = true; generation++; clearCode() })
</script>

<template>
  <BaseCard v-if="canManage">
    <section aria-labelledby="devices-title" class="space-y-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
        <div>
          <h2 id="devices-title" class="text-2xl font-bold">Dispositivos de acceso</h2>
          <p class="text-sm text-[var(--color-text-secondary)] mt-2">
            Crea y administra los kioscos que pueden validar códigos y QR en este gimnasio.
          </p>
        </div>
        <RouterLink v-if="gymSlug" :to="{ name:'standalone-checkin', query:{ gym:gymSlug } }" target="_blank" rel="noopener noreferrer"
          class="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] px-4 py-3 font-semibold hover:bg-[var(--color-surface-hover)]">
          Abrir kiosco
        </RouterLink>
      </div>

      <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="createDevice">
        <label class="sr-only" for="new-checkin-device">Nombre del dispositivo</label>
        <input id="new-checkin-device" v-model="deviceName" type="text" maxlength="120"
          autocomplete="off" placeholder="Ej. Recepción principal" :disabled="busy"
          class="flex-1 min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3" />
        <button type="submit" :disabled="busy || !deviceName.trim()"
          class="rounded-2xl bg-emerald-500 px-5 py-3 font-semibold text-white disabled:opacity-50">
          {{ saving ? 'Guardando…' : 'Crear dispositivo' }}
        </button>
      </form>

      <div v-if="issuedCode" class="rounded-2xl border border-emerald-500/50 bg-emerald-500/5 p-4 space-y-3" aria-live="polite">
        <p class="font-bold">Código de activación de {{ issuedCode.label }}</p>
        <p class="text-sm text-[var(--color-text-secondary)]">Se muestra únicamente ahora. Introdúcelo en la pantalla pública de activación antes de que caduque (máximo 10 minutos). No lo compartas fuera del personal autorizado.</p>
        <div class="flex flex-wrap items-center gap-3">
          <code class="max-w-full break-all select-all rounded-xl bg-[var(--color-surface)] px-4 py-3 font-mono text-lg">{{ currentCode }}</code>
          <button type="button" class="rounded-xl border border-[var(--color-border)] px-4 py-3 font-semibold" @click="copyCode">Copiar código</button>
          <button type="button" class="rounded-xl border border-[var(--color-border)] px-4 py-3" @click="clearCode">Ocultar código</button>
        </div>
        <p v-if="issuedCode.expiresAt" class="text-sm text-[var(--color-text-secondary)]">Caduca: {{ formatDate(issuedCode.expiresAt) }}</p>
        <p v-if="copyStatus" class="text-sm">{{ copyStatus }}</p>
      </div>

      <p v-if="errorText" class="text-sm text-red-400" role="alert">{{ errorText }}</p>
      <p v-if="successText" class="text-sm text-emerald-400" role="status">{{ successText }}</p>

      <div v-if="confirmation" class="rounded-2xl border border-amber-500/40 p-4 space-y-3" role="group" aria-label="Confirmar operación de dispositivo">
        <p class="font-semibold">{{ confirmationText }}</p>
        <div class="flex flex-wrap gap-3">
          <button type="button" :disabled="busy" class="rounded-xl bg-red-500 px-4 py-2 font-semibold text-white disabled:opacity-50" @click="confirmOperation">Confirmar</button>
          <button type="button" :disabled="busy" class="rounded-xl border border-[var(--color-border)] px-4 py-2" @click="confirmation = null">Cancelar</button>
        </div>
      </div>

      <div class="flex justify-between items-center gap-3">
        <h3 class="font-semibold text-lg">Kioscos registrados</h3>
        <button type="button" :disabled="busy" class="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-50" @click="refreshDevices">Actualizar</button>
      </div>
      <p v-if="loading" class="text-sm text-[var(--color-text-secondary)]">Cargando dispositivos…</p>
      <p v-else-if="!devices.length" class="text-sm text-[var(--color-text-secondary)]">No hay dispositivos registrados para este gimnasio.</p>
      <ul v-else class="space-y-3">
        <li v-for="device in devices" :key="device.deviceId || device.id" class="rounded-2xl border border-[var(--color-border)] p-4 space-y-3">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <div>
              <p class="font-bold">{{ device.deviceName || 'Dispositivo de acceso' }}</p>
              <p class="text-sm text-[var(--color-text-secondary)] mt-1">
                {{ device.active === true ? 'Habilitado' : 'Deshabilitado' }} ·
                {{ device.activated === true ? 'Activado' : 'Pendiente de activación' }}
              </p>
              <p class="text-xs text-[var(--color-text-secondary)] mt-1">Última actividad: {{ formatDate(device.lastSeenAt) }}</p>
            </div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button type="button" :disabled="busy || (!device.deviceId && !device.id)" class="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold disabled:opacity-50" @click="ask('reissue', device)">Regenerar código</button>
            <button type="button" :disabled="busy || (!device.deviceId && !device.id)" class="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold disabled:opacity-50" @click="ask('toggle', device)">{{ device.active === true ? 'Desactivar' : 'Habilitar' }}</button>
            <button type="button" :disabled="busy || (!device.deviceId && !device.id)" class="rounded-xl border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-400 disabled:opacity-50" @click="ask('remove', device)">Eliminar</button>
          </div>
        </li>
      </ul>
    </section>
  </BaseCard>
</template>
