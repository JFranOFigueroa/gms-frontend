<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'

import QRCode from 'qrcode'

import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import { useCheckinStore } from '@/stores/useCheckinStore'
import { useMemberStore } from '@/stores/useMemberStore'

const props = defineProps({
  open: Boolean,
})

const emit = defineEmits(['close'])

const checkinStore = useCheckinStore()
const memberStore = useMemberStore()

const activeTab = ref('credentials')

const username = ref('')
const password = ref('')
const credentialStatus = ref('')

const qrImage = ref('')
const tokenText = ref('')
const remainingSeconds = ref(10)
const qrExpiresAt = ref(0)

let refreshInterval = null
let countdownInterval = null

const submitCredentials = () => {
  const identifier = username.value.trim()

  if (!identifier || !password.value.trim()) {
    credentialStatus.value = 'Ingresa tu código o correo y contraseña'

    return
  }

  const member = memberStore.findByCode(identifier)

  if (!member) {
    credentialStatus.value = 'Miembro no encontrado'

    return
  }

  if (member.password && password.value !== member.password) {
    credentialStatus.value = 'Contraseña incorrecta'

    return
  }

  const result = checkinStore.registerAccess({
    member,
    method: 'credentials',
  })

  credentialStatus.value = result.allowed
    ? 'Check-in registrado correctamente'
    : result.reason

  if (result.allowed) {
    username.value = ''
    password.value = ''
  }
}

const refreshToken = async () => {
  const result = checkinStore.generateToken()

  tokenText.value = result.token
  qrExpiresAt.value = result.expiresAt

  qrImage.value = await QRCode.toDataURL(result.token, {
    width: 220,
    margin: 1,
  })
}

const updateCountdown = () => {
  const remaining = Math.max(0, Math.ceil((qrExpiresAt.value - Date.now()) / 1000))

  remainingSeconds.value = remaining

  if (remaining <= 0) {
    refreshToken()
  }
}

const startQrRefresh = () => {
  refreshToken()

  if (refreshInterval) clearInterval(refreshInterval)
  if (countdownInterval) clearInterval(countdownInterval)

  refreshInterval = setInterval(() => {
    refreshToken()
  }, 10000)

  countdownInterval = setInterval(updateCountdown, 1000)
}

const stopQrRefresh = () => {
  if (refreshInterval) clearInterval(refreshInterval)
  if (countdownInterval) clearInterval(countdownInterval)

  refreshInterval = null
  countdownInterval = null
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      activeTab.value = 'credentials'
      credentialStatus.value = ''
      startQrRefresh()
    } else {
      stopQrRefresh()
    }
  },
)

onBeforeUnmount(() => {
  stopQrRefresh()
})
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="space-y-6">
      <div>
        <h2 class="text-3xl font-black">Check-in</h2>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Registra tu llegada al gimnasio
        </p>
      </div>

      <div class="flex gap-3">
        <BaseButton
          variant="secondary"
          @click="activeTab = 'credentials'"
          :class="{ '!border-[var(--color-primary)]': activeTab === 'credentials' }"
        >
          Código o correo
        </BaseButton>

        <BaseButton
          variant="secondary"
          @click="activeTab = 'qr'"
          :class="{ '!border-[var(--color-primary)]': activeTab === 'qr' }"
        >
          Código QR
        </BaseButton>
      </div>

      <div v-if="activeTab === 'credentials'" class="space-y-4">
        <BaseInput v-model="username" placeholder="Código del miembro o correo" />

        <BaseInput v-model="password" type="password" placeholder="Contraseña" />

        <BaseButton class="w-full" @click="submitCredentials">
          Hacer check-in
        </BaseButton>

        <p v-if="credentialStatus" class="text-[var(--color-text-secondary)]">
          {{ credentialStatus }}
        </p>
      </div>

      <div v-else class="space-y-5 text-center">
        <p class="text-[var(--color-text-secondary)]">
          Escanea este código desde el módulo Check-in de tu cuenta.
        </p>

        <div class="flex justify-center">
          <img
            v-if="qrImage"
            :src="qrImage"
            alt="Código QR de check-in"
            class="rounded-3xl border border-[var(--color-border)] bg-white p-3"
          />
        </div>

        <p class="text-sm text-[var(--color-text-secondary)]">
          El código se actualiza en {{ remainingSeconds }} segundos
        </p>

        <p class="text-xs text-[var(--color-text-secondary)] break-all">
          Token: {{ tokenText }}
        </p>
      </div>
    </div>
  </BaseModal>
</template>