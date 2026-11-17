<script setup>
import { ref } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useBranchesStore } from '@/stores/useBranchesStore'
import { useAuthStore } from '@/stores/useAuthStore'
const saveError = ref('')

const branchesStore = useBranchesStore()

const modalOpen = ref(false)
const editingId = ref(null)

const name = ref('')
const shortName = ref('')
const address = ref('')
const phone = ref('')

const isActive = (id) => branchesStore.activeBranchId === id

const resetForm = () => {
  editingId.value = null
  name.value = ''
  shortName.value = ''
  address.value = ''
  phone.value = ''
}

const openCreate = () => {
  resetForm()
  modalOpen.value = true
}

const openEdit = (branch) => {
  editingId.value = branch.id
  name.value = branch.name
  shortName.value = branch.shortName || ''
  address.value = branch.address || ''
  phone.value = branch.phone || ''

  modalOpen.value = true
}

const saveBranch = async () => {
  if (!name.value.trim()) return
  saveError.value = ''

  const payload = {
    name: name.value.trim(),
    shortName: shortName.value.trim() || name.value.trim().slice(0, 4).toUpperCase(),
    address: address.value.trim(),
    phone: phone.value.trim(),
  }

  try {
    if (editingId.value) await branchesStore.updateBranch(editingId.value, payload)
    else {
      const created = await branchesStore.addBranch(payload)
      if (!branchesStore.activeBranchId) useAuthStore().selectBranch(created.id)
    }
    modalOpen.value = false
    resetForm()
  } catch (error) {
    saveError.value = error.message
  }
}

const selectBranch = (id) => {
  useAuthStore().selectBranch(id)
}

const removeBranch = async (id) => {
  if (branchesStore.branches.length <= 1) return

  if (!confirm('¿Eliminar esta sucursal y toda su información asociada?')) return

  try {
    await branchesStore.removeBranch(id)
    if (!branchesStore.activeBranchId && branchesStore.branches.length)
      useAuthStore().selectBranch(branchesStore.branches[0].id)
  } catch (error) {
    saveError.value = error.message
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-3xl font-black sm:text-4xl">Sucursales</h1>

        <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
          Administra las sucursales de la plataforma
        </p>
      </div>

      <BaseButton @click="openCreate"> Nueva sucursal </BaseButton>
    </div>

    <p v-if="saveError" role="alert" class="text-red-400">{{ saveError }}</p>
    <div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="branch in branchesStore.branches" :key="branch.id">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-2xl font-bold">
                {{ branch.name }}
              </h2>

              <p class="text-[var(--color-text-secondary)] mt-1">
                {{ branch.shortName }}
              </p>
            </div>

            <span
              v-if="isActive(branch.id)"
              class="rounded-full bg-[var(--color-primary)]/15 px-3 py-1 text-xs text-[var(--color-primary)]"
            >
              Activo
            </span>
          </div>

          <div class="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <p v-if="branch.address">{{ branch.address }}</p>
            <p v-if="branch.phone">{{ branch.phone }}</p>
            <p>Estado: {{ branch.active === false ? 'Inactivo' : 'Activo' }}</p>
            <p>Creado: {{ branch.createdAt }}</p>
          </div>

          <div class="flex flex-wrap gap-3">
            <BaseButton
              v-if="!isActive(branch.id)"
              variant="secondary"
              @click="selectBranch(branch.id)"
            >
              Seleccionar
            </BaseButton>

            <BaseButton variant="secondary" @click="openEdit(branch)"> Editar </BaseButton>

            <BaseButton
              v-if="branchesStore.branches.length > 1"
              variant="secondary"
              @click="removeBranch(branch.id)"
            >
              Eliminar
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseModal :open="modalOpen" @close="modalOpen = false">
      <div class="space-y-6">
        <h2 class="text-2xl font-black sm:text-3xl">
          {{ editingId ? 'Editar sucursal' : 'Nueva sucursal' }}
        </h2>

        <BaseInput v-model="name" placeholder="Nombre de la sucursal" />

        <BaseInput v-model="shortName" placeholder="Nombre corto" />

        <BaseInput v-model="address" placeholder="Dirección" />

        <BaseInput v-model="phone" placeholder="Teléfono" />

        <BaseButton class="w-full" @click="saveBranch"> Guardar sucursal </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
