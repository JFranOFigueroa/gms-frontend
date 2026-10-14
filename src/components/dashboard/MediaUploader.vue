<script setup>
import { useMediaStore } from '@/stores/useMediaStore'

const mediaStore = useMediaStore()

const handleUpload = (event) => {
  const file = event.target.files[0]

  if (!file) return

  const url = URL.createObjectURL(file)

  mediaStore.addAsset({
    id: Date.now(),

    name: file.name,

    type: 'image',

    url,
  })
}
</script>

<template>
  <label
    class="flex flex-col items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-3xl p-10 cursor-pointer hover:border-[var(--color-primary)] transition-all"
  >
    <div class="text-center">
      <p class="text-2xl font-bold">Subir Imagen</p>

      <p class="text-[var(--color-text-secondary)] mt-2">PNG, JPG o WEBP</p>
    </div>

    <input type="file" accept="image/*" class="hidden" @change="handleUpload" />
  </label>
</template>
