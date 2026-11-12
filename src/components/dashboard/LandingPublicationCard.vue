<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { useGymsStore } from '@/stores/useGymsStore'
import { useLandingPublicationStore } from '@/stores/useLandingPublicationStore'

const gyms = useGymsStore()
const pageLink = useLandingPublicationStore()
const slugDraft = ref('')
const notice = ref('')
const error = ref('')
const busy = computed(() => pageLink.saving || pageLink.loading)
const current = computed(() => (pageLink.gymId === gyms.activeGymId ? pageLink.details : null))
async function refresh() {
  notice.value = ''
  error.value = ''
  if (!gyms.activeGymId) return
  const gym = gyms.activeGymId
  try {
    const result = await pageLink.load(gym)
    if (gyms.activeGymId === gym) slugDraft.value = result.slug || ''
  } catch (e) {
    error.value = e.message
  }
}
onMounted(refresh)
watch(() => gyms.activeGymId, refresh)
async function saveLink() {
  const value = slugDraft.value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  error.value = ''
  notice.value = ''
  if (!/^[a-z0-9-]{3,80}$/.test(value)) {
    error.value = 'El enlace debe tener entre 3 y 80 letras, números o guiones.'
    return
  }
  if (value === current.value?.slug) return
  if (!confirm('Al cambiar el enlace, el anterior dejará de funcionar. ¿Deseas continuar?')) return
  try {
    await pageLink.changeSlug(value)
    slugDraft.value = pageLink.details?.slug || value
    notice.value = 'Enlace actualizado.'
  } catch (e) {
    error.value = e.message
  }
}
async function copyLink() {
  if (!pageLink.publicUrl) return
  try {
    await navigator.clipboard.writeText(pageLink.publicUrl)
    notice.value = 'Enlace copiado.'
  } catch {
    error.value = 'Selecciona y copia el enlace que aparece arriba.'
  }
}
</script>
<template>
  <BaseCard>
    <section class="space-y-4" aria-label="Enlace de la página del gimnasio">
      <div>
        <h2 class="text-xl font-black sm:text-2xl">Página de tu gimnasio</h2>
        <p class="text-sm text-[var(--color-text-secondary)] mt-1">
          Tu página muestra los cambios que guardes en este editor. Comparte el enlace con tus
          visitantes.
        </p>
      </div>
      <p v-if="pageLink.loading" role="status">Cargando enlace…</p>
      <template v-if="current">
        <div class="space-y-2">
          <label for="landing-slug" class="text-sm font-semibold">Enlace personalizado</label>
          <div class="flex flex-wrap items-end gap-3">
            <div class="flex-1 min-w-[180px]">
              <BaseInput
                id="landing-slug"
                v-model="slugDraft"
                :disabled="busy"
                placeholder="nombre-del-gimnasio"
              />
            </div>
            <BaseButton
              variant="secondary"
              :disabled="busy || !slugDraft.trim() || slugDraft.trim() === current.slug"
              @click="saveLink"
              >Guardar enlace</BaseButton
            >
          </div>
          <p class="text-xs text-[var(--color-text-secondary)]">
            El enlace usa inicialmente el nombre del gimnasio. Puedes cambiarlo cuando quieras.
          </p>
        </div>
        <div v-if="current.publicUrl" class="space-y-2">
          <p class="text-sm font-semibold">Enlace para compartir</p>
          <a
            :href="current.publicUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="block max-w-full break-all underline text-[var(--color-primary)]"
            >{{ current.publicUrl }}</a
          >
          <div class="flex flex-wrap gap-2">
            <BaseButton variant="secondary" :disabled="busy" @click="copyLink"
              >Copiar enlace</BaseButton
            >
            <a
              :href="current.publicUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center rounded-2xl border border-[var(--color-border)] px-4 py-3 font-semibold"
              >Ver página</a
            >
          </div>
        </div>
        <p v-else class="text-sm text-[var(--color-text-secondary)]">
          El enlace estará disponible cuando el gimnasio esté activo.
        </p>
      </template>
      <p v-if="error || pageLink.error" role="alert" class="text-sm text-red-400">
        {{ error || pageLink.error }}
      </p>
      <p v-if="notice" role="status" class="text-sm text-emerald-400">{{ notice }}</p>
      <BaseButton v-if="!current && !pageLink.loading" variant="secondary" @click="refresh"
        >Volver a intentar</BaseButton
      >
    </section>
  </BaseCard>
</template>
