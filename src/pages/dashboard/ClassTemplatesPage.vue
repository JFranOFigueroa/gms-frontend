<script setup>
import { ref } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'

import BaseInput from '@/components/ui/BaseInput.vue'

import BaseButton from '@/components/ui/BaseButton.vue'

import { useClassTemplateStore } from '@/stores/useClassTemplateStore'

const templateStore = useClassTemplateStore()

const name = ref('')

const color = ref('#22c55e')

const duration = ref(60)

const capacity = ref(20)

const addTemplate = () => {
  if (!name.value) return

  templateStore.addTemplate({
    name: name.value,

    color: color.value,

    duration: duration.value,

    capacity: capacity.value,
  })

  name.value = ''
}
</script>

<template>
  <div class="space-y-8">
    <!-- HEADER -->
    <div>
      <h1 class="text-4xl font-black">Plantillas de clases</h1>

      <p class="text-zinc-500 mt-2">Gestiona los tipos de entrenamiento</p>
    </div>

    <!-- FORM -->
    <BaseCard>
      <div class="space-y-4">
        <BaseInput v-model="name" placeholder="Nombre clase" />

        <div class="grid grid-cols-2 gap-4">
          <input
            v-model="color"
            type="color"
            class="h-14 rounded-2xl bg-zinc-900 border border-zinc-800"
          />

          <BaseInput v-model="duration" type="number" placeholder="Duración" />
        </div>

        <BaseInput v-model="capacity" type="number" placeholder="Capacidad" />

        <BaseButton @click="addTemplate"> Crear plantilla </BaseButton>
      </div>
    </BaseCard>

    <!-- LIST -->
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
      <BaseCard v-for="template in templateStore.templates" :key="template.id">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <div
              class="w-5 h-5 rounded-full"
              :style="{
                background: template.color,
              }"
            />

            <h2 class="text-2xl font-bold">
              {{ template.name }}
            </h2>
          </div>

          <div class="text-zinc-500 space-y-1">
            <p>
              Duración:
              {{ template.duration }} min
            </p>

            <p>
              Capacidad:
              {{ template.capacity }}
            </p>
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
