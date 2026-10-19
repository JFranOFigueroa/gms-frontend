<script setup>
import { computed, ref, watch } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useUserStore } from '@/stores/useUserStore'
import { useGymsStore } from '@/stores/useGymsStore'

const userStore = useUserStore()
const gymsStore = useGymsStore()

const modalOpen = ref(false)
const editingId = ref(null)

const search = ref('')
const roleFilter = ref('all')

const name = ref('')
const email = ref('')
const phone = ref('')
const role = ref('member')

const startDate = ref('')
const paymentModality = ref('monthly')

const selectedGymIds = ref([])
const defaultGymId = ref(null)

const isMemberForm = computed(() => role.value === 'member')
const isTrainerForm = computed(() => role.value === 'trainer')

const selectedGyms = computed(() => {
  return gymsStore.gyms.filter((gym) => selectedGymIds.value.includes(gym.id))
})

const gymName = (id) => gymsStore.getGymById(id)?.name || 'Gimnasio'

const toggleGymAccess = (gymId) => {
  if (selectedGymIds.value.includes(gymId)) {
    selectedGymIds.value = selectedGymIds.value.filter((id) => id !== gymId)

    if (defaultGymId.value === gymId) {
      defaultGymId.value = selectedGymIds.value[0] ?? null
    }
  } else {
    selectedGymIds.value = [...selectedGymIds.value, gymId]

    if (!defaultGymId.value) {
      defaultGymId.value = gymId
    }
  }
}

watch(role, (value) => {
  if (value === 'trainer' && !selectedGymIds.value.length) {
    selectedGymIds.value = [gymsStore.activeGymId]
    defaultGymId.value = gymsStore.activeGymId
  }
})

const roleLabels = {
  admin: 'Administrador',
  trainer: 'Entrenador',
  member: 'Miembro',
}

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase()

  return userStore.users.filter((user) => {
    const matchesRole = roleFilter.value === 'all' || user.role === roleFilter.value

    const matchesQuery =
      !query ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone || '').includes(query)

    return matchesRole && matchesQuery
  })
})

const resetForm = () => {
  editingId.value = null
  name.value = ''
  email.value = ''
  phone.value = ''
  role.value = 'member'
  startDate.value = ''
  paymentModality.value = 'monthly'
  selectedGymIds.value = []
  defaultGymId.value = null
}

const openCreate = () => {
  resetForm()
  modalOpen.value = true
}

const openEdit = (user) => {
  editingId.value = user.id
  name.value = user.name
  email.value = user.email
  phone.value = user.phone || ''
  role.value = user.role
  startDate.value = user.startDate || ''
  paymentModality.value = user.paymentModality || 'monthly'

  if (user.role === 'trainer') {
    selectedGymIds.value = user.gymIds?.length
      ? [...user.gymIds]
      : user.gymId
        ? [user.gymId]
        : []
    defaultGymId.value = user.defaultGymId || selectedGymIds.value[0] || null
  } else {
    selectedGymIds.value = []
    defaultGymId.value = null
  }

  modalOpen.value = true
}

const saveUser = () => {
  if (!name.value.trim() || !email.value.trim()) return

  const payload = {
    name: name.value.trim(),
    email: email.value.trim(),
    phone: phone.value.trim(),
    role: role.value,
    startDate: isMemberForm.value ? startDate.value : null,
    paymentModality: isMemberForm.value ? paymentModality.value : null,
  }

  if (isTrainerForm.value) {
    const gymIds = selectedGymIds.value.length
      ? [...selectedGymIds.value]
      : [gymsStore.activeGymId]

    payload.gymIds = gymIds
    payload.defaultGymId = gymIds.includes(defaultGymId.value) ? defaultGymId.value : gymIds[0]
  }

  if (editingId.value) {
    userStore.updateUser(editingId.value, payload)
  } else {
    userStore.addUser(payload)
  }

  modalOpen.value = false
  resetForm()
}

