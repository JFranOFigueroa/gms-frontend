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
    class="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-3xl p-10 cursor-pointer hover:border-white transition-all"
  >
    <div class="text-center">
      <p class="text-2xl font-bold">Subir Imagen</p>

      <p class="text-zinc-500 mt-2">PNG, JPG o WEBP</p>
    </div>

    <input type="file" accept="image/*" class="hidden" @change="handleUpload" />
  </label>
</template>
