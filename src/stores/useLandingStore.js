import { defineStore } from 'pinia'

import { useGymsStore } from '@/stores/useGymsStore'

const createDefaultBlocks = (gymId) => [
  {
    id: gymId * 1000 + 1,
    gymId,
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
    id: gymId * 1000 + 2,
    gymId,
    type: 'text',
    enabled: true,
    order: 2,
    data: {
      title: 'Acerca de Nosotros',
      subtitle: 'Nuestra filosofía',
      text: 'Creamos experiencias fitness enfocadas en resultados.',
    },
  },
]

export const useLandingStore = defineStore(
  'landing',

  {
    state: () => ({
      allBlocks: [...createDefaultBlocks(1), ...createDefaultBlocks(2)],
    }),

    persist: {
      key: 'gms-landing-v2',
    },

    getters: {
      blocks(state) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        return state.allBlocks
          .filter((block) => block.gymId == null || block.gymId === activeGymId)
          .sort((a, b) => a.order - b.order)
      },

      sortedBlocks() {
        return this.blocks.filter((block) => block.enabled)
      },
    },

    actions: {
      seedDefaultsForGym(gymId) {
        const alreadyHasBlocks = this.allBlocks.some((block) => block.gymId === gymId)

        if (alreadyHasBlocks) return

        this.allBlocks.push(...createDefaultBlocks(gymId))
      },

      setBlocks(value) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        const others = this.allBlocks.filter((block) => block.gymId !== activeGymId)

        const reordered = (value || []).map((block, index) => ({
          ...block,
          gymId: activeGymId,
          order: index + 1,
        }))

        this.allBlocks = [...others, ...reordered]
      },

      updateBlock(id, payload) {
        const block = this.allBlocks.find((entry) => entry.id === id)

        if (!block) return

        Object.assign(block, {
          ...payload,

          data: {
            ...block.data,

            ...payload.data,
          },
        })
      },

      recalculateOrder() {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        this.allBlocks
          .filter((block) => block.gymId === activeGymId)
          .sort((a, b) => a.order - b.order)
          .forEach((block, index) => {
            block.order = index + 1
          })
      },

      toggleBlock(id) {
        const block = this.allBlocks.find((entry) => entry.id === id)

        if (block) {
          block.enabled = !block.enabled
        }
      },

      addBlock(config) {
        const gymsStore = useGymsStore()
        const activeGymId = gymsStore.activeGymId

        const activeCount = this.allBlocks.filter((block) => block.gymId === activeGymId).length

        this.allBlocks.push({
          id: Date.now(),
          gymId: activeGymId,
          type: config.type,
          enabled: true,
          order: activeCount + 1,
          data: structuredClone(config.defaultData),
        })
      },

      removeBlock(blockId) {
        this.allBlocks = this.allBlocks.filter((block) => block.id !== blockId)

        this.recalculateOrder()
      },
    },
  },
)
