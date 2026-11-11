<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { createQrCameraReader } from '@/utils/qrCameraReader'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { formatCheckinReason } from '@/utils/checkinLabels'

const route = useRoute()
const checkins = useCheckinStore()
const slug = computed(() => (typeof route.query.gym === 'string' ? route.query.gym.trim() : ''))
const gymName = computed(() => checkins.kioskConfig?.name || 'GMS FITNESS')
const todayLabel = computed(() =>
  new Date().toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }),
)
const manualCode = ref('') // V6: código temporal escrito por el miembro, nunca su código permanente.
const manualRateLimitSeconds = ref(0)
let manualRateLimitTimer = null
let pendingManualAttempt = null
const activationCode = ref('')
const activating = ref(false)
const pageError = ref('')
const scannerStatus = ref('')
const scannerRunning = ref(false)
const videoRef = ref(null)
const result = ref(null)
const qrImage = ref('')
const remainingSeconds = ref('—')
const recentAccesses = computed(() => []) // El kiosco no consulta auditoría privada.
const stats = computed(() => ({ today: '—', granted: '—', denied: '—' }))
const slugMismatch = computed(() =>
  Boolean(
    checkins.kioskSession &&
    checkins.kioskConfig &&
    (!checkins.kioskSession.slug ||
      !checkins.kioskConfig.slug ||
      checkins.kioskSession.slug !== checkins.kioskConfig.slug),
  ),
)
const ready = computed(
  () =>
    checkins.kioskState === 'ready' &&
    checkins.kioskConfig?.checkinAvailable === true &&
    Boolean(checkins.kioskSession?.slug) &&
    !slugMismatch.value,
)
const sessionName = computed(() => checkins.kioskSession?.gymName || '')
let qrTimer = null
let sessionTimer = null
let clockTimer = null
let scanStream = null
let scannerFrame = null
let scannerEpoch = 0
let pageEpoch = 0
let issuedQr = null
let renewingEpoch = null
const serverDuration = (payload) =>
  Math.max(0, Date.parse(payload.expiresAt) - Date.parse(payload.serverTime))
