<script setup>
import { computed, ref, watch } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import GlobalAccountsPanel from '@/components/dashboard/GlobalAccountsPanel.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore, OwnerLinkPendingError } from '@/stores/useUserStore'
import { useMemberStore } from '@/stores/useMemberStore'
import { useGymsStore } from '@/stores/useGymsStore'
import { api } from '@/api/service'

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
const notice = ref('')
const mode = ref('create') // create o link: la búsqueda nunca bloquea el alta nueva.
const submitting = ref(false)
const lookingUp = ref(false)
const foundAccount = ref(null)
const pendingOwnerLink = ref(null) // {userId, gymId} solo en memoria.


const search = ref('')
const roleFilter = ref('all')

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const role = ref('trainer')

const selectedGymIds = ref([])
const defaultGymId = ref(null)

const actorRole = computed(() => authStore.role)
const availableRoles = computed(() => assignableRoles(actorRole.value)
  .filter((value) => value !== 'owner' || authStore.user?.platformAdmin === true))
const canCreate = computed(() => availableRoles.value.length > 0)

const isGymScopedForm = computed(() => ['owner', 'trainer'].includes(role.value))

const selectedGyms = computed(() => {
  return gymsStore.gyms.filter((gym) => selectedGymIds.value.includes(gym.id))
})

const assignableGyms = computed(() => {
  if (authStore.role === 'admin') return gymsStore.gyms.filter(g => g.id === gymsStore.activeGymId)

  const allowedIds = authStore.user?.gymIds

  if (!allowedIds?.length) {
    return gymsStore.gyms.filter((gym) => gym.id === gymsStore.activeGymId)
  }

  return gymsStore.gyms.filter((gym) => allowedIds.includes(gym.id) && gym.id === gymsStore.activeGymId)
})

const gymName = (id) => gymsStore.getGymById(id)?.name || 'Gimnasio'

const canEditUser = (user) => (user.roles?.length ? user.roles : [user.role])
  .every((assignedRole) => canEditStaffRole(actorRole.value, assignedRole) &&
    (assignedRole !== 'owner' || authStore.user?.platformAdmin === true))

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
    if (actorRole.value === 'owner' && (user.roles || [user.role]).includes('admin')) return false

    const matchesRole = roleFilter.value === 'all' || (user.roles || [user.role]).includes(roleFilter.value)

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
  password.value = ''
  role.value = availableRoles.value[0] || ''
  selectedGymIds.value = []
  defaultGymId.value = null
  formError.value = ''
  mode.value = 'create'
  foundAccount.value = null
  pendingOwnerLink.value = null
}

const closeUserModal = () => {
  if (submitting.value) return
  modalOpen.value = false
  resetForm() // Borrar la contraseña incluso si se cierra sin guardar.
}

const setMode = (next) => {
  if (submitting.value || pendingOwnerLink.value) return
  mode.value = next
  foundAccount.value = null
  password.value = ''
  formError.value = ''
}

const userError = (error) => {
  if (error?.status === 409) return 'El correo ya tiene una cuenta o existe un vínculo. Usa “Vincular cuenta existente” si corresponde.'
  if (error?.status === 403) return 'No tienes permiso para esta operación o el registro de cuentas no está habilitado en el servidor.'
  if (error?.status === 404) return 'No se encontró una cuenta con ese correo.'
  if (error?.status === 400) return 'Revisa los datos ingresados y vuelve a intentarlo.'
  return error?.message || 'No se pudo completar la operación.'
}

const findExistingAccount = async () => {
  if (submitting.value || lookingUp.value || pendingOwnerLink.value) return
  formError.value = ''
  foundAccount.value = null
  const contact = email.value.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
    formError.value = 'Escribe un correo válido para buscar.'
    return
  }
  lookingUp.value = true
  try {
    const gym = gymsStore.activeGymId
    if (!gym) throw new Error('Selecciona primero un gimnasio.')
    // El owner solo puede buscar cuentas en su gimnasio. Admin global: búsqueda global.
    const result = await api.users.search(contact, authStore.user?.platformAdmin ? undefined : gym)
    if (result?.status !== 'active') throw new Error('Esta cuenta no está activa.')
    foundAccount.value = result
  } catch (error) {
    formError.value = userError(error)
  } finally { lookingUp.value = false }
}

