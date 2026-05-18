<script setup>
import { ref, watch } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'

import BaseInput from '@/components/ui/BaseInput.vue'

import { useTenantStore } from '@/stores/useTenantStore'

const tenantStore = useTenantStore()

const gymName = ref(tenantStore.gym.name)

const shortName = ref(tenantStore.gym.shortName)

watch(
  [gymName, shortName],

  () => {
    tenantStore.updateGym({
      name: gymName.value,

      shortName: shortName.value,
    })
  },
)
</script>

<template>
  <BaseCard>
    <div class="space-y-6">
      <div>
        <h2 class="text-2xl font-black">Configuración del gimnasio</h2>

        <p class="text-zinc-500 mt-2">Personaliza la identidad visual</p>
      </div>

      <!-- Gym Name -->
      <div>
        <label class="block mb-2 text-zinc-400"> Nombre del gimnasio </label>

        <BaseInput v-model="gymName" />
      </div>

      <!-- Short Name -->
      <div>
        <label class="block mb-2 text-zinc-400"> Nombre corto </label>

        <BaseInput v-model="shortName" />
      </div>
    </div>
  </BaseCard>
</template>
