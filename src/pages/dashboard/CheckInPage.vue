<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { createQrCameraReader } from '@/utils/qrCameraReader'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { useMemberStore } from '@/stores/useMemberStore'
import { useGymsStore } from '@/stores/useGymsStore'
import { useAuthStore } from '@/stores/useAuthStore'

const checkinStore = useCheckinStore()
const memberStore = useMemberStore()
const gyms = useGymsStore()
const auth = useAuthStore()
const loadError = ref('')
const issuingManualCode = ref(false)
const manualCodeSeconds = ref(0)
const manualCodeStatus = ref('')
const temporaryCode = computed(() => manualCodeSeconds.value > 0 ? checkinStore.currentManualCode?.accessCode || '' : '')
const scannerStatus = ref('')
const scannerRunning = ref(false)
const videoRef = ref(null)
const scanDecision = ref(null)
const ownQrImage = ref('')
const ownQrSeconds = ref(0)
const issuingOwnQr = ref(false)
const member = computed(() => memberStore.ownMember?.gymId === gyms.activeGymId ? memberStore.ownMember : null)
const accessStatus = computed(() => member.value ? memberStore.getAccessStatus(member.value) : null)
const userCheckins = computed(() => member.value ? checkinStore.ownCheckins : [])
let scanStream = null
let scannerFrame = null
let scannerEpoch = 0
let currentPageEpoch = 0
let ownQrTicker = null
let ownQrDeadline = 0
let manualCodeTicker = null
let manualCodeDeadline = 0
function clearMyCode() {
  clearInterval(manualCodeTicker)
  manualCodeTicker = null
  manualCodeDeadline = 0
  manualCodeSeconds.value = 0
  checkinStore.clearManualCode()
}
async function requestMyCode() {
  const gym = gyms.activeGymId
  if (!gym || !member.value || issuingManualCode.value) return
  issuingManualCode.value = true
  manualCodeStatus.value = ''
  const epoch = currentPageEpoch
  clearMyCode() // Solicitar uno nuevo invalida el código anterior.
  try {
    const data = await checkinStore.issueMyCode(gym)
    if (epoch !== currentPageEpoch || !data) return
    const duration = Date.parse(data.expiresAt) - Date.parse(data.serverTime)
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('El código ya caducó. Solicita otro.')
    manualCodeDeadline = Date.now() + duration
    manualCodeSeconds.value = Math.ceil(duration / 1000)
    manualCodeTicker = setInterval(() => {
      manualCodeSeconds.value = Math.max(0, Math.ceil((manualCodeDeadline - Date.now()) / 1000))
      if (!manualCodeSeconds.value) { clearMyCode(); manualCodeStatus.value = 'El código caducó. Solicita uno nuevo.' }
    }, 500)
  } catch (error) {
    if (epoch === currentPageEpoch) {
      clearMyCode()
      manualCodeStatus.value = error.status === 429
        ? 'Has solicitado demasiados códigos. Inténtalo nuevamente más tarde.'
        : error.message || 'No se pudo generar el código.'
    }
  } finally { issuingManualCode.value = false }
}
function clearOwnQr() {
  clearInterval(ownQrTicker)
  ownQrTicker = null
  ownQrDeadline = 0
  ownQrImage.value = ''
  ownQrSeconds.value = 0
  checkinStore.currentMemberQr = null
}
function stopScanner() {
  scannerEpoch++
  scannerRunning.value = false
  if (scannerFrame != null) cancelAnimationFrame(scannerFrame)
  scannerFrame = null
  if (scanStream) scanStream.getTracks().forEach(t => t.stop())
  scanStream = null
  if (videoRef.value) { videoRef.value.pause(); videoRef.value.srcObject = null }
}
watch(() => gyms.activeGymId, async (gym) => {
  currentPageEpoch++
  const epoch = currentPageEpoch
  stopScanner(); clearOwnQr(); clearMyCode(); scanDecision.value = null
  manualCodeStatus.value = ''
  loadError.value = ''; scannerStatus.value = ''
  if (!gym) return
  const results = await Promise.allSettled([memberStore.loadMine(gym), checkinStore.loadMine(gym)])
  if (epoch !== currentPageEpoch) return
  const failure = results.find(r => r.status === 'rejected')
  if (failure) loadError.value = failure.reason?.message || 'No fue posible cargar tu información'
}, { immediate:true })
async function showMyQr() {
  const gym = gyms.activeGymId
  if (!gym || issuingOwnQr.value) return
  issuingOwnQr.value = true
  const epoch = currentPageEpoch
  clearOwnQr()
  try {
    const data = await checkinStore.issueMyQr(gym)
    if (epoch !== currentPageEpoch) return
    const duration = Math.max(0, Date.parse(data.expiresAt) - Date.parse(data.serverTime))
    if (!Number.isFinite(duration) || duration <= 0) throw new Error('La credencial ya caducó.')
    const image = await QRCode.toDataURL(data.qrValue, { width:256, margin:1 })
    if (epoch !== currentPageEpoch) return
    ownQrImage.value = image
    ownQrDeadline = Date.now() + duration
    ownQrSeconds.value = Math.ceil(duration / 1000)
    ownQrTicker = setInterval(() => {
      ownQrSeconds.value = Math.max(0, Math.ceil((ownQrDeadline - Date.now()) / 1000))
      if (ownQrSeconds.value === 0) clearOwnQr()
    }, 500)
  } catch (error) { if (epoch === currentPageEpoch) scannerStatus.value = error.message || 'No se pudo obtener el QR.' }
  finally { issuingOwnQr.value = false }
}
async function submitGymQr(kioskToken) {
  if (!gyms.activeGymId || checkinStore.isSubmitting) return
  stopScanner()
  const gym = gyms.activeGymId
  const epoch = currentPageEpoch
  scannerStatus.value = 'Validando acceso…'
  try {
    const decision = await checkinStore.scanGymQr(gym, kioskToken, crypto.randomUUID())
    if (epoch !== currentPageEpoch) return
    scanDecision.value = decision
    scannerStatus.value = decision?.message || (decision?.allowed === true ? 'Acceso registrado.' : 'Acceso denegado.')
    // El historial es la fuente real, incluso para intentos rechazados.
    await checkinStore.loadMine(gym)
  } catch (error) { if (epoch === currentPageEpoch) scannerStatus.value = error.message || 'No se pudo validar el QR.' }
}
async function startScanner() {
  if (scannerRunning.value || checkinStore.isSubmitting || !gyms.activeGymId) return
  if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext) {
    scannerStatus.value = 'La cámara necesita HTTPS o localhost y permiso del navegador.'; return
  }
  stopScanner()
  const current = ++scannerEpoch
  try {
    const detector = await createQrCameraReader()
    if (current !== scannerEpoch) return
    const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:'environment' } }, audio:false })
    if (current !== scannerEpoch) { stream.getTracks().forEach(t => t.stop()); return }
    scanStream = stream
    videoRef.value.srcObject = stream
    await videoRef.value.play()
    if (current !== scannerEpoch) return
    scannerRunning.value = true
    scanDecision.value = null
    scannerStatus.value = 'Apunta la cámara al QR temporal del gimnasio.'
    const tick = async () => {
      if (!scannerRunning.value || current !== scannerEpoch) return
      try {
        if (videoRef.value?.readyState >= 2) {
          const qrValue = await detector.detect(videoRef.value)
          if (current !== scannerEpoch) return
          if (qrValue) { await submitGymQr(qrValue); return }
        }
      } catch { /* Descartar fotograma fallido y continuar. */ }
      if (scannerRunning.value && current === scannerEpoch) scannerFrame = requestAnimationFrame(tick)
    }
    scannerFrame = requestAnimationFrame(tick)
  } catch (error) {
    if (current !== scannerEpoch) return
    stopScanner(); scannerStatus.value = error.message || 'No se pudo activar la cámara.'
  }
}
// El código de V6 es personal y temporal: nunca se valida desde la vista del miembro.
watch(() => auth.user?.id, () => { clearMyCode(); manualCodeStatus.value = '' })
onUnmounted(() => { currentPageEpoch++; stopScanner(); clearOwnQr(); clearMyCode() })
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-black">Check-in</h1>

      <p class="text-[var(--color-text-secondary)] mt-2">
        Consulta tu membresía y tu historial de accesos.
      </p>
    </div>

    <p v-if="loadError" role="alert" class="text-sm text-red-400">{{ loadError }}</p>
    <BaseCard v-if="member">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-[var(--color-text-secondary)]">Estado de membresía</p>

          <p class="text-2xl font-black mt-1">
            {{ member.name }}
          </p>

          <p class="text-sm text-[var(--color-text-secondary)] mt-1">
            Código {{ member.code }} · Próximo pago: {{ member.nextPaymentDate }}
          </p>
        </div>

        <span
          class="rounded-full px-3 py-1 text-sm font-semibold"
          :class="
            accessStatus?.allowed
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-red-500/15 text-red-400'
          "
        >
          {{ accessStatus?.allowed ? 'Membresía aparentemente vigente' : accessStatus?.reason }}
        </span>
      </div>
    </BaseCard>

    <div class="grid gap-6">
      <BaseCard>
        <div class="space-y-5">
          <h2 class="text-2xl font-bold">Escanear QR de acceso</h2>

          <p class="text-[var(--color-text-secondary)]">
            Apunta la cámara al código QR mostrado en el acceso del gimnasio.
          </p>

          <video
            ref="videoRef"
            class="w-full rounded-2xl bg-[var(--color-background)] aspect-video object-cover"
            playsinline
            muted
          />

          <div class="flex flex-wrap gap-3">
            <BaseButton variant="secondary" @click="startScanner" :disabled="scannerRunning || checkinStore.isSubmitting || !member">
              Iniciar escaneo
            </BaseButton>

            <BaseButton variant="secondary" @click="stopScanner" :disabled="!scannerRunning">
              Detener
            </BaseButton>
          </div>

          <p v-if="scannerStatus" role="status" class="text-[var(--color-text-secondary)]">{{ scannerStatus }}</p>
          <p v-if="scanDecision" :class="scanDecision.allowed === true ? 'text-emerald-400' : 'text-red-400'">
            {{ scanDecision.allowed === true ? 'Acceso concedido' : 'Acceso denegado' }}
          </p>

          <div class="space-y-3">
            <p class="text-sm text-[var(--color-text-secondary)]">
              ¿No puedes usar la cámara? Solicita un código temporal para escribirlo en el kiosco del gimnasio.
            </p>
            <div v-if="temporaryCode" class="rounded-xl border border-[var(--color-border)] p-4 text-center">
              <p class="text-2xl font-bold tracking-widest select-all" aria-label="Código temporal de acceso">{{ temporaryCode }}</p>
              <p class="mt-2 text-sm text-[var(--color-text-secondary)]">Caduca en {{ manualCodeSeconds }} segundos. Solo se puede usar una vez.</p>
            </div>
            <BaseButton variant="secondary" class="w-full" :disabled="issuingManualCode || !member" @click="requestMyCode">
              {{ issuingManualCode ? 'Solicitando…' : (temporaryCode ? 'Solicitar otro código' : 'Obtener código temporal') }}
            </BaseButton>
            <p v-if="manualCodeStatus" role="status" class="text-sm text-[var(--color-text-secondary)]">{{ manualCodeStatus }}</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseCard v-if="member">
      <div class="space-y-4">
        <h2 class="text-2xl font-bold">Mi credencial QR temporal</h2>
        <p class="text-[var(--color-text-secondary)]">Muestra esta credencial en recepción para que el kiosco registre tu entrada. Caduca en aproximadamente 30 segundos.</p>
        <div v-if="ownQrImage" class="flex flex-col items-center gap-2">
          <div class="rounded-2xl bg-white p-3"><img :src="ownQrImage" alt="Mi QR temporal" class="h-56 w-56" /></div>
          <p class="text-sm text-[var(--color-text-secondary)]">Caduca en {{ ownQrSeconds }} segundos.</p>
        </div>
        <BaseButton :disabled="issuingOwnQr" @click="showMyQr">{{ issuingOwnQr ? 'Generando…' : 'Mostrar / renovar mi QR' }}</BaseButton>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="space-y-5">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-2xl font-bold">Ocupación en vivo</h2>

          <span class="text-sm text-[var(--color-text-secondary)]">
            Datos de ocupación no disponibles
          </span>
        </div>

        <div class="space-y-2">
          <div class="h-4 w-full overflow-hidden rounded-full bg-[var(--color-surface)]/60">
            <div
              class="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
              :style="{ width: '0%' }"
            />
          </div>

          <p class="text-[var(--color-text-secondary)]">
            Todavía no hay información de ocupación disponible.
          </p>
        </div>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="space-y-4">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-2xl font-bold">Ocupación por hora</h2>

          <p class="text-sm text-[var(--color-text-secondary)]">
            Registros de hoy
          </p>
        </div>

        <div class="flex h-48 items-center justify-center rounded-2xl border border-[var(--color-border)] text-center text-[var(--color-text-secondary)]">
          La información por hora no está disponible por el momento.
        </div>
      </div>
    </BaseCard>

    <BaseCard>
      <div class="space-y-4">
        <h2 class="text-2xl font-bold">Mis check-ins</h2>

        <div v-if="!userCheckins.length" class="text-[var(--color-text-secondary)]">
          Todavía no hay accesos registrados en este gimnasio.
        </div>

        <div v-for="checkin in userCheckins" :key="checkin.id" class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p class="font-semibold">
              {{ new Date(checkin.timestamp).toLocaleString() }}
            </p>

            <p class="text-sm text-[var(--color-text-secondary)]">
              Método: {{ checkin.method }} ·
              {{ checkin.allowed === false ? `Denegado: ${checkin.reason}` : 'Concedido' }}
            </p>
          </div>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