const openCreate = () => {
  resetForm()
  notice.value = ''
  role.value = availableRoles.value.includes('trainer') ? 'trainer' : availableRoles.value[0]
  selectedGymIds.value = [gymsStore.activeGymId]
  defaultGymId.value = gymsStore.activeGymId
  modalOpen.value = true
}

const openEdit = (user) => {
  if (!canEditUser(user)) return

  resetForm()
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

const saveUser = async () => {
  if (submitting.value || lookingUp.value) return
  formError.value = ''
  submitting.value = true
  try {
    if (editingId.value) {
      await userStore.updateUser(editingId.value, {role: role.value})
    } else {
      const gym = gymsStore.activeGymId
      if (!gym || !selectedGymIds.value.includes(gym))
        throw new Error('Selecciona el gimnasio en el que deseas registrar a esta persona.')
      if (!availableRoles.value.includes(role.value))
        throw new Error('No tienes permiso para asignar este rol.')
      if (pendingOwnerLink.value) {
        if (pendingOwnerLink.value.gymId !== gym)
          throw new Error('Selecciona el gimnasio donde quedó pendiente la asignación.')
        await userStore.linkStaff(pendingOwnerLink.value.userId, 'owner', gym)
        pendingOwnerLink.value = null
      } else if (mode.value === 'link') {
        if (!foundAccount.value || foundAccount.value.email?.toLowerCase() !== email.value.trim().toLowerCase())
          throw new Error('Busca y confirma primero la cuenta que deseas vincular.')
        if (foundAccount.value.status !== 'active') throw new Error('Esta cuenta no está activa.')
        await userStore.linkStaff(foundAccount.value.id, role.value, gym)
      } else {
        if (!name.value.trim() || name.value.trim().length > 250 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
          throw new Error('Nombre (máximo 250 caracteres) y correo válido son obligatorios.')
        if (password.value.length < 10 || password.value.length > 200)
          throw new Error('La contraseña debe tener entre 10 y 200 caracteres.')
        const data = {name:name.value.trim(),email:email.value.trim().toLowerCase(),
          phone:phone.value.trim(),password:password.value}
        if (role.value === 'trainer') await userStore.registerTrainer(data,gym)
        else if (role.value === 'owner' && authStore.user?.platformAdmin === true)
          await userStore.registerOwner(data,gym)
        else throw new Error('No tienes permiso para registrar este rol.')
      }
    }
    notice.value = editingId.value ? 'Usuario actualizado correctamente.' : 'Usuario agregado correctamente.'
    modalOpen.value = false
    resetForm()
  } catch(error) {
    if (error instanceof OwnerLinkPendingError) {
      pendingOwnerLink.value = {userId:error.userId,gymId:error.gymId}
      password.value = ''
      formError.value = error.message
    } else {
      formError.value = userError(error)
    }
  } finally { submitting.value = false }
}

const deleteUser = async (user) => {
  if (!canEditUser(user)) return

  if (!confirm(`¿Eliminar a ${user.name}?`)) return

  try { await userStore.removeUser(user.id) }
  catch(error) { formError.value = error.message; alert(error.message) }
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

    <p v-if="notice" role="status" class="text-sm text-emerald-400">{{ notice }}</p>
    <GlobalAccountsPanel v-if="authStore.user?.platformAdmin" />

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
              {{ (user.roles?.length ? user.roles : [user.role]).map(r => ROLE_LABELS[r] || r).join(', ') }}
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

            <BaseButton variant="secondary" disabled title="Activación global pendiente de definir" @click="toggleActive(user)">
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

    <BaseModal :open="modalOpen" @close="closeUserModal">
      <div class="space-y-6">
        <h2 class="text-3xl font-black">
          {{ editingId ? 'Editar usuario' : 'Nuevo usuario' }}
        </h2>

        <div v-if="!editingId" class="flex flex-wrap gap-3">
          <BaseButton type="button" :variant="mode === 'create' ? 'primary' : 'secondary'" :disabled="!!pendingOwnerLink || submitting" @click="setMode('create')">Crear nuevo usuario</BaseButton>
          <BaseButton type="button" :variant="mode === 'link' ? 'primary' : 'secondary'" :disabled="!!pendingOwnerLink || submitting" @click="setMode('link')">Vincular cuenta existente</BaseButton>
        </div>

        <BaseInput v-if="editingId || mode === 'create'" v-model="name" name="gym_staff_full_name" autocomplete="off" placeholder="Nombre completo" :disabled="!!editingId || submitting || !!pendingOwnerLink" />

        <BaseInput v-model="email" name="gym_staff_contact_email" type="email" autocomplete="off" placeholder="Correo" :disabled="!!editingId || submitting || !!pendingOwnerLink" @update:modelValue="foundAccount = null" />

        <BaseInput v-if="editingId || mode === 'create'" v-model="phone" name="gym_staff_contact_phone" type="tel" inputmode="tel" autocomplete="off" placeholder="Teléfono" :disabled="!!editingId || submitting || !!pendingOwnerLink" />
        <BaseInput v-if="!editingId && mode === 'create' && !pendingOwnerLink" v-model="password" name="gym_staff_new_password" autocomplete="new-password" type="password" placeholder="Contraseña (mín. 10 caracteres)" :disabled="submitting" />
        <div v-if="!editingId && mode === 'link'" class="space-y-2">
          <BaseButton type="button" variant="secondary" :disabled="lookingUp || submitting" @click="findExistingAccount">{{ lookingUp ? 'Buscando…' : 'Buscar cuenta por correo' }}</BaseButton>
          <p v-if="foundAccount" class="rounded-2xl border border-[var(--color-border)] p-3 text-sm">Cuenta encontrada: <strong>{{ foundAccount.fullName || foundAccount.name || foundAccount.email }}</strong> · {{ foundAccount.email }}</p>
        </div>

        <select
          v-model="role"
          :disabled="submitting || !!pendingOwnerLink"
          class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
        >
          <option v-for="option in availableRoles" :key="option" :value="option">
            {{ ROLE_LABELS[option] }}
          </option>
        </select>

        <p class="text-sm text-[var(--color-text-secondary)]" v-if="!editingId && mode === 'create'">Los entrenadores y propietarios nuevos se registran en el gimnasio seleccionado. Para vincular una cuenta ya creada, usa “Vincular cuenta existente”.</p>
        <p class="text-sm text-[var(--color-text-secondary)]" v-else-if="!editingId">Confirma la cuenta encontrada antes de asignarle acceso al gimnasio seleccionado.</p>
        <p class="text-sm text-[var(--color-text-secondary)]" v-else>Los cambios de permisos se aplican al gimnasio seleccionado.</p>
        <div v-if="!editingId && isGymScopedForm" class="grid gap-4">
          <p class="text-xs text-[var(--color-text-secondary)]">Esta operación afecta únicamente al gimnasio seleccionado; los otros gimnasios se administran por separado.</p>
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
                :disabled="submitting || !!pendingOwnerLink"
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
              :disabled="submitting || !!pendingOwnerLink"
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

        <BaseButton class="w-full" :disabled="submitting || lookingUp || (!editingId && mode === 'link' && !foundAccount && !pendingOwnerLink)" @click="saveUser">
          {{ submitting ? 'Guardando…' : pendingOwnerLink ? 'Reintentar asignación al gimnasio' : 'Guardar usuario' }}
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
