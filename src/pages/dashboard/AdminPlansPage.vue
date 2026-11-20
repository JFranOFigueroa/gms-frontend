<script setup>
import { computed, ref, watch } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useAdminPlanStore } from '@/stores/useAdminPlanStore'
import { useBranchesStore } from '@/stores/useBranchesStore'

const store = useAdminPlanStore()
const branches = useBranchesStore()
const open = ref(false)
const editingId = ref(null)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const name = ref('')
const description = ref('')
const price = ref('')
const durationDays = ref(30)
const isActive = ref(true)
const filter = ref('all')

const filteredPlans = computed(() =>
  store.plans.filter(
    (plan) =>
      filter.value === 'all' || (filter.value === 'active' ? plan.isActive : !plan.isActive),
  ),
)
const money = (value) =>
  '$' +
  new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(value),
  )

const reset = () => {
  editingId.value = null
  name.value = ''
  description.value = ''
  price.value = ''
  durationDays.value = 30
  isActive.value = true
  error.value = ''
}
const openCreate = () => {
  reset()
  open.value = true
}
const openEdit = (plan) => {
  reset()
  editingId.value = plan.id
  name.value = plan.name
  description.value = plan.description || ''
  price.value = String(plan.price)
  durationDays.value = plan.durationDays
  isActive.value = plan.isActive
  open.value = true
}
const close = () => {
  if (!saving.value) {
    open.value = false
    reset()
  }
}

const save = async () => {
  if (saving.value) return
  error.value = ''
  const title = name.value.trim()
  const amount = Number(price.value)
  const days = Number(durationDays.value)
  if (!title || title.length > 120) {
    error.value = 'El nombre debe tener entre 1 y 120 caracteres.'
    return
  }
  if (description.value.length > 1000) {
    error.value = 'La descripción no debe superar 1000 caracteres.'
    return
  }
  if (
    !String(price.value).trim() ||
    !Number.isFinite(amount) ||
    amount < 0 ||
    !/^\d+(?:\.\d{1,2})?$/.test(String(price.value).trim())
  ) {
    error.value = 'Ingresa un precio válido con máximo dos decimales.'
    return
  }
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    error.value = 'La duración debe estar entre 1 y 3650 días.'
    return
  }
  saving.value = true
  const branch = branches.activeBranchId
  try {
    const payload = {
      name: title,
      description: description.value.trim(),
      price: amount,
      durationDays: days,
      isActive: isActive.value,
    }
    if (editingId.value) await store.updatePlan(editingId.value, payload)
    else await store.createPlan(payload)
    if (branch !== branches.activeBranchId) return
    notice.value = editingId.value ? 'Plan actualizado.' : 'Plan creado.'
    open.value = false
    reset()
  } catch (e) {
    error.value = e.message || 'No fue posible guardar el plan.'
  } finally {
    saving.value = false
  }
}

const toggleActive = async (plan) => {
  error.value = ''
  try {
    await store.updatePlan(plan.id, { isActive: !plan.isActive })
    notice.value = 'Estado actualizado.'
  } catch (e) {
    error.value = e.message
  }
}
const remove = async (plan) => {
  if (
    !window.confirm(
      `¿Eliminar el plan “${plan.name}”? No aparecerá en el catálogo y no se podrá recuperar desde esta pantalla.`,
    )
  )
    return
  error.value = ''
  try {
    await store.removePlan(plan.id)
    notice.value = 'Plan eliminado.'
  } catch (e) {
    error.value = e.message
  }
}

watch(
  () => branches.activeBranchId,
  () => {
    open.value = false
    reset()
    filter.value = 'all'
    notice.value = ''
    if (branches.activeBranchId) store.load().catch(() => {})
  },
)
</script>

