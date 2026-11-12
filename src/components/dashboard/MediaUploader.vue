<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { useMediaStore, validateImageFile } from '@/stores/useMediaStore'

const mediaStore = useMediaStore()
const name = ref('')
const url = ref('')
const preview = ref('')
const notice = ref('')
const saving = ref(false)
const selectedFile = ref(null)
const uploadInput = ref(null)
let localObjectUrl = null
const clearPreview = () => {
  if (localObjectUrl) URL.revokeObjectURL(localObjectUrl)
  localObjectUrl = null
  preview.value = ''
  selectedFile.value = null
  if (uploadInput.value) uploadInput.value.value = ''
}
const handleUpload = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  notice.value = ''
  clearPreview()
  try {
    validateImageFile(file)
    selectedFile.value = file
    localObjectUrl = URL.createObjectURL(file)
    preview.value = localObjectUrl
    name.value = name.value.trim() || file.name
  } catch (error) {
    notice.value = error.message
  }
}
onBeforeUnmount(clearPreview)
const saveUpload = async () => {
  if (!selectedFile.value || saving.value) return
  notice.value = ''
  saving.value = true
  try {
    await mediaStore.uploadFile(selectedFile.value, name.value.trim() || selectedFile.value.name)
    clearPreview()
    name.value = ''
    notice.value = 'Imagen guardada correctamente.'
  } catch (error) {
    notice.value = error.message || 'No fue posible subir la imagen.'
  } finally {
    saving.value = false
  }
}
const saveUrl = async () => {
  notice.value = ''
  if (!name.value.trim() || !/^https:\/\//i.test(url.value.trim())) {
    notice.value = 'Para guardar necesitas un nombre y una URL pública HTTPS.'
    return
  }
  saving.value = true
  try {
    await mediaStore.addAsset({ name: name.value.trim(), type: 'image', url: url.value.trim() })
    name.value = ''
    url.value = ''
    clearPreview()
    notice.value = 'Imagen guardada correctamente.'
  } catch (error) {
    notice.value = error.message || 'No fue posible guardar la imagen.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <label
      class="flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--color-border)] p-6 transition-all hover:border-[var(--color-primary)] sm:p-10"
    >
      <div class="text-center">
        <p class="text-xl font-bold sm:text-2xl">Subir Imagen</p>
        <p class="mt-2 text-sm text-[var(--color-text-secondary)] sm:text-base">
          PNG, JPG o WEBP · máximo 8 MB
        </p>
      </div>
      <input
        ref="uploadInput"
        type="file"
        accept="image/png,image/jpeg,image/webp"
        class="hidden"
        :disabled="saving"
        @change="handleUpload"
      />
    </label>
    <img
      v-if="preview"
      :src="preview"
      alt="Vista previa de imagen"
      class="max-h-64 w-full rounded-2xl border border-[var(--color-border)] object-contain"
    />
    <div class="space-y-3 rounded-2xl border border-[var(--color-border)] p-4">
      <input
        v-model="name"
        placeholder="Nombre de imagen"
        class="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base"
      />
      <button
        v-if="selectedFile"
        type="button"
        :disabled="saving"
        class="rounded-xl border border-[var(--color-border)] px-5 py-3"
        @click="saveUpload"
      >
        {{ saving ? 'Subiendo…' : 'Guardar imagen' }}
      </button>
      <p class="text-sm text-[var(--color-text-secondary)]">
        También puedes registrar una imagen con su URL HTTPS.
      </p>
      <input
        v-model="url"
        placeholder="https://..."
        class="w-full min-w-0 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-base"
      />
      <button
        type="button"
        :disabled="saving"
        class="rounded-xl border border-[var(--color-border)] px-5 py-3"
        @click="saveUrl"
      >
        {{ saving ? 'Guardando…' : 'Registrar imagen por URL' }}
      </button>
      <p v-if="notice" role="status" class="text-sm text-[var(--color-text-secondary)]">
        {{ notice }}
      </p>
    </div>
  </div>
</template>
