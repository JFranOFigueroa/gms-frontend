import { defineStore } from 'pinia'

export const useLandingStore = defineStore(
  'landing',

  {
    state: () => ({
      blocks: [
        {
          id: 1,

          type: 'hero',

          enabled: true,

          order: 1,

          data: {
            badge: 'GMS FITNESS',

            title: 'Transforma tu cuerpo y mente',

            subtitle: 'Entrena con coaches profesionales.',

            slides: [1, 2],
          },
        },

        {
          id: 2,

          type: 'text',

          enabled: true,

          order: 2,

          data: {
            title: 'Acerca de Nosotros',

            subtitle: 'Nuestra filosofía',

            text: 'Creamos experiencias fitness enfocadas en resultados.',
          },
        },
      ],
    }),

    persist: true,

    getters: {
      sortedBlocks: (state) => {
        return state.blocks.filter((block) => block.enabled).sort((a, b) => a.order - b.order)
      },
    },

    actions: {
      updateBlock(id, payload) {
        const block = this.blocks.find((block) => block.id === id)

        if (!block) return

        Object.assign(block, {
          ...payload,

          data: {
            ...block.data,

            ...(payload.data || {}),
          },
        })
      },

      recalculateOrder() {
        this.blocks.forEach((block, index) => {
          block.order = index + 1
        })
      },

      toggleBlock(id) {
        const block = this.blocks.find((block) => block.id === id)

        if (block) {
          block.enabled = !block.enabled
        }
      },
      addBlock(config) {
        this.blocks.push({
          id: Date.now(),
          type: config.type,
          enabled: true,
          order: this.blocks.length + 1,
          data: structuredClone(config.defaultData),
        })
      },
      removeBlock(blockId) {
        this.blocks = this.blocks.filter((block) => block.id !== blockId)

        this.recalculateOrder()
      },
    },
  },
)
