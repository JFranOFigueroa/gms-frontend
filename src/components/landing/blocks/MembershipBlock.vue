<script setup>
defineProps({
  data: Object,
})
</script>

<template>
  <section class="bg-[var(--color-background)] px-4 py-12 sm:px-6 sm:py-24">
    <div class="mx-auto max-w-7xl">
      <!-- Header -->
      <div class="mb-10 text-center sm:mb-16">
        <h2 class="break-words text-3xl font-black sm:text-4xl md:text-5xl">
          {{ data.title }}
        </h2>

        <p class="mt-4 break-words text-sm text-[var(--color-text-secondary)] sm:text-base">
          {{ data.subtitle }}
        </p>
      </div>

      <!-- Plans -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
        <div
          v-for="plan in data.plans"
          :key="plan.id"
          class="rounded-3xl border p-6 transition-all sm:p-8"
          :class="
            plan.featured
              ? 'border-[var(--color-primary)] bg-[var(--color-surface)] md:scale-105'
              : 'border-[var(--color-border)] bg-[var(--color-surface)]'
          "
        >
          <div
            v-if="plan.featured"
            class="mb-6 inline-block rounded-full bg-[var(--color-text)] px-4 py-1 text-sm font-bold text-[var(--color-background)]"
          >
            Más Popular
          </div>

          <h3 class="break-words text-2xl font-black sm:text-3xl">
            {{ plan.name }}
          </h3>

          <p class="mt-6 break-words text-4xl font-black sm:text-5xl">
            {{ plan.price }}
          </p>

          <ul class="mt-8 space-y-4">
            <li
              v-for="benefit in plan.benefits"
              :key="benefit"
              class="break-words text-[var(--color-text-secondary)]"
            >
              ✓ {{ benefit }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
