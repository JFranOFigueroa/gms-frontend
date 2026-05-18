import { defineStore } from 'pinia'

export const useBuilderStore = defineStore(
  'builder',

  {
    state: () => ({
      previewDevice: 'desktop',
    }),

    actions: {
      setPreviewDevice(device) {
        this.previewDevice = device
      },
    },
  },
)
