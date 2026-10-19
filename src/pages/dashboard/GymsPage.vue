<script setup>
import { ref } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useGymsStore } from '@/stores/useGymsStore'
import { useLandingStore } from '@/stores/useLandingStore'

const gymsStore = useGymsStore()
const landingStore = useLandingStore()

const modalOpen = ref(false)
const editingId = ref(null)

const name = ref('')
const shortName = ref('')
const address = ref('')
const phone = ref('')

const isActive = (id) => gymsStore.activeGymId === id

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

const openEdit = (gym) => {
  editingId.value = gym.id
  name.value = gym.name
  shortName.value = gym.shortName || ''
  address.value = gym.address || ''
  phone.value = gym.phone || ''

  modalOpen.value = true
}

const saveGym = () => {
  if (!name.value.trim()) return

  const payload = {
    name: name.value.trim(),
    shortName: shortName.value.trim() || name.value.trim().slice(0, 4).toUpperCase(),
    address: address.value.trim(),
    phone: phone.value.trim(),
  }

  if (editingId.value) {
    gymsStore.updateGym(editingId.value, payload)
  } else {
    const gym = gymsStore.addGym(payload)

    landingStore.seedDefaultsForGym(gym.id)
  }

  modalOpen.value = false
  resetForm()
}

const selectGym = (id) => {
  gymsStore.setActiveGym(id)
}

const removeGym = (id) => {
  if (gymsStore.gyms.length <= 1) return

  if (!confirm('¿Eliminar este gimnasio y toda su información asociada?')) return

  gymsStore.removeGym(id)
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-4xl font-black">Gimnasios</h1>

        <p class="text-[var(--color-text-secondary)] mt-2">
          Administra los gimnasios de la plataforma
        </p>
      </div>

      <BaseButton @click="openCreate"> Nuevo gimnasio </BaseButton>
    </div>

    <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      <BaseCard v-for="gym in gymsStore.gyms" :key="gym.id">
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-2xl font-bold">
                {{ gym.name }}
              </h2>

              <p class="text-[var(--color-text-secondary)] mt-1">
                {{ gym.shortName }}
              </p>
            </div>

            <span
              v-if="isActive(gym.id)"
              class="rounded-full bg-[var(--color-primary)]/15 px-3 py-1 text-xs text-[var(--color-primary)]"
            >
              Activo
            </span>
          </div>

          <div class="space-y-1 text-sm text-[var(--color-text-secondary)]">
            <p v-if="gym.address">{{ gym.address }}</p>
            <p v-if="gym.phone">{{ gym.phone }}</p>
            <p>Estado: {{ gym.active === false ? 'Inactivo' : 'Activo' }}</p>
            <p>Creado: {{ gym.createdAt }}</p>
          </div>

          <div class="flex flex-wrap gap-3">
            <BaseButton v-if="!isActive(gym.id)" variant="secondary" @click="selectGym(gym.id)">
              Seleccionar
            </BaseButton>

            <BaseButton variant="secondary" @click="openEdit(gym)"> Editar </BaseButton>

            <BaseButton
              v-if="gymsStore.gyms.length > 1"
              variant="secondary"
              @click="removeGym(gym.id)"
            >
              Eliminar
            </BaseButton>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseModal :open="modalOpen" @close="modalOpen = false">
      <div class="space-y-6">
        <h2 class="text-3xl font-black">
          {{ editingId ? 'Editar gimnasio' : 'Nuevo gimnasio' }}
        </h2>

        <BaseInput v-model="name" placeholder="Nombre del gimnasio" />

        <BaseInput v-model="shortName" placeholder="Nombre corto" />

        <BaseInput v-model="address" placeholder="Dirección" />

        <BaseInput v-model="phone" placeholder="Teléfono" />

        <BaseButton class="w-full" @click="saveGym"> Guardar gimnasio </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>
