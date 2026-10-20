<script setup>
import { computed, ref } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import MemberRegistrationForm from '@/components/members/MemberRegistrationForm.vue'
import MemberDetailModal from '@/components/members/MemberDetailModal.vue'
import MemberPaymentModal from '@/components/members/MemberPaymentModal.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useMemberStore } from '@/stores/useMemberStore'

import { canManageMembers } from '@/config/permissions'

const authStore = useAuthStore()
const memberStore = useMemberStore()

const canManage = computed(() => canManageMembers(authStore.role))

const activeTab = ref('members')
const search = ref('')
const statusFilter = ref('all')

const detailOpen = ref(false)
const selectedMember = ref(null)

const formOpen = ref(false)
const editingMember = ref(null)
const altasKey = ref(0)

const paymentOpen = ref(false)
const paymentMember = ref(null)

const tabs = computed(() => {
  const items = [{ id: 'members', label: 'Miembros' }]

  if (canManage.value) {
    items.push({ id: 'new', label: 'Altas' })
  }

  items.push({ id: 'inactive', label: 'Bajas' })
  items.push({ id: 'payments', label: 'Pagos' })
  items.push({ id: 'additional', label: 'Info adicional' })

  return items
})

const memberStatus = (member) => {
  if (!member.active) {
    return { label: 'Inactivo', class: 'bg-red-500/15 text-red-400' }
  }

  if (memberStore.isPaymentExpired(member)) {
    return { label: 'Pago vencido', class: 'bg-amber-500/15 text-amber-400' }
  }

  return { label: 'Activo', class: 'bg-emerald-500/15 text-emerald-400' }
}

const matchesSearch = (member) => {
  const query = search.value.trim().toLowerCase()

  if (!query) return true

  return (
    member.name.toLowerCase().includes(query) ||
    member.email.toLowerCase().includes(query) ||
    member.code?.toLowerCase().includes(query) ||
    (member.phone || '').includes(query)
  )
}

const matchesStatus = (member) => {
  if (statusFilter.value === 'active') {
    return member.active && !memberStore.isPaymentExpired(member)
  }

  if (statusFilter.value === 'expired') {
    return member.active && memberStore.isPaymentExpired(member)
  }

  return true
}

const activeMembersList = computed(() => {
  return memberStore.members.filter((member) => member.active && matchesSearch(member) && matchesStatus(member))
})

const inactiveMembersList = computed(() => {
  return memberStore.members.filter((member) => !member.active && matchesSearch(member))
})

const additionalMembersList = computed(() => {
  return [...memberStore.members]
    .filter(matchesSearch)
    .sort((a, b) => a.name.localeCompare(b.name))
})

const paymentList = computed(() => {
  return [...memberStore.payments].sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))
})

const collectedThisMonth = computed(() => memberStore.collectedThisMonth)
const expiredCount = computed(() => memberStore.expiredMembers.length)
const inactiveCount = computed(() => memberStore.inactiveMembers.length)

const methodLabels = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
}

const openDetail = (member) => {
  selectedMember.value = member
  detailOpen.value = true
}

const closeDetail = () => {
  detailOpen.value = false
}

const openCreate = () => {
  altasKey.value += 1
  activeTab.value = 'new'
}

const openEdit = (member) => {
  editingMember.value = member
  formOpen.value = true
}

const closeForm = () => {
  formOpen.value = false
  editingMember.value = null
}

const onCreated = () => {
  altasKey.value += 1
  search.value = ''
  statusFilter.value = 'all'
  activeTab.value = 'members'
}

const onEdited = () => {
  closeForm()
}

const openPayment = (member = null) => {
  paymentMember.value = member
  paymentOpen.value = true
}

const closePayment = () => {
  paymentOpen.value = false
  paymentMember.value = null
}

const deactivate = (member) => {
  if (!canManage.value) return
  if (!confirm(`¿Dar de baja a ${member.name}?`)) return

  memberStore.deactivateMember(member.id)
}