function stopQr() {
  clearTimeout(qrTimer)
  clearInterval(clockTimer)
  qrTimer = null
  clockTimer = null
  qrImage.value = ''
  remainingSeconds.value = '—'
  issuedQr = null
  checkins.currentGymQr = null
}
function stopScanner() {
  scannerEpoch++
  scannerRunning.value = false
  if (scannerFrame != null) cancelAnimationFrame(scannerFrame)
  scannerFrame = null
  if (scanStream) scanStream.getTracks().forEach((t) => t.stop())
  scanStream = null
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.srcObject = null
  }
}
function stopManualAttempt() {
  pendingManualAttempt = null
  manualCode.value = ''
  clearInterval(manualRateLimitTimer)
  manualRateLimitTimer = null
  manualRateLimitSeconds.value = 0
}
function stopAll() {
  clearTimeout(sessionTimer)
  sessionTimer = null
  stopQr()
  stopScanner()
  result.value = null
  stopManualAttempt()
}
function setManualRateLimit(seconds = 60) {
  clearInterval(manualRateLimitTimer)
  const deadline = Date.now() + Math.max(1, seconds) * 1000
  manualRateLimitSeconds.value = Math.ceil((deadline - Date.now()) / 1000)
  manualRateLimitTimer = setInterval(() => {
    manualRateLimitSeconds.value = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
    if (!manualRateLimitSeconds.value) {
      clearInterval(manualRateLimitTimer)
      manualRateLimitTimer = null
    }
  }, 500)
}
function armSessionExpiry() {
  clearTimeout(sessionTimer)
  const deadline = Date.parse(checkins.kioskSession?.expiresAt || '')
  if (!Number.isFinite(deadline)) return
  const ms = Math.max(0, deadline - Date.now())
  const epoch = pageEpoch
  sessionTimer = setTimeout(() => {
    if (pageEpoch !== epoch) return
    pageEpoch++
    stopAll()
    checkins.clearKioskState()
    checkins.kioskState = 'needs_activation'
    pageError.value = 'La sesión del dispositivo caducó. Solicita una nueva activación.'
  }, ms)
}
function qrSecondsLeft() {
  if (!issuedQr) return 0
  const elapsed = Date.now() - issuedQr.startedAt
  return Math.max(0, Math.ceil((issuedQr.lifetime - elapsed) / 1000))
}
async function issueQr() {
  if (!ready.value || renewingEpoch === pageEpoch) return
  const epoch = pageEpoch
  renewingEpoch = epoch
  try {
    const data = await checkins.issueGymQr()
    if (epoch !== pageEpoch || !ready.value) return
    const lifetime = serverDuration(data)
    if (!Number.isFinite(lifetime) || lifetime <= 0) throw new Error('El QR ya caducó.')
    const png = await QRCode.toDataURL(data.qrValue, { width: 256, margin: 1 })
    if (epoch !== pageEpoch || !ready.value) return
    stopQr()
    issuedQr = { startedAt: Date.now(), lifetime }
    qrImage.value = png
    remainingSeconds.value = `${qrSecondsLeft()} s`
    clockTimer = setInterval(() => {
      remainingSeconds.value = `${qrSecondsLeft()} s`
      if (qrSecondsLeft() <= 0) {
        qrImage.value = ''
        clearInterval(clockTimer)
      }
    }, 500)
    const requestedMs = Math.max(1000, Number(data.refreshAfterSeconds || 8) * 1000)
    qrTimer = setTimeout(
      () => {
        qrTimer = null
        issueQr()
      },
      Math.min(requestedMs, Math.max(1000, lifetime - 800)),
    )
  } catch (error) {
    if (epoch === pageEpoch) {
      stopQr()
      pageError.value = error.message || 'No se pudo emitir el QR.'
    }
  } finally {
    if (renewingEpoch === epoch) renewingEpoch = null
  }
}
async function refreshSession() {
  if (!slug.value) {
    pageError.value = 'Abre Check-in desde la página de tu gimnasio.'
    return
  }
  const epoch = pageEpoch
  try {
    const config = await checkins.loadKioskConfig(slug.value)
    if (epoch !== pageEpoch) return
    if (!config?.checkinAvailable) {
      pageError.value = 'El Check-in no está disponible para este gimnasio.'
      return
    }
    await checkins.loadKioskSession()
    if (epoch !== pageEpoch) return
    if (slugMismatch.value) {
      stopQr()
      stopScanner()
      pageError.value =
        'Este dispositivo está activado en otro gimnasio. Cierra su sesión y actívalo en el gimnasio correcto.'
      return
    }
    if (ready.value) {
      armSessionExpiry()
      await issueQr()
    }
  } catch (error) {
    if (epoch === pageEpoch) pageError.value = error.message || 'No se pudo cargar el dispositivo.'
  }
}
watch(
  slug,
  async () => {
    pageEpoch++
    stopAll()
    pageError.value = ''
    scannerStatus.value = ''
    activationCode.value = ''
    checkins.clearKioskState()
    // V6 verifica el slug efectivo de la cookie contra la configuración pública, incluso tras F5.
    await refreshSession()
  },
  { immediate: true },
)
async function activate() {
  if (!activationCode.value.trim() || !slug.value || activating.value || slugMismatch.value) return
  activating.value = true
  pageError.value = ''
  try {
    const session = await checkins.activateKiosk(
      checkins.kioskConfig?.slug || slug.value,
      activationCode.value.trim(),
    )
    activationCode.value = ''
    if (session && slugMismatch.value) {
      stopQr()
      stopScanner()
      pageError.value =
        'El dispositivo corresponde a otro gimnasio. Cierra la sesión y solicita otra activación.'
    } else if (session && ready.value) {
      armSessionExpiry()
      await issueQr()
    }
  } catch (error) {
    pageError.value = error.message || 'No se pudo activar el dispositivo.'
  } finally {
    activationCode.value = ''
    activating.value = false
  }
}
async function logoutDevice() {
  pageError.value = ''
  stopAll()
  pageEpoch++
  try {
    await checkins.logoutKiosk()
  } catch (error) {
    pageError.value = error.message || 'No se pudo cerrar la sesión del dispositivo.'
  } finally {
    checkins.kioskSessionSlug = null
    checkins.kioskState = 'needs_activation'
  }
}
async function submitCode() {
  if (!ready.value || checkins.isSubmitting || manualRateLimitSeconds.value > 0) return
  const accessCode = manualCode.value.trim().toUpperCase()
  const normalized = accessCode.replace(/[\s-]/g, '')
  if (!/^[A-Z0-9]{12}$/.test(normalized)) {
    scannerStatus.value =
      'Ingresa el código temporal de 12 caracteres que aparece en la cuenta del miembro.'
    return
  }
  // Solo se reutiliza la clave para reintentar exactamente el MISMO cuerpo tras fallo de red.
  if (!pendingManualAttempt || pendingManualAttempt.accessCode !== accessCode) {
    pendingManualAttempt = { accessCode, key: crypto.randomUUID() }
  }
  const attempt = pendingManualAttempt
  const epoch = pageEpoch
  scannerStatus.value = 'Validando código…'
  result.value = null
  try {
    const decision = await checkins.validateManualCode(attempt.accessCode, attempt.key)
    if (epoch !== pageEpoch) return
    result.value = decision
    scannerStatus.value = decision?.allowed === true
      ? 'Acceso registrado.'
      : formatCheckinReason(decision?.reasonCode || decision?.reason || decision?.message)
    pendingManualAttempt = null
    manualCode.value = ''
  } catch (error) {
    if (epoch !== pageEpoch) return
    if (error.status === 429) {
      // El backend limita a diez intentos por minuto. Se aplica una espera conservadora.
      setManualRateLimit(60)
      scannerStatus.value = 'Demasiados intentos. Espera antes de validar otro código.'
      pendingManualAttempt = null
      manualCode.value = ''
    } else if (error.status === 401 || error.status === 403) {
      stopAll()
      scannerStatus.value = 'El dispositivo ya no tiene autorización. Vuelve a activarlo.'
    } else {
      scannerStatus.value =
        error.status === 409
          ? 'Conflicto de validación. Vuelve a intentar con el código correcto.'
          : error.message || 'No se pudo validar el código. Puedes reintentar el mismo envío.'
      if (error.status === 409 || error.status === 400) pendingManualAttempt = null
    }
  }
}
async function submitMemberQr(memberQr) {
  if (!ready.value || checkins.isSubmitting) return
  stopScanner()
  scannerStatus.value = 'Validando acceso…'
  const epoch = pageEpoch
  try {
    const decision = await checkins.scanMemberQr(memberQr, crypto.randomUUID())
    if (epoch !== pageEpoch) return
    result.value = decision
    scannerStatus.value = decision?.allowed === true
      ? 'Acceso registrado.'
      : formatCheckinReason(decision?.reasonCode || decision?.reason || decision?.message)
  } catch (error) {
    if (epoch !== pageEpoch) return
    scannerStatus.value = error.message || 'No fue posible validar el acceso.'
    if (!ready.value) stopAll()
  }
}
async function startScanner() {
  if (!ready.value || scannerRunning.value || checkins.isSubmitting) return
  if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
    scannerStatus.value = 'La cámara requiere HTTPS o localhost y permiso del navegador.'
    return
  }
  stopScanner()
  const current = ++scannerEpoch
  try {
    const detector = await createQrCameraReader()
    if (current !== scannerEpoch) return
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    })
    if (current !== scannerEpoch) {
      stream.getTracks().forEach((t) => t.stop())
      return
    }
    scanStream = stream
    videoRef.value.srcObject = stream
    await videoRef.value.play()
    if (current !== scannerEpoch) return
    scannerRunning.value = true
    scannerStatus.value = 'Apunta la cámara a la credencial temporal del miembro.'
    const tick = async () => {
      if (!scannerRunning.value || current !== scannerEpoch) return
      try {
        if (videoRef.value?.readyState >= 2) {
          const qrValue = await detector.detect(videoRef.value)
          if (current !== scannerEpoch) return
          if (qrValue) {
            await submitMemberQr(qrValue)
            return
          }
        }
      } catch {
        /* Algún fotograma puede fallar: continuar leyendo. */
      }
      if (scannerRunning.value && current === scannerEpoch)
        scannerFrame = requestAnimationFrame(tick)
    }
    scannerFrame = requestAnimationFrame(tick)
  } catch (error) {
    if (current !== scannerEpoch) return
    stopScanner()
    scannerStatus.value = error.message || 'No se pudo iniciar la cámara.'
  }
}
onUnmounted(() => {
  pageEpoch++
  stopAll()
  checkins.clearKioskState()
})
</script>

