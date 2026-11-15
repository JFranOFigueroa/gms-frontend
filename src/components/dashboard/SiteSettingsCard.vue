<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { api } from '@/api/service'
import { resolveApiUrl } from '@/api/http'
import { validateImageFile } from '@/stores/useMediaStore'

const settings = ref(null)
const form = ref({
  siteName: '',
  shortName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  timezone: 'America/Mexico_City',
  currency: 'MXN',
})
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const logoFile = ref(null)
const logoPreview = ref(null)
const uploadingLogo = ref(false)
let previewUrl = null

const logoSrc = computed(
  () => logoPreview.value || resolveApiUrl(settings.value?.logoUrl || settings.value?.logo_url),
)

const releaseLogo = () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  previewUrl = null
  logoPreview.value = null
  logoFile.value = null
}

const apply = (data) => {
  settings.value = data
  form.value = {
    siteName: data?.siteName || data?.site_name || '',
    shortName: data?.shortName || data?.short_name || '',
    contactEmail: data?.contactEmail || data?.contact_email || '',
    contactPhone: data?.contactPhone || data?.contact_phone || '',
    address: data?.address || '',
    timezone: data?.timezone || 'America/Mexico_City',
    currency: data?.currency || 'MXN',
  }
}

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    apply(await api.site.settings.get())
  } catch (e) {
    error.value = e.message || 'No se pudo cargar la configuración del sitio.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
onBeforeUnmount(releaseLogo)

const save = async () => {
  if (!form.value.siteName.trim()) {
    error.value = 'El nombre del sitio es obligatorio.'
    return
  }
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const data = await api.site.settings.update({
      siteName: form.value.siteName.trim(),
      shortName: form.value.shortName.trim(),
      contactEmail: form.value.contactEmail.trim(),
      contactPhone: form.value.contactPhone.trim(),
      address: form.value.address.trim(),
      timezone: form.value.timezone.trim(),
      currency: form.value.currency.trim().toUpperCase(),
    })
    apply(data)
    notice.value = 'Configuración del sitio guardada.'
  } catch (e) {
    error.value = e.message || 'No se pudo guardar la configuración.'
  } finally {
    saving.value = false
  }
}

const selectLogo = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  releaseLogo()
  notice.value = ''
  try {
    validateImageFile(file)
    logoFile.value = file
    previewUrl = URL.createObjectURL(file)
    logoPreview.value = previewUrl
  } catch (e) {
    error.value = e.message
  }
}

const saveLogo = async () => {
  if (!logoFile.value) return
  uploadingLogo.value = true
  error.value = ''
  notice.value = ''
  try {
    const asset = await api.site.media.upload(logoFile.value, 'Logo del sitio')
    apply(await api.site.settings.update({ logoAssetId: asset.id }))
    releaseLogo()
    notice.value = 'Logo del sitio actualizado.'
  } catch (e) {
    error.value = e.message || 'No se pudo actualizar el logo.'
  } finally {
    uploadingLogo.value = false
  }
}
</script>

<template>
  <BaseCard>
    <div class="space-y-4">
      <div>
        <h2 class="text-xl font-black sm:text-2xl">Identidad del sitio</h2>
        <p class="text-sm text-[var(--color-text-secondary)]">
          Nombre, contacto y logo de la marca. No dependen de ninguna sucursal.
        </p>
      </div>

      <p v-if="loading" role="status" class="text-sm text-[var(--color-text-secondary)]">
        Cargando configuración…
      </p>

      <template v-else>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="block space-y-1 text-sm">
            <span>Nombre del sitio</span>
            <BaseInput v-model="form.siteName" />
          </label>
          <label class="block space-y-1 text-sm">
            <span>Nombre corto</span>
            <BaseInput v-model="form.shortName" />
          </label>
          <label class="block space-y-1 text-sm">
            <span>Correo de contacto</span>
            <BaseInput v-model="form.contactEmail" type="email" />
          </label>
          <label class="block space-y-1 text-sm">
            <span>Teléfono de contacto</span>
            <BaseInput v-model="form.contactPhone" />
          </label>
          <label class="block space-y-1 text-sm sm:col-span-2">
            <span>Dirección</span>
            <BaseInput v-model="form.address" />
          </label>
          <label class="block space-y-1 text-sm">
            <span>Zona horaria</span>
            <BaseInput v-model="form.timezone" placeholder="America/Mexico_City" />
          </label>
          <label class="block space-y-1 text-sm">
            <span>Moneda</span>
            <BaseInput v-model="form.currency" maxlength="3" />
          </label>
        </div>

        <p v-if="error" role="alert" class="text-red-400">{{ error }}</p>
        <p v-if="notice" role="status" class="text-sm text-emerald-400">{{ notice }}</p>

        <BaseButton :disabled="saving" @click="save">
          {{ saving ? 'Guardando…' : 'Guardar identidad' }}
        </BaseButton>

        <div class="space-y-3 border-t border-[var(--color-border)] pt-4">
          <p class="text-sm font-semibold">Logo del sitio</p>
          <img
            v-if="logoSrc"
            :src="logoSrc"
            alt="Logo del sitio"
            class="h-24 w-24 rounded-xl bg-[var(--color-surface)] object-contain"
          />
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Seleccionar logo del sitio"
            :disabled="uploadingLogo"
            @change="selectLogo"
          />
          <BaseButton
            v-if="logoFile"
            :disabled="uploadingLogo"
            variant="secondary"
            @click="saveLogo"
          >
            {{ uploadingLogo ? 'Guardando…' : 'Guardar logo' }}
          </BaseButton>
        </div>
      </template>
    </div>
  </BaseCard>
</template>
