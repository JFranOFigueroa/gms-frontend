<script setup>
import { computed, onMounted, ref, watch } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

import { api } from '@/api/service'
import { useAuthStore } from '@/stores/useAuthStore'
import { useBranchesStore } from '@/stores/useBranchesStore'
import { useIntegrationStore } from '@/stores/useIntegrationStore'
import { useModuleStore } from '@/stores/useModuleStore'
import { moduleRegistry, modulePresets } from '@/config/moduleRegistry'

const authStore = useAuthStore()
const branchesStore = useBranchesStore()
const integrationStore = useIntegrationStore()
const moduleStore = useModuleStore()

const canManage = computed(() => authStore.user?.platformAdmin === true)
const actionError = ref('')
const actionNotice = ref('')
const siteSettings = ref(null)
const loadingSettings = ref(false)
const saving = ref(false)

const activeBranchId = computed(() => branchesStore.activeBranchId)
const activeBranchName = computed(() => branchesStore.activeBranch?.name || '')
const modulesGlobal = computed(() => siteSettings.value?.modulesGlobal === true)

const presets = [
  { id: 'traditional', label: 'Tradicional' },
  { id: 'crossfit', label: 'CrossFit / Clases' },
  { id: 'mixed', label: 'Mixto' },
]

const normalizedGlobalModules = (source) => {
  const modules = {}
  for (const module of moduleRegistry)
    modules[module.id] = source?.[module.id] ?? module.defaultEnabled === true
  return modules
}

const effectiveModules = computed(() => {
  if (modulesGlobal.value) return normalizedGlobalModules(siteSettings.value?.globalModules)
  return moduleStore.modules
})

const moduleEnabled = (moduleId) => effectiveModules.value?.[moduleId] === true

const activePreset = computed(() => {
  const { calendar, routines } = effectiveModules.value || {}
  if (calendar && routines) return 'mixed'
  if (calendar && !routines) return 'crossfit'
  if (!calendar && routines) return 'traditional'
  return null
})

const controlsDisabled = computed(
  () =>
    !canManage.value ||
    saving.value ||
    loadingSettings.value ||
    (!modulesGlobal.value && !activeBranchId.value),
)

async function loadSiteSettings() {
  if (!canManage.value) return
  loadingSettings.value = true
  try {
    siteSettings.value = await integrationStore.track('configuración del sitio', () =>
      api.site.settings.get(),
    )
  } catch (e) {
    actionError.value = e.message
  } finally {
    loadingSettings.value = false
  }
}

async function refreshEffectiveModules() {
  if (!activeBranchId.value) return
  await moduleStore.load(activeBranchId.value)
}

async function saveGlobalModules(globalModules) {
  const data = await integrationStore.track('configuración del sitio', () =>
    api.site.settings.update({ globalModules }),
  )
  siteSettings.value = data
  await refreshEffectiveModules()
}

async function toggleGlobalMode(event) {
  if (!canManage.value || saving.value) return
  const enabled = event.target.checked
  actionError.value = ''
  actionNotice.value = ''
  saving.value = true
  try {
    const body = { modulesGlobal: enabled }
    if (enabled) {
      // Al activar el modo global se toma la configuración de la sucursal
      // activa como punto de partida; si no hay sucursal, se conserva la global.
      const source =
        activeBranchId.value && moduleStore.loaded
          ? moduleStore.modules
          : siteSettings.value?.globalModules
      body.globalModules = normalizedGlobalModules(source)
    }
    siteSettings.value = await integrationStore.track('configuración del sitio', () =>
      api.site.settings.update(body),
    )
    await refreshEffectiveModules()
    actionNotice.value = enabled
      ? 'Módulos globales activados para todas las sucursales.'
      : 'Módulos globales desactivados; cada sucursal usa su configuración.'
  } catch (e) {
    event.target.checked = modulesGlobal.value
    actionError.value = e.message
  } finally {
    saving.value = false
  }
}

async function toggleModule(moduleId) {
  if (controlsDisabled.value) return
  actionError.value = ''
  actionNotice.value = ''
  saving.value = true
  try {
    if (modulesGlobal.value) {
      const next = normalizedGlobalModules(siteSettings.value?.globalModules)
      next[moduleId] = !moduleEnabled(moduleId)
      await saveGlobalModules(next)
    } else {
      await moduleStore.toggleModule(moduleId)
    }
  } catch (e) {
    actionError.value = e.message
  } finally {
    saving.value = false
  }
}

