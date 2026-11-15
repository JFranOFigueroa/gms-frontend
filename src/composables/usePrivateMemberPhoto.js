import { ref, watch, onBeforeUnmount } from 'vue'
import { api } from '@/api/service'
import { resolveApiUrl } from '@/api/http'
import { useBranchesStore } from '@/stores/useBranchesStore'

/** Imagen privada: se pide con Bearer, nunca se asigna un endpoint privado a img.src. */
export function usePrivateMemberPhoto(memberRef) {
  const source = ref(null)
  const branches = useBranchesStore()
  let objectUrl = null
  let generation = 0
  const currentMember = () =>
    typeof memberRef === 'function' ? memberRef() : memberRef.value

  function release() {
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    objectUrl = null
    source.value = null
  }

  watch(
    () => {
      const member = currentMember()
      return [member?.branchId || branches.activeBranchId, member?.id, member?.photo]
    },
    async ([branch, memberId, fallback]) => {
      const current = ++generation
      release()
      const privatePhoto =
        typeof fallback === 'string' && /\/members\/[^/]+\/photo(?:\?|$)/.test(fallback)
      if (privatePhoto && memberId && branch) {
        try {
          const blob = await api.members.photo(branch, memberId)
          if (current !== generation) return
          if (blob.type?.startsWith('image/')) {
            objectUrl = URL.createObjectURL(blob)
            source.value = objectUrl
          }
        } catch {
          /* Imagen inexistente: avatar predeterminado. */
        }
      } else if (
        typeof fallback === 'string' &&
        /^(https:\/\/|data:image\/(?:png|jpeg|webp);base64,)/i.test(fallback)
      ) {
        source.value = fallback
      } else if (typeof fallback === 'string' && fallback.startsWith('/api/v1/public/media/')) {
        source.value = resolveApiUrl(fallback)
      }
    },
    { immediate: true },
  )
  onBeforeUnmount(() => {
    generation++
    release()
  })
  return { source }
}
