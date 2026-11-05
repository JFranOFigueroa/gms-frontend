import { defineStore } from 'pinia';
import { api } from '@/api/service';
import { mapMedia } from '@/api/mappers';
import { useGymsStore } from './useGymsStore';
import { useIntegrationStore } from './useIntegrationStore';

const supportedTypes = ['image/png', 'image/jpeg', 'image/webp'];
const maxFileSize = 8 * 1024 * 1024;
export function validateImageFile(file) {
  if (!file || !supportedTypes.includes(file.type)) throw new Error('Selecciona una imagen PNG, JPG o WebP.');
  if (file.size > maxFileSize) throw new Error('La imagen no puede superar 8 MB.');
}

export const useMediaStore = defineStore('media', {
  state: () => ({ assets: [] }),
  getters: { media: s => s.assets.filter(a => a.gymId === useGymsStore().activeGymId) },
  actions: {
    clear() {
      for (const asset of this.assets) if (asset.url?.startsWith('blob:')) URL.revokeObjectURL(asset.url);
      this.assets = [];
    },
    async load(gym = useGymsStore().activeGymId) {
      if (!gym) { this.clear(); return; }
      const rows = await useIntegrationStore().track('multimedia', () => api.media.list(gym));
      // Las imágenes locales son privadas dentro del editor, nunca usar su URL sin Bearer.
      const assets = await Promise.all(rows.map(async (row) => {
        const asset = mapMedia(row);
        if (!asset.url && asset.id) {
          try {
            const blob = await api.media.content(gym, asset.id);
            if (blob.type.startsWith('image/')) asset.url = URL.createObjectURL(blob);
          } catch (error) {
            // Un archivo no encontrado no debe impedir mostrar las demás imágenes.
            if (error.status !== 404) useIntegrationStore().errors.multimedia = 'Algunas imágenes no se pudieron cargar.';
          }
        }
        return asset;
      }));
      if (gym === useGymsStore().activeGymId) { this.clear(); this.assets = assets; }
      else for (const asset of assets) if (asset.url?.startsWith('blob:')) URL.revokeObjectURL(asset.url);
    },
    async addAsset(asset) {
      if (!asset.url?.startsWith('https://')) throw new Error('Utiliza un enlace seguro que comience con https://.');
      const gym = useGymsStore().activeGymId;
      const row = await useIntegrationStore().track('multimedia', () => api.media.create(gym, {
        name: asset.name, mediaType: asset.type || 'image', externalUrl: asset.url,
      }));
      this.assets.push(mapMedia(row)); return row;
    },
    async uploadFile(file, name = '') {
      validateImageFile(file);
      const gym = useGymsStore().activeGymId;
      const row = await useIntegrationStore().track('multimedia', () => api.media.upload(gym, file, name));
      const asset = mapMedia(row);
      asset.url = URL.createObjectURL(file);
      // Si se cambia de gimnasio durante la subida no filtrar su imagen en otro gimnasio.
      if (gym === useGymsStore().activeGymId) this.assets.push(asset);
      else URL.revokeObjectURL(asset.url);
      return row;
    },
  },
});
