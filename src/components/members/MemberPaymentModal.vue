<script setup>
import { computed, reactive, ref, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useMemberStore } from '@/stores/useMemberStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { addMonths, addYears, todayISO } from '@/utils/date'

const props = defineProps({
  open: Boolean,
  member: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'saved'])

const memberStore = useMemberStore()
const authStore = useAuthStore()

const error = ref('')
const selectedMemberId = ref('')

const form = reactive({
  amount: '',
  method: 'cash',
  periodicity: 'monthly',
  periods: 1,
  paidAt: todayISO(),
  notes: '',
})

const memberOptions = computed(() => memberStore.members)

const selectedMember = computed(() => {
  return memberStore.members.find((member) => String(member.id) === String(selectedMemberId.value)) || null
})

const addPeriods = (dateString, periodicity, periods) => {
  return periodicity === 'yearly'
    ? addYears(dateString, periods)
    : addMonths(dateString, periods)
}

const previewNextPayment = computed(() => {
  if (!selectedMember.value || !form.paidAt) return '—'

  const base =
    selectedMember.value.nextPaymentDate && selectedMember.value.nextPaymentDate > form.paidAt
      ? selectedMember.value.nextPaymentDate
      : form.paidAt

  return addPeriods(base, form.periodicity, Math.max(1, Number(form.periods) || 1))
})

const resetForm = () => {
  error.value = ''
  selectedMemberId.value = props.member?.id ? String(props.member.id) : ''
  form.amount = ''
  form.method = 'cash'
  form.periodicity = props.member?.paymentModality || 'monthly'
  form.periods = 1
  form.paidAt = todayISO()
  form.notes = ''
}

watch(
  () => props.open,
  (open) => {
    if (open) resetForm()
  },
  { immediate: true },
)

watch(selectedMemberId, () => {
  if (selectedMember.value) {
    form.periodicity = selectedMember.value.paymentModality || 'monthly'
  }
})

const submit = () => {
  if (!selectedMemberId.value) {
    error.value = 'Selecciona un miembro'
    return
  }

  if (!form.amount || Number(form.amount) <= 0) {
    error.value = 'Ingresa un monto válido'
    return
  }

  const result = memberStore.registerPayment(selectedMemberId.value, {
    amount: form.amount,
    method: form.method,
    periodicity: form.periodicity,
    periods: form.periods,
    paidAt: form.paidAt,
    notes: form.notes,
    createdBy: authStore.user?.name || 'Sistema',
  })

  if (!result.ok) {
    error.value = result.reason
    return
  }

  emit('saved')
}

const close = () => {
  emit('close')
}
</script>

<template>
  <BaseModal :open="open" @close="close">
    <div class="space-y-6">
      <div>
        <h2 class="text-3xl font-black">Registrar pago</h2>

        <p class="text-[var(--color-text-secondary)] mt-2">
          El próximo pago se calcula automáticamente según la modalidad.
        </p>
      </div>

      <p
        v-if="error"
        class="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
      >
        {{ error }}
      </p>

      <div v-if="!member" class="space-y-2">
        <p class="text-sm text-[var(--color-text-secondary)]">Miembro</p>

        <select
          v-model="selectedMemberId"
          class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <option value="">Selecciona un miembro</option>
          <option v-for="option in memberOptions" :key="option.id" :value="String(option.id)">
            {{ option.name }} · {{ option.code }}
          </option>
        </select>
      </div>

      <div v-else class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
        <p class="font-semibold">{{ member.name }}</p>
        <p class="text-sm text-[var(--color-text-secondary)]">
          {{ member.code }} · Próximo pago actual: {{ member.nextPaymentDate || '—' }}
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <BaseInput v-model="form.amount" type="number" placeholder="Monto *" />

        <div>
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Método de pago</p>

          <select
            v-model="form.method"
            class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
          >
            <option value="cash">Efectivo</option>
            <option value="card">Tarjeta</option>
            <option value="transfer">Transferencia</option>
          </select>
        </div>

        <div>
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Periodicidad</p>

          <select
            v-model="form.periodicity"
            class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
          >
            <option value="monthly">Mensual</option>
            <option value="yearly">Anual</option>
          </select>
        </div>

        <BaseInput v-model="form.periods" type="number" placeholder="Periodos" />

        <div class="sm:col-span-2">
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Fecha de pago</p>
          <BaseInput v-model="form.paidAt" type="date" />
        </div>

        <div class="sm:col-span-2">
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Notas</p>

          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="Referencia, observaciones..."
            class="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] outline-none transition-all focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      <div class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4">
        <p class="text-sm text-[var(--color-text-secondary)]">Nuevo próximo pago</p>
        <p class="text-2xl font-black mt-1">{{ previewNextPayment }}</p>
      </div>

      <div class="flex flex-wrap justify-end gap-3">
        <BaseButton variant="secondary" @click="close"> Cancelar </BaseButton>

        <BaseButton @click="submit"> Registrar pago </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