const reactivate = (member) => {
  if (!canManage.value) return

  memberStore.reactivateMember(member.id)
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-4xl font-black">Miembros</h1>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Altas, bajas, pagos y expediente de los miembros del gimnasio.
        </p>
      </div>

      <BaseButton v-if="canManage" @click="openCreate"> Nuevo miembro </BaseButton>
    </div>

    <p
      v-if="!canManage"
      class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 px-4 py-3 text-sm text-[var(--color-text-secondary)]"
    >
      Tienes acceso de solo lectura al módulo de miembros.
    </p>

    <!-- Stats -->
    <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Cuentas activas</p>
        <h3 class="text-4xl font-black mt-3">{{ memberStore.activeMembers.length }}</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Pagos vencidos</p>
        <h3 class="text-4xl font-black mt-3 text-amber-400">{{ expiredCount }}</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Miembros inactivos</p>
        <h3 class="text-4xl font-black mt-3 text-red-400">{{ inactiveCount }}</h3>
      </BaseCard>

      <BaseCard>
        <p class="text-[var(--color-text-secondary)]">Cobrado este mes</p>
        <h3 class="text-4xl font-black mt-3">${{ collectedThisMonth }}</h3>
      </BaseCard>
    </div>

    <!-- Tabs -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="rounded-2xl border px-4 py-2 text-sm font-semibold transition"
        :class="
          activeTab === tab.id
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
            : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
        "
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Members tab -->
    <div v-if="activeTab === 'members'" class="space-y-6">
      <div class="grid gap-4 md:grid-cols-3">
        <BaseInput v-model="search" placeholder="Buscar por nombre, correo, código o teléfono" />

        <select
          v-model="statusFilter"
          class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos y al día</option>
          <option value="expired">Pago vencido</option>
        </select>
      </div>

      <p v-if="!activeMembersList.length" class="text-[var(--color-text-secondary)]">
        No hay miembros que coincidan con el filtro.
      </p>

      <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <BaseCard v-for="member in activeMembersList" :key="member.id">
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div
                class="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center"
              >
                <img
                  v-if="member.photo"
                  :src="member.photo"
                  alt="Foto del miembro"
                  class="h-full w-full object-cover"
                />

                <span v-else class="text-2xl">👤</span>
              </div>

              <div class="min-w-0">
                <h2 class="text-xl font-bold truncate">{{ member.name }}</h2>

                <p class="text-sm text-[var(--color-text-secondary)]">
                  {{ member.code }} · {{ member.email }}
                </p>

                <span
                  class="inline-block mt-2 rounded-full px-2 py-1 text-xs font-semibold"
                  :class="memberStatus(member).class"
                >
                  {{ memberStatus(member).label }}
                </span>
              </div>
            </div>

            <div class="space-y-1 text-sm text-[var(--color-text-secondary)]">
              <p v-if="member.phone">Teléfono: {{ member.phone }}</p>
              <p>Inscripción: {{ member.startDate }}</p>
              <p>
                Próximo pago: {{ member.nextPaymentDate }}
                ({{ member.paymentModality === 'yearly' ? 'Anual' : 'Mensual' }})
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <BaseButton size="sm" variant="secondary" @click="openDetail(member)">
                Ver
              </BaseButton>

              <template v-if="canManage">
                <BaseButton size="sm" variant="secondary" @click="openEdit(member)">
                  Editar
                </BaseButton>

                <BaseButton size="sm" variant="secondary" @click="openPayment(member)">
                  Pago
                </BaseButton>

                <BaseButton size="sm" variant="secondary" @click="deactivate(member)">
                  Baja
                </BaseButton>
              </template>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- New member tab -->
    <div v-else-if="activeTab === 'new' && canManage">
      <BaseCard>
        <MemberRegistrationForm :key="altasKey" @saved="onCreated" @cancel="activeTab = 'members'" />
      </BaseCard>
    </div>

    <!-- Inactive members tab -->
    <div v-else-if="activeTab === 'inactive'" class="space-y-6">
      <BaseInput v-model="search" placeholder="Buscar miembro inactivo" />

      <p v-if="!inactiveMembersList.length" class="text-[var(--color-text-secondary)]">
        No hay miembros dados de baja.
      </p>

      <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <BaseCard v-for="member in inactiveMembersList" :key="member.id">
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div
                class="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-hover)] flex items-center justify-center"
              >
                <img
                  v-if="member.photo"
                  :src="member.photo"
                  alt="Foto del miembro"
                  class="h-full w-full object-cover"
                />

                <span v-else class="text-2xl">👤</span>
              </div>

              <div class="min-w-0">
                <h2 class="text-xl font-bold truncate">{{ member.name }}</h2>

                <p class="text-sm text-[var(--color-text-secondary)]">
                  {{ member.code }} · {{ member.email }}
                </p>

                <span class="inline-block mt-2 rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-400">
                  Inactivo
                </span>
              </div>
            </div>

            <p class="text-sm text-[var(--color-text-secondary)]">
              Alta: {{ member.startDate }} · Último pago: {{ member.lastPaymentDate || '—' }}
            </p>

            <div class="flex flex-wrap gap-2">
              <BaseButton size="sm" variant="secondary" @click="openDetail(member)">
                Ver
              </BaseButton>

              <BaseButton v-if="canManage" size="sm" @click="reactivate(member)">
                Reactivar
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Payments tab -->
    <div v-else-if="activeTab === 'payments'" class="space-y-6">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-2xl font-bold">Pagos de miembros</h2>

          <p class="text-[var(--color-text-secondary)]">
            {{ paymentList.length }} pago(s) registrados en este gimnasio.
          </p>
        </div>

        <BaseButton v-if="canManage" @click="openPayment()"> Registrar pago </BaseButton>
      </div>

      <p v-if="!paymentList.length" class="text-[var(--color-text-secondary)]">
        Aún no hay pagos registrados.
      </p>

      <BaseCard v-for="payment in paymentList" :key="payment.id">
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p class="text-lg font-bold">
              {{ payment.memberName }} · ${{ payment.amount }}
            </p>

            <p class="text-sm text-[var(--color-text-secondary)]">
              {{ methodLabels[payment.method] || payment.method }} · Pagado el {{ payment.paidAt }}
            </p>

            <p v-if="payment.notes" class="text-sm text-[var(--color-text-secondary)]">
              {{ payment.notes }}
            </p>
          </div>

          <div class="text-left md:text-right">
            <p class="text-sm text-[var(--color-text-secondary)]">Próximo pago</p>
            <p class="font-semibold">{{ payment.nextPaymentDate }}</p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Additional info tab -->
    <div v-else-if="activeTab === 'additional'" class="space-y-6">
      <BaseInput v-model="search" placeholder="Buscar miembro por nombre, correo, código o teléfono" />

      <p v-if="!additionalMembersList.length" class="text-[var(--color-text-secondary)]">
        No hay miembros que coincidan con la búsqueda.
      </p>

      <div class="grid gap-6 md:grid-cols-2">
        <BaseCard v-for="member in additionalMembersList" :key="member.id">
          <div class="space-y-4">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h2 class="text-xl font-bold truncate">{{ member.name }}</h2>

                <p class="text-sm text-[var(--color-text-secondary)]">
                  {{ member.code }} · {{ member.email }}
                </p>
              </div>

              <span
                class="shrink-0 rounded-full px-2 py-1 text-xs font-semibold"
                :class="memberStatus(member).class"
              >
                {{ memberStatus(member).label }}
              </span>
            </div>

            <div class="space-y-2 text-sm text-[var(--color-text-secondary)]">
              <p>
                <span class="font-semibold text-[var(--color-text)]">Nacimiento:</span>
                {{ member.birthDate || '—' }}
              </p>

              <p>
                <span class="font-semibold text-[var(--color-text)]">Dirección:</span>
                {{ member.address || '—' }}
              </p>

              <p>
                <span class="font-semibold text-[var(--color-text)]">Emergencia:</span>
                {{ member.emergencyContactName || '—' }}
                <span v-if="member.emergencyContactPhone">
                  · {{ member.emergencyContactPhone }}
                </span>
              </p>
            </div>

            <div>
              <p class="text-sm font-semibold">Notas</p>

              <p class="mt-1 whitespace-pre-line text-sm text-[var(--color-text-secondary)]">
                {{ member.notes || 'Sin notas registradas.' }}
              </p>
            </div>

            <BaseButton size="sm" variant="secondary" @click="openDetail(member)">
              Ver expediente
            </BaseButton>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Detail modal -->
    <MemberDetailModal
      :open="detailOpen"
      :member="selectedMember"
      @close="closeDetail"
    />

    <!-- Edit modal -->
    <BaseModal :open="formOpen" @close="closeForm">
      <div class="space-y-6">
        <h2 class="text-3xl font-black">Editar miembro</h2>

        <MemberRegistrationForm
          :member="editingMember"
          @saved="onEdited"
          @cancel="closeForm"
        />
      </div>
    </BaseModal>

    <!-- Payment modal -->
    <MemberPaymentModal
      :open="paymentOpen"
      :member="paymentMember"
      @close="closePayment"
      @saved="closePayment"
    />
  </div>
</template>
