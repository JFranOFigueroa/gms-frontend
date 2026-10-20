<script setup>
import { computed, ref, watch } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore } from '@/stores/useUserStore'
import { useMemberStore } from '@/stores/useMemberStore'
import { useGymsStore } from '@/stores/useGymsStore'

import {
  ROLE_LABELS,
  assignableRoles,
  canEditStaffRole,
} from '@/config/permissions'

const authStore = useAuthStore()
const userStore = useUserStore()
const memberStore = useMemberStore()
const gymsStore = useGymsStore()

const modalOpen = ref(false)
const editingId = ref(null)
const formError = ref('')

const search = ref('')
const roleFilter = ref('all')

const name = ref('')
const email = ref('')
const phone = ref('')
const role = ref('trainer')

const selectedGymIds = ref([])
const defaultGymId = ref(null)

const actorRole = computed(() => authStore.role)
const availableRoles = computed(() => assignableRoles(actorRole.value))
const canCreate = computed(() => availableRoles.value.length > 0)

const isGymScopedForm = computed(() => ['owner', 'trainer'].includes(role.value))

const selectedGyms = computed(() => {
  return gymsStore.gyms.filter((gym) => selectedGymIds.value.includes(gym.id))
})

const assignableGyms = computed(() => {
  if (authStore.role === 'admin') return gymsStore.gyms

  const allowedIds = authStore.user?.gymIds

  if (!allowedIds?.length) {
    return gymsStore.gyms.filter((gym) => gym.id === gymsStore.activeGymId)
  }

  return gymsStore.gyms.filter((gym) => allowedIds.includes(gym.id))
})

const gymName = (id) => gymsStore.getGymById(id)?.name || 'Gimnasio'

const canEditUser = (user) => canEditStaffRole(actorRole.value, user.role)

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

watch(
  availableRoles,
  (roles) => {
    if (!roles.includes(role.value)) {
      role.value = roles[0] || ''
    }
  },
  { immediate: true },
)

watch(role, (value) => {
  if (value === 'owner' || value === 'trainer') {
    if (!selectedGymIds.value.length) {
      selectedGymIds.value = [gymsStore.activeGymId]
      defaultGymId.value = gymsStore.activeGymId
    }
  } else {
    selectedGymIds.value = []
    defaultGymId.value = null
  }
})

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase()

  return userStore.users.filter((user) => {
    if (actorRole.value === 'owner' && user.role === 'admin') return false

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
  role.value = availableRoles.value[0] || ''
  selectedGymIds.value = []
  defaultGymId.value = null
  formError.value = ''
}

const openCreate = () => {
  resetForm()
  role.value = availableRoles.value[0] || 'trainer'
  selectedGymIds.value = [gymsStore.activeGymId]
  defaultGymId.value = gymsStore.activeGymId
  modalOpen.value = true
}

const openEdit = (user) => {
  if (!canEditUser(user)) return

  formError.value = ''
  editingId.value = user.id
  name.value = user.name
  email.value = user.email
  phone.value = user.phone || ''
  role.value = user.role

  if (user.role === 'owner' || user.role === 'trainer') {
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
  formError.value = ''

  const normalizedEmail = email.value.trim().toLowerCase()

  if (!name.value.trim()) {
    formError.value = 'El nombre completo es obligatorio'
    return
  }

  if (!normalizedEmail) {
    formError.value = 'El correo es obligatorio'
    return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    formError.value = 'Ingresa un correo válido'
    return
  }

  const duplicate = userStore.allUsers.find((user) => {
    return (
      user.email.toLowerCase() === normalizedEmail &&
      String(user.id) !== String(editingId.value)
    )
  })

  if (duplicate) {
    formError.value = 'Ya existe un usuario con ese correo'
    return
  }

  if (memberStore.findByEmail(normalizedEmail)) {
    formError.value = 'Ese correo ya pertenece a un miembro'
    return
  }

  const payload = {
    name: name.value.trim(),
    email: normalizedEmail,
    phone: phone.value.trim(),
    role: role.value,
  }

  if (isGymScopedForm.value) {
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

const deleteUser = (user) => {
  if (!canEditUser(user)) return

  if (!confirm(`¿Eliminar a ${user.name}?`)) return

  userStore.removeUser(user.id)
}

const toggleActive = (user) => {
  if (!canEditUser(user)) return

  userStore.toggleActive(user.id)
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-4xl font-black">Usuarios</h1>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Gestiona propietarios y entrenadores. Los miembros se administran en su módulo propio.
        </p>
      </div>

      <BaseButton v-if="canCreate" @click="openCreate"> Nuevo usuario </BaseButton>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <BaseInput v-model="search" placeholder="Buscar por nombre, correo o teléfono" />

      <select
        v-model="roleFilter"
        class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
      >
        <option value="all">Todos los roles</option>
        <option v-if="actorRole === 'admin'" value="admin">Administradores GMS</option>
        <option value="owner">Propietarios</option>
        <option value="trainer">Entrenadores</option>
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
              {{ ROLE_LABELS[user.role] || user.role }}
            </p>
          </div>

          <div class="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <p>{{ user.email }}</p>

            <p v-if="user.phone">{{ user.phone }}</p>

            <p>Estado: {{ user.active ? 'Activo' : 'Inactivo' }}</p>

            <p v-if="['owner', 'trainer'].includes(user.role) && user.gymIds?.length">
              Gimnasios: {{ user.gymIds.map(gymName).join(', ') }}
            </p>

            <p v-if="['owner', 'trainer'].includes(user.role) && user.defaultGymId">
              Gimnasio por defecto: {{ gymName(user.defaultGymId) }}
            </p>
          </div>

          <div v-if="canEditUser(user)" class="flex flex-wrap gap-3">
            <BaseButton variant="secondary" @click="openEdit(user)"> Editar </BaseButton>

            <BaseButton variant="secondary" @click="toggleActive(user)">
              {{ user.active ? 'Desactivar' : 'Activar' }}
            </BaseButton>

            <BaseButton variant="secondary" @click="deleteUser(user)"> Eliminar </BaseButton>
          </div>

          <p v-else class="text-sm text-[var(--color-text-secondary)]">
            {{
              user.role === 'admin'
                ? 'Usuario administrador GMS: solo lectura'
                : 'Solo el administrador GMS puede modificar propietarios'
            }}
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

        <select
          v-model="role"
          class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <option v-for="option in availableRoles" :key="option" :value="option">
            {{ ROLE_LABELS[option] }}
          </option>
        </select>

        <div v-if="isGymScopedForm" class="grid gap-4">
          <div>
            <p class="mb-2 text-[var(--color-text-secondary)]">Gimnasios con acceso</p>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-for="gym in assignableGyms"
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

        <p
          v-if="formError"
          class="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {{ formError }}
        </p>

        <BaseButton class="w-full" @click="saveUser">
          Guardar usuario
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
