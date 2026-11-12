<script setup>
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useGymsStore } from '@/stores/useGymsStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { api } from '@/api/service'
import { resolveApiUrl } from '@/api/http'
import { validateImageFile } from '@/stores/useMediaStore'

const gyms = useGymsStore()
const auth = useAuthStore()
const name = ref('')
const shortName = ref('')
const saving = ref(false)
const error = ref('')
const logoFile = ref(null)
const logoPreview = ref(null)
const uploadingLogo = ref(false)
const logoNotice = ref('')
let previewUrl = null
const canChangeLogo = computed(() => auth.role === 'owner' || auth.user?.platformAdmin)
const logoSrc = computed(() => logoPreview.value || resolveApiUrl(gyms.activeGym?.logo))
const releaseLogo = () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  previewUrl = null
  logoPreview.value = null
  logoFile.value = null
}
onBeforeUnmount(releaseLogo)
watch(
  () => gyms.activeGym,
  (g) => {
    name.value = g?.name || ''
    shortName.value = g?.shortName || ''
    releaseLogo()
    error.value = ''
    logoNotice.value = ''
  },
  { immediate: true },
)
const save = async () => {
  if (!auth.user?.platformAdmin) {
    error.value = 'No tienes permisos para cambiar estos datos.'
    return
  }
  saving.value = true
  error.value = ''
  try {
    await gyms.updateGym(gyms.activeGymId, { name: name.value, shortName: shortName.value })
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
const selectLogo = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  releaseLogo()
  logoNotice.value = ''
  try {
    validateImageFile(file)
    logoFile.value = file
    previewUrl = URL.createObjectURL(file)
    logoPreview.value = previewUrl
  } catch (e) {
    logoNotice.value = e.message
  }
}
const saveLogo = async () => {
  if (!canChangeLogo.value || !logoFile.value || !gyms.activeGymId) return
  uploadingLogo.value = true
  logoNotice.value = ''
  const gymId = gyms.activeGymId
  try {
    const asset = await api.media.upload(gymId, logoFile.value, 'Logo del gimnasio')
    const result = await api.landing.changeLogo(gymId, asset.id)
    const gym = gyms.gyms.find((item) => item.id === gymId)
    if (gym) gym.logo = result.logoUrl
    releaseLogo()
    logoNotice.value = 'Logo actualizado correctamente.'
  } catch (e) {
    logoNotice.value = e.message || 'No se pudo actualizar el logo.'
  } finally {
    uploadingLogo.value = false
  }
}
</script>
<template>
  <BaseCard
    ><div class="space-y-4">
      <h2 class="text-xl font-black sm:text-2xl">Configuración del gimnasio</h2>
      <p class="text-sm text-[var(--color-text-secondary)]">Nombre y abreviatura del gimnasio.</p>
      <label class="block text-sm">Nombre del gimnasio</label>
      <BaseInput v-model="name" :disabled="!auth.user?.platformAdmin" />
      <label class="block text-sm">Nombre corto</label>
      <BaseInput v-model="shortName" :disabled="!auth.user?.platformAdmin" />
      <p v-if="error" class="text-red-400">{{ error }}</p>
      <BaseButton v-if="auth.user?.platformAdmin" :disabled="saving" @click="save">{{
        saving ? 'Guardando…' : 'Guardar'
      }}</BaseButton>
      <p v-else class="text-sm text-[var(--color-text-secondary)]">
        Solo el administrador del sistema puede editar estos datos.
      </p>
      <div v-if="canChangeLogo" class="border-t border-[var(--color-border)] pt-4 space-y-3">
        <p class="text-sm font-semibold">Logo del gimnasio</p>
        <img
          v-if="logoSrc"
          :src="logoSrc"
          alt="Logo del gimnasio"
          class="h-24 w-24 rounded-xl object-contain bg-[var(--color-surface)]"
        />
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Seleccionar logo"
          :disabled="uploadingLogo"
          @change="selectLogo"
        />
        <BaseButton
          v-if="logoFile"
          :disabled="uploadingLogo"
          variant="secondary"
          @click="saveLogo"
          >{{ uploadingLogo ? 'Guardando…' : 'Guardar logo' }}</BaseButton
        >
        <p v-if="logoNotice" role="status" class="text-sm text-[var(--color-text-secondary)]">
          {{ logoNotice }}
        </p>
      </div>
    </div></BaseCard
  >
</template>