<template>
  <section class="space-y-5" aria-label="Planes administrativos">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-2xl font-black">Planes de la sucursal</h2>
        <p class="mt-1 text-sm text-[var(--color-text-secondary)]">
          Administra nombre, precio, duración y disponibilidad del catálogo.
        </p>
      </div>
      <BaseButton @click="openCreate">+ Crear plan</BaseButton>
    </div>
    <p class="text-sm text-[var(--color-text-secondary)]">
      Estos planes son administrativos: no generan pagos ni asignan membresías automáticamente.
    </p>
    <div class="flex flex-wrap gap-3 items-center">
      <label for="plan-status" class="text-sm">Mostrar</label>
      <select
        id="plan-status"
        v-model="filter"
        class="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5"
      >
        <option value="all">Todos los planes</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>
    <p v-if="store.error" role="alert" class="text-red-400">
      {{ store.error }}
      <button type="button" class="underline" @click="store.load().catch(() => {})">
        Reintentar
      </button>
    </p>
    <p v-if="error && !open" role="alert" class="text-red-400">{{ error }}</p>
    <p v-if="notice" role="status" class="text-emerald-400">{{ notice }}</p>
    <p v-if="store.loading" class="text-[var(--color-text-secondary)]">Cargando planes…</p>
    <p
      v-else-if="!filteredPlans.length"
      class="rounded-2xl border border-[var(--color-border)] p-6 text-[var(--color-text-secondary)]"
    >
      No hay planes que coincidan con el filtro.
    </p>
    <div v-else class="overflow-x-auto rounded-2xl border border-[var(--color-border)]">
      <table class="w-full min-w-[600px] text-left text-sm">
        <thead class="bg-[var(--color-surface-hover)]">
          <tr>
            <th scope="col" class="p-4">Nombre</th>
            <th scope="col" class="p-4">Precio</th>
            <th scope="col" class="p-4">Duración</th>
            <th scope="col" class="p-4">Estado</th>
            <th scope="col" class="p-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="plan in filteredPlans"
            :key="plan.id"
            class="border-t border-[var(--color-border)]"
          >
            <td class="p-4">
              <strong>{{ plan.name }}</strong>
              <p v-if="plan.description" class="mt-1 max-w-xs text-[var(--color-text-secondary)]">
                {{ plan.description }}
              </p>
            </td>
            <td class="p-4 font-semibold">{{ money(plan.price) }}</td>
            <td class="p-4">{{ plan.durationDays }} días</td>
            <td class="p-4">
              <span :class="plan.isActive ? 'text-emerald-400' : 'text-amber-400'">{{
                plan.isActive ? 'Activo' : 'Inactivo'
              }}</span>
            </td>
            <td class="p-4">
              <div class="flex flex-wrap gap-2">
                <BaseButton size="sm" variant="secondary" @click="openEdit(plan)"
                  >Editar</BaseButton
                >
                <BaseButton size="sm" variant="secondary" @click="toggleActive(plan)">{{
                  plan.isActive ? 'Desactivar' : 'Activar'
                }}</BaseButton>
                <BaseButton size="sm" variant="secondary" @click="remove(plan)"
                  >Eliminar</BaseButton
                >
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <BaseModal :open="open" @close="close">
      <form class="space-y-4" @submit.prevent="save">
        <h3 class="text-2xl font-black">{{ editingId ? 'Editar plan' : 'Crear plan' }}</h3>
        <label class="block space-y-2"
          ><span>Nombre *</span
          ><input
            v-model="name"
            maxlength="120"
            required
            class="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            placeholder="Ej. Mensualidad general"
        /></label>
        <label class="block space-y-2"
          ><span>Descripción</span
          ><textarea
            v-model="description"
            maxlength="1000"
            rows="3"
            class="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
            placeholder="Qué incluye el plan"
          />
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-2"
            ><span>Precio *</span
            ><input
              v-model="price"
              type="number"
              required
              min="0"
              step="0.01"
              class="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          /></label>
          <label class="block space-y-2"
            ><span>Duración en días *</span
            ><input
              v-model.number="durationDays"
              type="number"
              required
              min="1"
              max="3650"
              step="1"
              class="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          /></label>
        </div>
        <label class="flex items-center gap-3"
          ><input v-model="isActive" type="checkbox" /> Plan activo</label
        >
        <p v-if="error" role="alert" class="text-sm text-red-400">{{ error }}</p>
        <div class="flex justify-end gap-3">
          <BaseButton type="button" variant="secondary" :disabled="saving" @click="close"
            >Cancelar</BaseButton
          ><BaseButton type="submit" :disabled="saving">{{
            saving ? 'Guardando…' : 'Guardar plan'
          }}</BaseButton>
        </div>
      </form>
    </BaseModal>
  </section>
</template>
