import { ref, watch, onBeforeUnmount } from 'vue'
import { api } from '@/api/service'
import { resolveApiUrl } from '@/api/http'
import { useGymsStore } from '@/stores/useGymsStore'

/** Imagen privada: se pide con Bearer, nunca se asigna un endpoint privado a img.src. */
export function usePrivateMemberPhoto(memberRef) {
  const source = ref(null)
  const gyms = useGymsStore()
  let objectUrl = null
  let generation = 0
  function release() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = null
    source.value = null
  }
  watch(() => {
    const member = typeof memberRef === 'function' ? memberRef() : memberRef.value
    return [member?.gymId || gyms.activeGymId, member?.photoAssetId, member?.photo]
  }, async ([gym, asset, fallback]) => {
    const current = ++generation
    release()
    // Soportar URLs privadas antiguas que incluyen el identificador del archivo.
    const privatePath = typeof fallback === 'string' && /\/media-assets\/[^/]+\/content(?:\?|$)/.test(fallback)
    const match = privatePath && fallback.match(/\/media-assets\/([^/?]+)\/content/)
    const id = asset || (match ? decodeURIComponent(match[1]) : null)
    if (id && gym) {
      try {
        const blob = await api.media.content(gym, id)
        if (current !== generation) return
        if (blob.type?.startsWith('image/')) {
          objectUrl = URL.createObjectURL(blob)
          source.value = objectUrl
        }
      } catch { /* Imagen inexistente: avatar predeterminado. */ }
    } else if (typeof fallback === 'string' && /^(https:\/\/|data:image\/(?:png|jpeg|webp);base64,)/i.test(fallback)) {
      source.value = fallback
    } else if (typeof fallback === 'string' && /^\/api\/v1\/public\/media\//.test(fallback)) {
      source.value = resolveApiUrl(fallback)
    }
  }, { immediate: true })
  onBeforeUnmount(() => { generation++; release() })
  return { source }
}