async function applyPreset(presetId) {
  if (controlsDisabled.value) return
  const preset = modulePresets[presetId]
  if (!preset) return
  actionError.value = ''
  actionNotice.value = ''
  saving.value = true
  try {
    if (modulesGlobal.value) {
      const next = normalizedGlobalModules(siteSettings.value?.globalModules)
      for (const module of moduleRegistry) next[module.id] = preset[module.id] === true
      await saveGlobalModules(next)
    } else {
      await moduleStore.applyPreset(presetId)
    }
  } catch (e) {
    actionError.value = e.message
  } finally {
    saving.value = false
  }
}

watch(activeBranchId, async (branch) => {
  if (branch && !modulesGlobal.value) {
    try {
      await moduleStore.load(branch)
    } catch (e) {
      actionError.value = e.message
    }
  }
})

onMounted(async () => {
  await Promise.allSettled([loadSiteSettings(), refreshEffectiveModules()])
})
</script>

<template>
  <BaseCard>
    <div class="space-y-6">
      <div>
        <h2 class="text-xl font-black sm:text-2xl">Módulos operativos</h2>

        <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
          Activa o desactiva funcionalidades para la sucursal activa o para todo el sitio.
        </p>
        <p v-if="activeBranchName" class="mt-1 text-sm font-semibold">
          Sucursal activa: {{ activeBranchName }}
        </p>
      </div>

      <p v-if="!canManage" class="text-sm text-[var(--color-text-secondary)]">
        Solo el administrador del sistema puede cambiar estas opciones.
      </p>
      <p v-if="loadingSettings" class="text-sm text-[var(--color-text-secondary)]">
        Cargando configuración…
      </p>
      <p v-if="actionError" role="alert" class="text-red-400">{{ actionError }}</p>
      <p v-if="actionNotice" role="status" class="text-sm text-emerald-400">{{ actionNotice }}</p>

      <label
        class="flex cursor-pointer flex-col gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 sm:flex-row sm:items-start sm:gap-3"
      >
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
          :checked="modulesGlobal"
          :disabled="!canManage || saving || loadingSettings"
          @change="toggleGlobalMode"
        />
        <span class="min-w-0">
          <span class="block font-bold">Módulos globales</span>
          <span class="mt-1 block text-sm text-[var(--color-text-secondary)]">
            Aplica la misma configuración a todas las sucursales. Al desactivarlo, cada sucursal
            vuelve a sus módulos guardados.
          </span>
        </span>
      </label>

      <p
        v-if="!modulesGlobal && !activeBranchId"
        class="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200"
      >
        Selecciona una sucursal para configurar sus módulos, o activa “Módulos globales”.
      </p>

      <div class="space-y-4">
        <div
          v-for="module in moduleRegistry"
          :key="module.id"
          class="flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-3">
              <span class="text-2xl">{{ module.icon }}</span>

              <h3 class="text-lg font-bold sm:text-xl">
                {{ module.label }}
              </h3>
            </div>

            <p class="mt-1 text-sm text-[var(--color-text-secondary)]">
              {{ module.description }}
            </p>
          </div>

          <BaseButton
            variant="secondary"
            class="self-start sm:self-auto"
            :disabled="controlsDisabled"
            @click="toggleModule(module.id)"
            :class="{
              '!border-[var(--color-primary)]': moduleEnabled(module.id),
            }"
          >
            {{ moduleEnabled(module.id) ? 'Activo' : 'Inactivo' }}
          </BaseButton>
        </div>
      </div>

      <div class="space-y-3">
        <p class="text-sm text-[var(--color-text-secondary)]">Modo rápido</p>

        <div class="flex flex-wrap gap-3">
          <BaseButton
            v-for="preset in presets"
            :key="preset.id"
            variant="secondary"
            :disabled="controlsDisabled"
            @click="applyPreset(preset.id)"
            :class="{
              '!border-[var(--color-primary)]': activePreset === preset.id,
            }"
          >
            {{ preset.label }}
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseCard>
</template>