<template>
  <div class="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
    <div class="mx-auto max-w-7xl px-6 py-8 space-y-8">
      <!-- Header -->
      <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="flex flex-wrap items-center gap-3">
            <h1 class="text-4xl font-black">{{ gymName }}</h1>

            <span
              class="rounded-full bg-[var(--color-primary)]/15 px-3 py-1 text-sm font-semibold text-[var(--color-primary)]"
            >
              Kiosco de acceso
            </span>
          </div>

          <p class="text-[var(--color-text-secondary)] mt-2 capitalize">
            {{ todayLabel }}
          </p>
        </div>

        <div class="flex flex-wrap gap-3">
          <RouterLink to="/">
            <BaseButton variant="secondary"> Ir al inicio </BaseButton>
          </RouterLink>

          <RouterLink to="/auth/login">
            <BaseButton variant="secondary"> Iniciar sesión </BaseButton>
          </RouterLink>
        </div>
      </header>

      <p v-if="pageError" role="alert" class="text-red-400">{{ pageError }}</p>
      <BaseCard v-if="checkins.kioskState === 'needs_activation' || slugMismatch">
        <div class="space-y-3">
          <h2 class="text-xl font-bold">Activar dispositivo</h2>
          <p class="text-[var(--color-text-secondary)]">
            Solicita un código de activación al propietario o administrador del gimnasio. Caduca en
            10 minutos.
          </p>
          <template v-if="!slugMismatch">
            <BaseInput
              v-model="activationCode"
              placeholder="Código de activación"
              autocomplete="off"
            />
            <BaseButton :disabled="activating || !activationCode.trim()" @click="activate">{{
              activating ? 'Activando…' : 'Activar kiosco'
            }}</BaseButton>
          </template>
          <BaseButton v-else variant="secondary" @click="logoutDevice"
            >Cerrar sesión anterior</BaseButton
          >
        </div>
      </BaseCard>
      <p v-if="ready" class="text-sm text-[var(--color-text-secondary)]">
        Dispositivo autorizado en: {{ sessionName }}.
        <BaseButton variant="secondary" size="sm" @click="logoutDevice"
          >Desactivar sesión local</BaseButton
        >
      </p>
      <!-- Stats -->
      <div class="grid gap-4 sm:grid-cols-3">
        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Intentos hoy</p>
          <h2 class="text-4xl font-black mt-2">{{ stats.today }}</h2>
        </BaseCard>

        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Concedidos hoy</p>
          <h2 class="text-4xl font-black mt-2 text-emerald-400">{{ stats.granted }}</h2>
        </BaseCard>

        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Denegados hoy</p>
          <h2 class="text-4xl font-black mt-2 text-red-400">{{ stats.denied }}</h2>
        </BaseCard>
      </div>

      <!-- Result -->
      <div
        v-if="result"
        class="rounded-3xl border p-6"
        :class="
          result.allowed
            ? 'border-emerald-500/50 bg-emerald-500/10'
            : 'border-red-500/50 bg-red-500/10'
        "
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-start gap-4">
            <span class="text-6xl leading-none">{{ result.allowed ? '✅' : '⛔' }}</span>

            <div>
              <p
                class="text-3xl font-black"
                :class="result.allowed ? 'text-emerald-400' : 'text-red-400'"
              >
                {{ result.allowed ? 'Acceso concedido' : 'Acceso denegado' }}
              </p>

              <p class="text-lg mt-1">
                {{ result.allowed
                  ? 'Acceso registrado correctamente.'
                  : formatCheckinReason(result.reasonCode || result.reason || result.message) }}
              </p>

              <p class="text-[var(--color-text-secondary)] mt-1">
                {{ result.allowed ? 'Entrada registrada' : 'No se registró la entrada' }}
              </p>
            </div>
          </div>

          <p class="text-sm text-[var(--color-text-secondary)]">
            {{ result.occurredAt ? new Date(result.occurredAt).toLocaleTimeString('es-MX') : '' }}
          </p>
        </div>
      </div>

      <!-- Two methods -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Member credential -->
        <BaseCard>
          <div class="space-y-5">
            <div>
              <h2 class="text-2xl font-bold">Credencial del miembro</h2>

              <p class="text-[var(--color-text-secondary)] mt-1">
                Escanea el QR temporal del miembro o introduce el código de un solo uso generado
                desde su cuenta.
              </p>
            </div>

            <p v-if="!ready" role="status" class="text-sm text-amber-400">
              Para validar códigos o escanear credenciales, primero activa este navegador como
              kiosco con el código de un dispositivo habilitado. Crear el dispositivo no activa
              automáticamente la sesión de este navegador.
            </p>

            <div class="flex flex-col gap-3 sm:flex-row">
              <BaseInput
                v-model="manualCode"
                type="password"
                placeholder="Código temporal del miembro"
                :disabled="!ready || checkins.isSubmitting || manualRateLimitSeconds > 0"
              />

              <BaseButton
                class="sm:w-auto w-full"
                :disabled="
                  !ready ||
                  checkins.isSubmitting ||
                  !manualCode.trim() ||
                  manualRateLimitSeconds > 0
                "
                @click="submitCode"
              >
                {{ checkins.isSubmitting ? 'Validando…' : 'Validar' }}
              </BaseButton>
            </div>

            <p
              v-if="manualRateLimitSeconds"
              role="status"
              class="text-sm text-[var(--color-text-secondary)]"
            >
              Demasiados intentos. Vuelve a intentar en {{ manualRateLimitSeconds }} segundos.
            </p>

            <video
              ref="videoRef"
              class="w-full rounded-2xl bg-[var(--color-background)] aspect-video object-cover"
              playsinline
              muted
            />

            <div class="flex flex-wrap gap-3">
              <BaseButton
                variant="secondary"
                :disabled="!ready || scannerRunning || checkins.isSubmitting"
                @click="startScanner"
              >
                Escanear credencial
              </BaseButton>

              <BaseButton variant="secondary" :disabled="!scannerRunning" @click="stopScanner">
                Detener cámara
              </BaseButton>
            </div>

            <p v-if="scannerStatus" class="text-sm text-[var(--color-text-secondary)]">
              {{ scannerStatus }}
            </p>

            <div
              class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 text-sm text-[var(--color-text-secondary)]"
            >
              <p class="font-semibold text-[var(--color-text)]">Reglas de acceso</p>
              <p class="mt-1">Para entrar, tu membresía debe estar vigente.</p>
              <p>
                Si no puedes escanear el QR, genera un código temporal desde tu cuenta e introdúcelo
                arriba.
              </p>
            </div>
          </div>
        </BaseCard>

        <!-- Rotating QR -->
        <BaseCard>
          <div class="space-y-5">
            <div>
              <h2 class="text-2xl font-bold">QR para la app del miembro</h2>

              <p class="text-[var(--color-text-secondary)] mt-1">
                El miembro escanea este código desde su cuenta para registrar su llegada.
              </p>
            </div>

            <div class="flex justify-center">
              <div class="rounded-3xl bg-white p-4">
                <img
                  v-if="qrImage"
                  :src="qrImage"
                  alt="QR rotativo de check-in"
                  class="h-64 w-64"
                />

                <div v-else class="h-64 w-64 flex items-center justify-center text-black">
                  Código QR no disponible
                </div>
              </div>
            </div>

            <p class="text-center text-[var(--color-text-secondary)]">
              {{
                ready
                  ? `El QR vence en ${remainingSeconds} y se renueva automáticamente.`
                  : 'Activa el dispositivo para generar un QR.'
              }}
            </p>

            <p class="text-center text-sm text-[var(--color-text-secondary)]">
              Abre la app, entra a Check-in y escanea este código.
            </p>
          </div>
        </BaseCard>
      </div>

      <!-- Recent accesses -->
      <BaseCard>
        <div class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <h2 class="text-2xl font-bold">Últimos accesos</h2>

            <span class="text-sm text-[var(--color-text-secondary)]">
              {{ recentAccesses.length }} registro(s)
            </span>
          </div>

          <p v-if="!recentAccesses.length" class="text-[var(--color-text-secondary)]">
            La auditoría pública de accesos no está disponible por seguridad.
          </p>

          <div
            v-for="access in recentAccesses"
            :key="access.id"
            class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p
                class="font-semibold"
                :class="access.allowed === false ? 'text-red-400' : 'text-emerald-400'"
              >
                {{ access.allowed === false ? 'Acceso denegado' : 'Acceso concedido' }}
              </p>

              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ access.method === 'member-code' ? 'Credencial' : 'QR' }}
              </p>
            </div>

            <p class="text-sm text-[var(--color-text-secondary)]">
              {{ new Date(access.timestamp).toLocaleTimeString() }}
            </p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
