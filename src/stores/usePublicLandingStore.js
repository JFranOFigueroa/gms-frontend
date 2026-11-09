import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapBlock } from '@/api/mappers'
import { resolveApiUrl } from '@/api/http'

/** Pantalla pública independiente de la sesión: solo usa el contrato anónimo. */
export const usePublicLandingStore = defineStore('public-landing', {
  state: () => ({ slug: null, page: null, loading: false, error: '', notFound: false }),
  actions: {
    clear() {
      this.slug = null
      this.page = null
      this.loading = false
      this.error = ''
      this.notFound = false
    },
    async load(slug) {
      this.slug = slug
      this.page = null
      this.loading = true
      this.error = ''
      this.notFound = false
      try {
        const response = await api.landing.publicPage(slug)
        if (this.slug !== slug) return
        const assets = (Array.isArray(response?.mediaAssets) ? response.mediaAssets : []).map(
          (asset) => ({
            ...asset,
            url: resolveApiUrl(
              asset.url ||
                asset.contentUrl ||
                (asset.id ? `/api/v1/public/media/${encodeURIComponent(asset.id)}` : null),
            ),
          }),
        )
        this.page = {
          gym: response?.gym || null,
          theme: response?.theme || null,
          mediaAssets: assets,
          blocks: (Array.isArray(response?.blocks) ? response.blocks : [])
            .map(mapBlock)
            .filter((block) => block.enabled !== false)
            .sort((a, b) => a.order - b.order),
        }
      } catch (error) {
        if (this.slug !== slug) return
        this.notFound = error.status === 404
        this.error =
          error.status === 404
            ? 'No encontramos la página de este gimnasio.'
            : 'No fue posible mostrar la página de este gimnasio.'
      } finally {
        if (this.slug === slug) this.loading = false
      }
    },
  },
})
