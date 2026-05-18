<script setup>
defineProps({
  data: Object,
})
</script>

<template>
  <section class="py-24 px-6 bg-[var(--color-background)]">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-16">
        <h2 class="text-5xl font-black">
          {{ data.title }}
        </h2>

        <p class="text-zinc-500 mt-4">
          {{ data.subtitle }}
        </p>
      </div>

      <!-- Plans -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div
          v-for="plan in data.plans"
          :key="plan.id"
          class="rounded-3xl border p-8 transition-all"
          :class="
            plan.featured
              ? 'border-white bg-zinc-900 scale-105'
              : 'border-zinc-800 bg-[var(--color-surface)]'
          "
        >
          <div
            v-if="plan.featured"
            class="inline-block px-4 py-1 rounded-full bg-white text-black text-sm font-bold mb-6"
          >
            Más Popular
          </div>

          <h3 class="text-3xl font-black">
            {{ plan.name }}
          </h3>

          <p class="text-5xl font-black mt-6">
            {{ plan.price }}
          </p>

          <ul class="mt-8 space-y-4">
            <li v-for="benefit in plan.benefits" :key="benefit" class="text-zinc-300">
              ✓ {{ benefit }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
