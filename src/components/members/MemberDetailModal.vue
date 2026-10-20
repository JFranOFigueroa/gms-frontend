<script setup>
import { computed, ref, watch } from 'vue'

import QRCode from 'qrcode'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useMemberStore } from '@/stores/useMemberStore'

const props = defineProps({
  open: Boolean,
  member: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const memberStore = useMemberStore()

const qrDataUrl = ref('')

const status = computed(() => {
  if (!props.member) return { label: '—', class: '' }

  if (!props.member.active) {
    return { label: 'Inactivo', class: 'bg-red-500/15 text-red-400' }
  }

  if (memberStore.isPaymentExpired(props.member)) {
    return { label: 'Pago vencido', class: 'bg-amber-500/15 text-amber-400' }
  }

  return { label: 'Activo', class: 'bg-emerald-500/15 text-emerald-400' }
})

const modalityLabel = computed(() => {
  return props.member?.paymentModality === 'yearly' ? 'Anual' : 'Mensual'
})

const payments = computed(() => {
  if (!props.member) return []

  return memberStore.memberPayments(props.member.id)
})

const methodLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

watch(
  () => [props.open, props.member?.id],
  async () => {
    qrDataUrl.value = ''

    if (!props.open || !props.member?.code) return

    try {
      qrDataUrl.value = await QRCode.toDataURL(`GMS-MEMBER:${props.member.code}`, {
        width: 220,
        margin: 1,
        color: { dark: '#111111', light: '#ffffff' },
      })
    } catch {
      qrDataUrl.value = ''
    }
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal :open="open" @close="emit('close')">
    <div v-if="member" class="space-y-8">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-3xl font-black">{{ member.name }}</h2>

          <p class="text-[var(--color-text-secondary)] mt-1">
            Código {{ member.code }} · {{ member.email }}
          </p>
        </div>

        <span class="rounded-full px-3 py-1 text-sm font-semibold" :class="status.class">
          {{ status.label }}
        </span>
      </div>

      <div class="flex flex-col gap-6 sm:flex-row">
        <div class="space-y-4">
          <div
            class="h-36 w-36 overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center"
          >
            <img
              v-if="member.photo"
              :src="member.photo"
              alt="Foto del miembro"
              class="h-full w-full object-cover"
            />

            <span v-else class="text-5xl">👤</span>
          </div>

          <div v-if="qrDataUrl" class="rounded-2xl bg-white p-2">
            <img :src="qrDataUrl" alt="QR de acceso del miembro" class="h-36 w-36" />
          </div>
        </div>

        <div class="grid flex-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <p class="text-[var(--color-text-secondary)]">Teléfono</p>
            <p class="font-semibold">{{ member.phone || '—' }}</p>
          </div>

          <div>
            <p class="text-[var(--color-text-secondary)]">Fecha de nacimiento</p>
            <p class="font-semibold">{{ member.birthDate || '—' }}</p>
          </div>

          <div>
            <p class="text-[var(--color-text-secondary)]">Dirección</p>
            <p class="font-semibold">{{ member.address || '—' }}</p>
          </div>

          <div>
            <p class="text-[var(--color-text-secondary)]">Contacto de emergencia</p>
            <p class="font-semibold">
              {{ member.emergencyContactName || '—' }}
              <span v-if="member.emergencyContactPhone" class="text-[var(--color-text-secondary)]">
                · {{ member.emergencyContactPhone }}
              </span>
            </p>
          </div>

          <div>
            <p class="text-[var(--color-text-secondary)]">Fecha de inscripción</p>
            <p class="font-semibold">{{ member.startDate || '—' }}</p>
          </div>

          <div>
            <p class="text-[var(--color-text-secondary)]">Modalidad</p>
            <p class="font-semibold">{{ modalityLabel }}</p>
          </div>

          <div>
            <p class="text-[var(--color-text-secondary)]">Último pago</p>
            <p class="font-semibold">{{ member.lastPaymentDate || '—' }}</p>
          </div>

          <div>
            <p class="text-[var(--color-text-secondary)]">Próximo pago</p>
            <p class="font-semibold">{{ member.nextPaymentDate || '—' }}</p>
          </div>
        </div>
      </div>

      <div v-if="member.notes">
        <p class="text-[var(--color-text-secondary)] text-sm">Información adicional</p>
        <p class="mt-1 whitespace-pre-line">{{ member.notes }}</p>
      </div>

      <div class="space-y-3">
        <h3 class="text-2xl font-bold">Historial de pagos</h3>

        <p v-if="!payments.length" class="text-[var(--color-text-secondary)]">
          Este miembro aún no tiene pagos registrados.
        </p>

        <div
          v-for="payment in payments"
          :key="payment.id"
          class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="font-semibold">${{ payment.amount }} · {{ methodLabels[payment.method] || payment.method }}</p>

            <p class="text-sm text-[var(--color-text-secondary)]">
              Pagado el {{ payment.paidAt }} · Próximo pago {{ payment.nextPaymentDate }}
            </p>
          </div>

          <p v-if="payment.notes" class="text-sm text-[var(--color-text-secondary)]">
            {{ payment.notes }}
          </p>
        </div>
      </div>

      <div class="flex justify-end">
        <BaseButton variant="secondary" @click="emit('close')"> Cerrar </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