const deleteUser = (id) => {
  if (!confirm('¿Eliminar este usuario?')) return

  userStore.removeUser(id)
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-4xl font-black">Usuarios</h1>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Administra miembros y entrenadores
        </p>
      </div>

      <BaseButton @click="openCreate"> Nuevo usuario </BaseButton>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <BaseInput v-model="search" placeholder="Buscar por nombre, correo o teléfono" />

      <select v-model="roleFilter" class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <option value="all">Todos los roles</option>
        <option value="admin">Administradores</option>
        <option value="trainer">Entrenadores</option>
        <option value="member">Miembros</option>
      </select>
    </div>

    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="user in filteredUsers" :key="user.id">
        <div class="space-y-4">
          <div>
            <h2 class="text-2xl font-bold">
              {{ user.name }}
            </h2>

            <p class="text-[var(--color-text-secondary)] mt-1">
              {{ roleLabels[user.role] || user.role }}
            </p>
          </div>

          <div class="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <p>{{ user.email }}</p>

            <p v-if="user.phone">{{ user.phone }}</p>

            <p>Estado: {{ user.active ? 'Activo' : 'Inactivo' }}</p>

            <p v-if="user.role === 'member' && user.nextPaymentDate">
              Próximo pago: {{ user.nextPaymentDate }} ({{ user.paymentModality === 'yearly' ? 'Anual' : 'Mensual' }})
            </p>

            <p v-if="user.role === 'trainer' && user.gymIds?.length">
              Gimnasios: {{ user.gymIds.map(gymName).join(', ') }}
            </p>

            <p v-if="user.role === 'trainer' && user.defaultGymId">
              Gimnasio por defecto: {{ gymName(user.defaultGymId) }}
            </p>
          </div>

          <div v-if="user.role !== 'admin'" class="flex flex-wrap gap-3">
            <BaseButton variant="secondary" @click="openEdit(user)"> Editar </BaseButton>

            <BaseButton variant="secondary" @click="userStore.toggleActive(user.id)">
              {{ user.active ? 'Desactivar' : 'Activar' }}
            </BaseButton>

            <BaseButton variant="secondary" @click="deleteUser(user.id)"> Eliminar </BaseButton>
          </div>

          <p v-else class="text-sm text-[var(--color-text-secondary)]">
            Usuario administrador: solo lectura
          </p>
        </div>
      </BaseCard>
    </div>

    <BaseModal :open="modalOpen" @close="modalOpen = false">
      <div class="space-y-6">
        <h2 class="text-3xl font-black">
          {{ editingId ? 'Editar usuario' : 'Nuevo usuario' }}
        </h2>

        <BaseInput v-model="name" placeholder="Nombre completo" />

        <BaseInput v-model="email" type="email" placeholder="Correo" />

        <BaseInput v-model="phone" placeholder="Teléfono" />

        <select v-model="role" class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <option value="member">Miembro</option>
          <option value="trainer">Entrenador</option>
          <option value="admin">Administrador</option>
        </select>

        <div v-if="isMemberForm" class="grid gap-4">
          <BaseInput v-model="startDate" type="date" placeholder="Fecha de ingreso" />

          <select v-model="paymentModality" class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <option value="monthly">Mensualidad</option>
            <option value="yearly">Anualidad</option>
          </select>
        </div>

        <div v-if="isTrainerForm" class="grid gap-4">
          <div>
            <p class="mb-2 text-[var(--color-text-secondary)]">Gimnasios con acceso</p>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-for="gym in gymsStore.gyms"
                :key="gym.id"
                type="button"
                class="rounded-2xl border p-3 text-left transition"
                :class="
                  selectedGymIds.includes(gym.id)
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border)]'
                "
                @click="toggleGymAccess(gym.id)"
              >
                <p class="font-semibold">{{ gym.name }}</p>

                <p class="text-xs text-[var(--color-text-secondary)]">{{ gym.shortName }}</p>
              </button>
            </div>
          </div>

          <div>
            <p class="mb-2 text-[var(--color-text-secondary)]">Gimnasio por defecto</p>

            <select
              v-model="defaultGymId"
              class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <option v-for="gym in selectedGyms" :key="gym.id" :value="gym.id">
                {{ gym.name }}
              </option>
            </select>
          </div>
        </div>

        <BaseButton class="w-full" @click="saveUser">
          Guardar usuario
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>