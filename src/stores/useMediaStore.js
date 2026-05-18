import { defineStore } from 'pinia'

export const useMediaStore = defineStore(
  'media',

  {
    state: () => ({
      assets: [
        {
          id: 1,

          name: 'Hero Banner',

          type: 'image',

          url: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200',
        },

        {
          id: 2,

          name: 'Gym Interior',

          type: 'image',

          url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200',
        },
      ],
    }),

    actions: {
      addAsset(asset) {
        this.assets.push(asset)
      },
    },
  },
)
