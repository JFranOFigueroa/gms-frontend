<script setup>
import { computed, ref, watch } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import GlobalAccountsPanel from '@/components/dashboard/GlobalAccountsPanel.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { useUserStore, OwnerLinkPendingError } from '@/stores/useUserStore'
import { useBranchesStore } from '@/stores/useBranchesStore'
import { api } from '@/api/service'

import { ROLE_LABELS, assignableRoles, canEditStaffRole } from '@/config/permissions'

const authStore = useAuthStore()
const userStore = useUserStore()
const branchesStore = useBranchesStore()

const modalOpen = ref(false)
const editingId = ref(null)
const formError = ref('')
const notice = ref('')
const mode = ref('create') // create o link: la búsqueda nunca bloquea el alta nueva.
const submitting = ref(false)
const lookingUp = ref(false)
const foundAccount = ref(null)
const pendingOwnerLink = ref(null) // {userId, branchId} solo en memoria.

const search = ref('')
const roleFilter = ref('all')

const name = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const role = ref('trainer')

const selectedBranchIds = ref([])
const defaultBranchId = ref(null)

const actorRole = computed(() => authStore.role)
const availableRoles = computed(() =>
  assignableRoles(actorRole.value).filter(
    (value) => value !== 'owner' || authStore.user?.platformAdmin === true,
  ),
)
const canCreate = computed(() => availableRoles.value.length > 0)

const isBranchScopedForm = computed(() => ['owner', 'trainer'].includes(role.value))

const selectedBranches = computed(() => {
  return branchesStore.branches.filter((branch) => selectedBranchIds.value.includes(branch.id))
})

const assignableBranches = computed(() => {
  if (authStore.role === 'admin')
    return branchesStore.branches.filter((g) => g.id === branchesStore.activeBranchId)

  const allowedIds = authStore.user?.branchIds

  if (!allowedIds?.length) {
    return branchesStore.branches.filter((branch) => branch.id === branchesStore.activeBranchId)
  }

  return branchesStore.branches.filter(
    (branch) => allowedIds.includes(branch.id) && branch.id === branchesStore.activeBranchId,
  )
})

const branchName = (id) => branchesStore.getBranchById(id)?.name || 'Sucursal'

const canEditUser = (user) =>
  (user.roles?.length ? user.roles : [user.role]).every(
    (assignedRole) =>
      canEditStaffRole(actorRole.value, assignedRole) &&
      (assignedRole !== 'owner' || authStore.user?.platformAdmin === true),
  )

const toggleBranchAccess = (branchId) => {
  if (selectedBranchIds.value.includes(branchId)) {
    selectedBranchIds.value = selectedBranchIds.value.filter((id) => id !== branchId)

    if (defaultBranchId.value === branchId) {
      defaultBranchId.value = selectedBranchIds.value[0] ?? null
    }
  } else {
    selectedBranchIds.value = [...selectedBranchIds.value, branchId]

    if (!defaultBranchId.value) {
      defaultBranchId.value = branchId
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
    if (!selectedBranchIds.value.length) {
      selectedBranchIds.value = [branchesStore.activeBranchId]
      defaultBranchId.value = branchesStore.activeBranchId
    }
  } else {
    selectedBranchIds.value = []
    defaultBranchId.value = null
  }
})

