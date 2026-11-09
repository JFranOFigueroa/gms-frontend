<script setup>
import { computed, reactive, ref, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useMemberStore } from '@/stores/useMemberStore'
import { usePlanStore } from '@/stores/usePlanStore'
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
const plansStore = usePlanStore()
const saving = ref(false)
const selectedPlanId = ref('')
const selectedPlan = computed(
  () => plansStore.activePlans.find((p) => String(p.id) === String(selectedPlanId.value)) || null,
)

const error = ref('')
const selectedMemberId = ref('')

const form = reactive({
  method: 'cash',
  periods: 1,
  notes: '',
})

const memberOptions = computed(() => memberStore.members)

const selectedMember = computed(() => {
  return (
    memberStore.members.find((member) => String(member.id) === String(selectedMemberId.value)) ||
    null
  )
})

const addPeriods = (dateString, periodicity, periods) => {
  return periodicity === 'yearly' ? addYears(dateString, periods) : addMonths(dateString, periods)
}

const previewNextPayment = computed(() => {
  if (!selectedMember.value || !selectedPlan.value) return '—'

  const today = todayISO()
  const base =
    selectedMember.value.nextPaymentDate && selectedMember.value.nextPaymentDate > today
      ? selectedMember.value.nextPaymentDate
      : today
  return addPeriods(
    base,
    selectedPlan.value.billingPeriod,
    (selectedPlan.value.intervalCount || 1) * Math.max(1, Number(form.periods) || 1),
  )
})

const resetForm = () => {
  error.value = ''
  selectedMemberId.value = props.member?.id ? String(props.member.id) : ''
  selectedPlanId.value =
    plansStore.activePlans.find((p) => p.billingPeriod === props.member?.paymentModality)?.id ||
    plansStore.activePlans[0]?.id ||
    ''
  form.method = 'cash'
  form.periods = 1
  form.notes = ''
}

watch(
  () => props.open,
  (open) => {
    if (open) resetForm()
  },
  { immediate: true },
)

const totalAmount = computed(() =>
  selectedPlan.value
    ? Number(selectedPlan.value.price) * Math.max(1, Number(form.periods) || 1)
    : 0,
)

const submit = async () => {
  error.value = ''
  if (!selectedMemberId.value) {
    error.value = 'Selecciona un miembro'
    return
  }
  if (!selectedPlan.value) {
    error.value = 'Selecciona un plan de membresía'
    return
  }
  saving.value = true
  try {
    const result = await memberStore.registerPayment(selectedMemberId.value, {
      planId: selectedPlan.value.id,
      method: form.method,
      periods: form.periods,
      notes: form.notes,
    })
    if (!result.ok) {
      error.value = result.reason
      return
    }
    emit('saved')
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
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
          El importe y el próximo vencimiento se determinan según el plan elegido.
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

      <div
        v-else
        class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4"
      >
        <p class="font-semibold">{{ member.name }}</p>
        <p class="text-sm text-[var(--color-text-secondary)]">
          {{ member.code }} · Próximo pago actual: {{ member.nextPaymentDate || '—' }}
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="p-4 rounded-2xl border border-[var(--color-border)]">
          <p class="text-sm text-[var(--color-text-secondary)]">Monto calculado</p>
          <p class="font-bold">${{ totalAmount.toFixed(2) }}</p>
        </div>

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
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Plan de membresía</p>
          <select
            v-model="selectedPlanId"
            class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
          >
            <option value="">Selecciona un plan</option>
            <option v-for="plan in plansStore.activePlans" :key="plan.id" :value="plan.id">
              {{ plan.name }} · {{ plan.billingPeriod === 'yearly' ? 'Anual' : 'Mensual' }} · ${{
                plan.price
              }}
            </option>
          </select>
        </div>

        <BaseInput v-model="form.periods" type="number" placeholder="Periodos" />

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
        <p class="text-sm text-[var(--color-text-secondary)]">
          Próximo pago estimado (confirmado por servidor al registrar)
        </p>
        <p class="text-2xl font-black mt-1">{{ previewNextPayment }}</p>
      </div>

      <div class="flex flex-wrap justify-end gap-3">
        <BaseButton variant="secondary" @click="close"> Cancelar </BaseButton>

        <BaseButton :disabled="saving || !selectedPlan" @click="submit">
          {{ saving ? 'Registrando…' : 'Registrar pago' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
