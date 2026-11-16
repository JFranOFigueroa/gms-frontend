import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapMedia } from '@/api/mappers'
import { resolveApiUrl } from '@/api/http'
import { useIntegrationStore } from './useIntegrationStore'

const supportedTypes = ['image/png', 'image/jpeg', 'image/webp']
const maxFileSize = 8 * 1024 * 1024
export function validateImageFile(file) {
  if (!file || !supportedTypes.includes(file.type))
    throw new Error('Selecciona una imagen PNG, JPG o WebP.')
  if (file.size > maxFileSize) throw new Error('La imagen no puede superar 8 MB.')
}

const withUrl = (row) => {
  const asset = mapMedia(row)
  return { ...asset, url: resolveApiUrl(asset.url) }
}

export const useMediaStore = defineStore('media', {
  state: () => ({ assets: [] }),
  getters: { media: (s) => s.assets },
  actions: {
    clear() {
      this.assets = []
    },
    async load() {
      const rows = await useIntegrationStore().track('multimedia', () => api.site.media.list(null))
      this.assets = rows.map(withUrl)
    },
    async addAsset(asset) {
      if (!asset.url?.startsWith('https://'))
        throw new Error('Utiliza un enlace seguro que comience con https://.')
      const row = await useIntegrationStore().track('multimedia', () =>
        api.site.media.create(null, {
          name: asset.name,
          mediaType: asset.type || 'image',
          externalUrl: asset.url,
        }),
      )
      this.assets.unshift(withUrl(row))
      return row
    },
    async uploadFile(file, name = '') {
      validateImageFile(file)
      const row = await useIntegrationStore().track('multimedia', () =>
        api.site.media.upload(file, name),
      )
      this.assets.unshift(withUrl(row))
      return row
    },
  },
})
