<script setup>
import { computed, reactive, ref, watch } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useMemberStore } from '@/stores/useMemberStore'
import { usePlanStore } from '@/stores/usePlanStore'
import { useAdminPlanStore } from '@/stores/useAdminPlanStore'
import { addDays, addMonths, addYears, todayISO } from '@/utils/date'

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
const adminPlansStore = useAdminPlanStore()
const saving = ref(false)
// Mostrar únicamente el catálogo administrativo activo cuando exista.
// Si una sucursal aún no tiene planes administrativos, conservar la opción
// de cobro del catálogo de membresías anterior (compatibilidad).
const planOptions = computed(() => {
  if (adminPlansStore.plans.length) {
    return adminPlansStore.activePlans.map((plan) => ({
      key: `admin:${plan.id}`,
      name: plan.name,
      duration: `${plan.durationDays} días`,
      price: plan.price,
    }))
  }
  return plansStore.activePlans.map((plan) => ({
    key: `membership:${plan.id}`,
    name: plan.name,
    duration: plan.billingPeriod === 'yearly'
      ? `${plan.intervalCount || 1} año(s)`
      : `${plan.intervalCount || 1} mes(es)`,
    price: plan.price,
  }))
})

const selectedPlanId = ref('')
const selectedAdminPlan = computed(() =>
  adminPlansStore.activePlans.find((plan) => `admin:${plan.id}` === selectedPlanId.value) || null,
)
const selectedPlan = computed(() =>
  plansStore.activePlans.find((plan) => `membership:${plan.id}` === selectedPlanId.value) || null,
)
const chosenPlan = computed(() => selectedAdminPlan.value || selectedPlan.value)
const validPeriods = computed(() => Number.isInteger(Number(form.periods)) && Number(form.periods) >= 1)

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
  if (!selectedMember.value || !chosenPlan.value || !validPeriods.value) return '—'

  const today = todayISO()
  const base =
    selectedMember.value.nextPaymentDate && selectedMember.value.nextPaymentDate > today
      ? selectedMember.value.nextPaymentDate
      : today
  // Vista previa informativa; el servidor confirma y guarda la fecha real.
  if (selectedAdminPlan.value) {
    return addDays(base, selectedAdminPlan.value.durationDays * Number(form.periods))
  }
  return addPeriods(
    base,
    selectedPlan.value.billingPeriod,
    (selectedPlan.value.intervalCount || 1) * Number(form.periods),
  )
})

const resetForm = () => {
  error.value = ''
  selectedMemberId.value = props.member?.id ? String(props.member.id) : ''
  selectedPlanId.value = planOptions.value[0]?.key || ''
  form.method = 'cash'
  form.periods = 1
  form.notes = ''
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
      adminPlansStore.load().catch(() => {})
    }
  },
  { immediate: true },
)

// La carga es asíncrona: si aparecen planes administrativos, priorizarlos.
watch(planOptions, (options) => {
  if (!props.open || saving.value) return
  if (!options.some((option) => option.key === selectedPlanId.value)) {
    selectedPlanId.value = options[0]?.key || ''
  } else if (options[0]?.key.startsWith('admin:') && !selectedPlanId.value.startsWith('admin:')) {
    selectedPlanId.value = options[0].key
  }
})

const totalAmount = computed(() => {
  return chosenPlan.value && validPeriods.value
    ? Number(chosenPlan.value.price) * Number(form.periods)
    : 0
})

const submit = async () => {
  if (saving.value) return
  error.value = ''
  if (!selectedMemberId.value) {
    error.value = 'Selecciona un miembro'
    return
  }
  if (!chosenPlan.value) {
    error.value = 'Selecciona un plan de membresía.'
    return
  }
  if (!validPeriods.value) {
    error.value = 'Introduce una cantidad válida de periodos.'
    return
  }
  saving.value = true
  try {
    const result = await memberStore.registerPayment(selectedMemberId.value, {
      // Son identificadores de catálogos diferentes; jamás usar uno por el otro.
      ...(selectedAdminPlan.value
        ? { adminPlanId: selectedAdminPlan.value.id }
        : { planId: selectedPlan.value.id }),
      method: form.method,
      periods: form.periods,
      notes: form.notes,
    })
    if (!result.ok) {
      error.value = selectedAdminPlan.value && [400, 422].includes(result.status)
        ? `No se pudo registrar con este plan. Verifica que el servidor acepte adminPlanId. Detalle: ${result.reason}`
        : result.reason
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
  if (saving.value) return
  emit('close')
}
</script>

<template>
  <BaseModal :open="open" @close="close">
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-black sm:text-3xl">Registrar pago</h2>

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
          class="h-14 w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base"
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
            class="h-14 w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base"
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
            class="h-14 w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 text-base"
          >
            <option v-if="!planOptions.length" value="">No hay planes activos</option>
            <option v-for="plan in planOptions" :key="plan.key" :value="plan.key">
              {{ plan.name }} · {{ plan.duration }} · ${{ plan.price }}
            </option>
          </select>
        </div>

        <div>
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Periodos</p>
          <BaseInput v-model="form.periods" type="number" min="1" step="1" placeholder="Periodos" />
        </div>

        <div class="sm:col-span-2">
          <p class="mb-2 text-sm text-[var(--color-text-secondary)]">Notas</p>

          <textarea
            v-model="form.notes"
            rows="3"
            placeholder="Referencia, observaciones..."
            class="w-full min-w-0 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base text-[var(--color-text)] outline-none transition-all placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
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
        <BaseButton variant="secondary" :disabled="saving" @click="close"> Cancelar </BaseButton>

        <BaseButton :disabled="saving || !chosenPlan || !validPeriods" @click="submit">
          {{ saving ? 'Registrando…' : 'Registrar pago' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
