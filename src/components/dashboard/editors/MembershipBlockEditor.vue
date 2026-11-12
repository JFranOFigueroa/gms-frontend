<script setup>
import { computed } from 'vue'

import { Plus, Trash2 } from 'lucide-vue-next'

import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import { useLandingStore } from '@/stores/useLandingStore'

const props = defineProps({
  block: Object,
})

const landingStore = useLandingStore()

/* -----------------------------
 * TITLE
 * ----------------------------- */

const title = computed({
  get() {
    return props.block.data.title
  },

  set(value) {
    landingStore.updateBlock(
      props.block.id,

      {
        data: {
          title: value,
        },
      },
    )
  },
})

/* -----------------------------
 * SUBTITLE
 * ----------------------------- */

const subtitle = computed({
  get() {
    return props.block.data.subtitle
  },

  set(value) {
    landingStore.updateBlock(
      props.block.id,

      {
        data: {
          subtitle: value,
        },
      },
    )
  },
})

/* -----------------------------
 * UPDATE PLAN
 * ----------------------------- */

const updatePlan = (planId, field, value) => {
  const updatedPlans = props.block.data.plans.map((plan) => {
    if (plan.id !== planId) {
      return plan
    }

    return {
      ...plan,

      [field]: value,
    }
  })

  landingStore.updateBlock(
    props.block.id,

    {
      data: {
        plans: updatedPlans,
      },
    },
  )
}

/* -----------------------------
 * ADD PLAN
 * ----------------------------- */

const addPlan = () => {
  const plans = props.block.data.plans || []

  landingStore.updateBlock(
    props.block.id,

    {
      data: {
        plans: [
          ...plans,

          {
            id: Date.now(),

            name: 'Nuevo Plan',

            price: '$0',

            featured: false,

            benefits: ['Nuevo beneficio'],
          },
        ],
      },
    },
  )
}

/* -----------------------------
 * REMOVE PLAN
 * ----------------------------- */

const removePlan = (planId) => {
  const updatedPlans = props.block.data.plans.filter((plan) => plan.id !== planId)

  landingStore.updateBlock(
    props.block.id,

    {
      data: {
        plans: updatedPlans,
      },
    },
  )
}

/* -----------------------------
 * TOGGLE FEATURED
 * ----------------------------- */

const toggleFeatured = (planId) => {
  const updatedPlans = props.block.data.plans.map((plan) => {
    if (plan.id !== planId) {
      return plan
    }

    return {
      ...plan,

      featured: !plan.featured,
    }
  })

  landingStore.updateBlock(
    props.block.id,

    {
      data: {
        plans: updatedPlans,
      },
    },
  )
}
</script>

<template>
  <div class="space-y-6">
    <!-- TITLE -->
    <div>
      <label class="block mb-2 text-[var(--color-text-secondary)]"> Título </label>

      <BaseInput v-model="title" />
    </div>

    <!-- SUBTITLE -->
    <div>
      <label class="block mb-2 text-[var(--color-text-secondary)]"> Subtítulo </label>

      <BaseInput v-model="subtitle" />
    </div>

    <!-- HEADER -->
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-lg font-bold sm:text-xl">Planes</h3>

      <BaseButton variant="secondary" @click="addPlan">
        <Plus class="h-5 w-5" />
      </BaseButton>
    </div>

    <!-- PLANS -->
    <div class="space-y-6">
      <div
        v-for="plan in block.data.plans"
        :key="plan.id"
        class="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-6"
      >
        <!-- TOP -->
        <div class="flex items-center justify-between gap-3">
          <h4 class="min-w-0 truncate text-lg font-bold sm:text-xl">
            {{ plan.name }}
          </h4>

          <button
            type="button"
            aria-label="Eliminar plan"
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400"
            @click="removePlan(plan.id)"
          >
            <Trash2 class="w-5 h-5" />
          </button>
        </div>

        <!-- NAME -->
        <div>
          <label class="block mb-2 text-[var(--color-text-secondary)]"> Nombre </label>

          <BaseInput
            :model-value="plan.name"
            @update:modelValue="updatePlan(plan.id, 'name', $event)"
          />
        </div>

        <!-- PRICE -->
        <div>
          <label class="block mb-2 text-[var(--color-text-secondary)]"> Precio </label>

          <BaseInput
            :model-value="plan.price"
            @update:modelValue="updatePlan(plan.id, 'price', $event)"
          />
        </div>

        <!-- FEATURED -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span> Plan destacado </span>

          <BaseButton variant="secondary" @click="toggleFeatured(plan.id)">
            {{ plan.featured ? 'Sí' : 'No' }}
          </BaseButton>
        </div>

        <!-- BENEFITS -->
        <div>
          <label class="block mb-2 text-[var(--color-text-secondary)]"> Beneficios </label>

          <div class="space-y-2">
            <div v-for="(benefit, benefitIndex) in plan.benefits" :key="benefitIndex">
              <BaseInput :model-value="benefit" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
