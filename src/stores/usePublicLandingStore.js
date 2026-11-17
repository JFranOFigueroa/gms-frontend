import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapBlock } from '@/api/mappers'
import { resolveApiUrl } from '@/api/http'

/** Pantalla pública independiente de la sesión: solo usa el contrato anónimo del sitio. */
export const usePublicLandingStore = defineStore('public-landing', {
  state: () => ({ page: null, loading: false, error: '' }),
  actions: {
    clear() {
      this.page = null
      this.loading = false
      this.error = ''
    },
    async load() {
      this.loading = true
      this.error = ''
      try {
        const response = await api.site.publicPage()
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
          site: response?.site || null,
          theme: response?.theme || null,
          mediaAssets: assets,
          branches: Array.isArray(response?.branches) ? response.branches : [],
          blocks: (Array.isArray(response?.blocks) ? response.blocks : [])
            .map(mapBlock)
            .filter((block) => block.enabled !== false)
            .sort((a, b) => a.order - b.order),
        }
      } catch {
        this.page = null
        this.error = 'No fue posible mostrar la página del sitio.'
      } finally {
        this.loading = false
      }
    },
  },
})