const filteredUsers = computed(() => {
  const query = search.value.trim().toLowerCase()

  return userStore.users.filter((user) => {
    if (actorRole.value === 'owner' && (user.roles || [user.role]).includes('admin')) return false

    const matchesRole =
      roleFilter.value === 'all' || (user.roles || [user.role]).includes(roleFilter.value)

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
  selectedBranchIds.value = []
  defaultBranchId.value = null
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
  if (error?.status === 409)
    return 'El correo ya tiene una cuenta o existe un vínculo. Usa “Vincular cuenta existente” si corresponde.'
  if (error?.status === 403)
    return 'No tienes permiso para esta operación o el registro de cuentas no está habilitado en el servidor.'
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
    const branch = branchesStore.activeBranchId
    if (!branch) throw new Error('Selecciona primero una sucursal.')
    // El owner solo puede buscar cuentas en su sucursal. Admin global: búsqueda global.
    const result = await api.users.search(
      contact,
      authStore.user?.platformAdmin ? undefined : branch,
    )
    if (result?.status !== 'active') throw new Error('Esta cuenta no está activa.')
    foundAccount.value = result
  } catch (error) {
    formError.value = userError(error)
  } finally {
    lookingUp.value = false
  }
}

const openCreate = () => {
  resetForm()
  notice.value = ''
  role.value = availableRoles.value.includes('trainer') ? 'trainer' : availableRoles.value[0]
  selectedBranchIds.value = [branchesStore.activeBranchId]
  defaultBranchId.value = branchesStore.activeBranchId
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
    selectedBranchIds.value = user.branchIds?.length
      ? [...user.branchIds]
      : user.branchId
        ? [user.branchId]
        : []
    defaultBranchId.value = user.defaultBranchId || selectedBranchIds.value[0] || null
  } else {
    selectedBranchIds.value = []
    defaultBranchId.value = null
  }

  modalOpen.value = true
}

const saveUser = async () => {
  if (submitting.value || lookingUp.value) return
  formError.value = ''
  submitting.value = true
  try {
    if (editingId.value) {
      await userStore.updateUser(editingId.value, { role: role.value })
    } else {
      const branch = branchesStore.activeBranchId
      if (!branch || !selectedBranchIds.value.includes(branch))
        throw new Error('Selecciona la sucursal en la que deseas registrar a esta persona.')
      if (!availableRoles.value.includes(role.value))
        throw new Error('No tienes permiso para asignar este rol.')
      if (pendingOwnerLink.value) {
        if (pendingOwnerLink.value.branchId !== branch)
          throw new Error('Selecciona la sucursal donde quedó pendiente la asignación.')
        await userStore.linkStaff(pendingOwnerLink.value.userId, 'owner', branch)
        pendingOwnerLink.value = null
      } else if (mode.value === 'link') {
        if (
          !foundAccount.value ||
          foundAccount.value.email?.toLowerCase() !== email.value.trim().toLowerCase()
        )
          throw new Error('Busca y confirma primero la cuenta que deseas vincular.')
        if (foundAccount.value.status !== 'active') throw new Error('Esta cuenta no está activa.')
        await userStore.linkStaff(foundAccount.value.id, role.value, branch)
      } else {
        if (
          !name.value.trim() ||
          name.value.trim().length > 250 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
        )
          throw new Error('Nombre (máximo 250 caracteres) y correo válido son obligatorios.')
        if (password.value.length < 10 || password.value.length > 200)
          throw new Error('La contraseña debe tener entre 10 y 200 caracteres.')
        const data = {
          name: name.value.trim(),
          email: email.value.trim().toLowerCase(),
          phone: phone.value.trim(),
          password: password.value,
        }
        if (role.value === 'trainer') await userStore.registerTrainer(data, branch)
        else if (role.value === 'owner' && authStore.user?.platformAdmin === true)
          await userStore.registerOwner(data, branch)
        else throw new Error('No tienes permiso para registrar este rol.')
      }
    }
    notice.value = editingId.value
      ? 'Usuario actualizado correctamente.'
      : 'Usuario agregado correctamente.'
    modalOpen.value = false
    resetForm()
  } catch (error) {
    if (error instanceof OwnerLinkPendingError) {
      pendingOwnerLink.value = { userId: error.userId, branchId: error.branchId }
      password.value = ''
      formError.value = error.message
    } else {
      formError.value = userError(error)
    }
  } finally {
    submitting.value = false
  }
}

const deleteUser = async (user) => {
  if (!canEditUser(user)) return

  if (!confirm(`¿Eliminar a ${user.name}?`)) return

  try {
    await userStore.removeUser(user.id)
  } catch (error) {
    formError.value = error.message
    alert(error.message)
  }
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
        <h1 class="text-3xl font-black sm:text-4xl">Usuarios</h1>

        <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
          Gestiona propietarios y entrenadores. Los miembros se administran en su módulo propio.
        </p>
      </div>

      <BaseButton v-if="canCreate" @click="openCreate"> Nuevo usuario </BaseButton>
    </div>

    <p v-if="notice" role="status" class="text-sm text-emerald-400">{{ notice }}</p>
    <GlobalAccountsPanel v-if="authStore.user?.platformAdmin" />

    <div class="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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

    <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="user in filteredUsers" :key="user.id">
        <div class="space-y-4">
          <div>
            <h2 class="text-2xl font-bold">
              {{ user.name }}
            </h2>

            <p class="text-[var(--color-text-secondary)] mt-1">
              {{
                (user.roles?.length ? user.roles : [user.role])
                  .map((r) => ROLE_LABELS[r] || r)
                  .join(', ')
              }}
            </p>
          </div>

          <div class="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <p class="break-all">{{ user.email }}</p>

            <p v-if="user.phone">{{ user.phone }}</p>

            <p>Estado: {{ user.active ? 'Activo' : 'Inactivo' }}</p>

            <p v-if="['owner', 'trainer'].includes(user.role) && user.branchIds?.length">
              Sucursales: {{ user.branchIds.map(branchName).join(', ') }}
            </p>

            <p v-if="['owner', 'trainer'].includes(user.role) && user.defaultBranchId">
              Sucursal por defecto: {{ branchName(user.defaultBranchId) }}
            </p>
          </div>

          <div v-if="canEditUser(user)" class="flex flex-wrap gap-3">
            <BaseButton variant="secondary" @click="openEdit(user)"> Editar </BaseButton>

            <BaseButton
              variant="secondary"
              disabled
              title="Activación global pendiente de definir"
              @click="toggleActive(user)"
            >
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
        <h2 class="text-2xl font-black sm:text-3xl">
          {{ editingId ? 'Editar usuario' : 'Nuevo usuario' }}
        </h2>

        <div v-if="!editingId" class="flex flex-wrap gap-3">
          <BaseButton
            type="button"
            :variant="mode === 'create' ? 'primary' : 'secondary'"
            :disabled="!!pendingOwnerLink || submitting"
            @click="setMode('create')"
            >Crear nuevo usuario</BaseButton
          >
          <BaseButton
            type="button"
            :variant="mode === 'link' ? 'primary' : 'secondary'"
            :disabled="!!pendingOwnerLink || submitting"
            @click="setMode('link')"
            >Vincular cuenta existente</BaseButton
          >
        </div>

        <BaseInput
          v-if="editingId || mode === 'create'"
          v-model="name"
          name="branch_staff_full_name"
          autocomplete="off"
          placeholder="Nombre completo"
          :disabled="!!editingId || submitting || !!pendingOwnerLink"
        />

        <BaseInput
          v-model="email"
          name="branch_staff_contact_email"
          type="email"
          autocomplete="off"
          placeholder="Correo"
          :disabled="!!editingId || submitting || !!pendingOwnerLink"
          @update:modelValue="foundAccount = null"
        />

        <BaseInput
          v-if="editingId || mode === 'create'"
          v-model="phone"
          name="branch_staff_contact_phone"
          type="tel"
          inputmode="tel"
          autocomplete="off"
          placeholder="Teléfono"
          :disabled="!!editingId || submitting || !!pendingOwnerLink"
        />
        <BaseInput
          v-if="!editingId && mode === 'create' && !pendingOwnerLink"
          v-model="password"
          name="branch_staff_new_password"
          autocomplete="new-password"
          type="password"
          placeholder="Contraseña (mín. 10 caracteres)"
          :disabled="submitting"
        />
        <div v-if="!editingId && mode === 'link'" class="space-y-2">
          <BaseButton
            type="button"
            variant="secondary"
            :disabled="lookingUp || submitting"
            @click="findExistingAccount"
            >{{ lookingUp ? 'Buscando…' : 'Buscar cuenta por correo' }}</BaseButton
          >
          <p
            v-if="foundAccount"
            class="rounded-2xl border border-[var(--color-border)] p-3 text-sm"
          >
            Cuenta encontrada:
            <strong>{{ foundAccount.fullName || foundAccount.name || foundAccount.email }}</strong>
            · {{ foundAccount.email }}
          </p>
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

        <p
          class="text-sm text-[var(--color-text-secondary)]"
          v-if="!editingId && mode === 'create'"
        >
          Los entrenadores y propietarios nuevos se registran en la sucursal seleccionada. Para
          vincular una cuenta ya creada, usa “Vincular cuenta existente”.
        </p>
        <p class="text-sm text-[var(--color-text-secondary)]" v-else-if="!editingId">
          Confirma la cuenta encontrada antes de asignarle acceso a la sucursal seleccionada.
        </p>
        <p class="text-sm text-[var(--color-text-secondary)]" v-else>
          Los cambios de permisos se aplican a la sucursal seleccionada.
        </p>
        <div v-if="!editingId && isBranchScopedForm" class="grid gap-4">
          <p class="text-xs text-[var(--color-text-secondary)]">
            Esta operación afecta únicamente a la sucursal seleccionada; las otras sucursales se
            administran por separado.
          </p>
          <div>
            <p class="mb-2 text-[var(--color-text-secondary)]">Sucursales con acceso</p>

            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-for="branch in assignableBranches"
                :key="branch.id"
                type="button"
                class="rounded-2xl border p-3 text-left transition"
                :class="
                  selectedBranchIds.includes(branch.id)
                    ? 'border-[var(--color-primary)]'
                    : 'border-[var(--color-border)]'
                "
                :disabled="submitting || !!pendingOwnerLink"
                @click="toggleBranchAccess(branch.id)"
              >
                <p class="font-semibold">{{ branch.name }}</p>

                <p class="text-xs text-[var(--color-text-secondary)]">{{ branch.shortName }}</p>
              </button>
            </div>
          </div>

          <div>
            <p class="mb-2 text-[var(--color-text-secondary)]">Sucursal por defecto</p>

            <select
              v-model="defaultBranchId"
              :disabled="submitting || !!pendingOwnerLink"
              class="w-full h-14 px-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <option v-for="branch in selectedBranches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
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

        <BaseButton
          class="w-full"
          :disabled="
            submitting ||
            lookingUp ||
            (!editingId && mode === 'link' && !foundAccount && !pendingOwnerLink)
          "
          @click="saveUser"
        >
          {{
            submitting
              ? 'Guardando…'
              : pendingOwnerLink
                ? 'Reintentar asignación a la sucursal'
                : 'Guardar usuario'
          }}
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
