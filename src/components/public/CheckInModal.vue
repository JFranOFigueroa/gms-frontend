<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])
const activeTab = ref('credentials')
const username = ref('')
const password = ref('')
const credentialStatus = ref('')
const qrImage = ref('') // QR no disponible hasta que el backend firme y valide tokens
const tokenText = ref('No disponible')
const remainingSeconds = ref('—')
function submitCredentials() {
  credentialStatus.value =
    'El registro de acceso todavía no está disponible. Solicita ayuda en recepción.'
}
watch(
  () => props.open,
  (opened) => {
    if (opened) {
      activeTab.value = 'credentials'
      credentialStatus.value = ''
    }
  },
)
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div class="space-y-6">
      <div>
        <h2 class="text-3xl font-black">Check-in</h2>

        <p class="text-[var(--color-text-secondary)] mt-2">Registra tu llegada al gimnasio</p>
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

        <BaseButton class="w-full" @click="submitCredentials"> Hacer check-in </BaseButton>

        <p v-if="credentialStatus" class="text-[var(--color-text-secondary)]">
          {{ credentialStatus }}
        </p>
      </div>

      <div v-else class="space-y-5 text-center">
        <p class="text-[var(--color-text-secondary)]">
          El acceso por QR estará disponible próximamente.
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
          El código QR todavía no está disponible.
        </p>
      </div>
    </div>
  </BaseModal>
</template>
