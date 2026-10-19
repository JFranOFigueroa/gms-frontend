import { defineStore } from 'pinia'

export const useGymsStore = defineStore(
  'gyms',

  {
    state: () => ({
      gyms: [
        {
          id: 1,
          name: 'Gym Manager Software',
          shortName: 'GMS',
          logo: null,
          address: '',
          phone: '',
          active: true,
          createdAt: '2026-01-01',
        },
        {
          id: 2,
          name: 'Iron Temple Fitness',
          shortName: 'ITF',
          logo: null,
          address: '',
          phone: '',
          active: true,
          createdAt: '2026-01-10',
        },
      ],
      activeGymId: 1,
    }),

    persist: true,

    getters: {
      activeGym(state) {
        return state.gyms.find((gym) => gym.id === state.activeGymId) || state.gyms[0] || null
      },
    },

    actions: {
      getGymById(id) {
        return this.gyms.find((gym) => gym.id === id) || null
      },

      setActiveGym(id) {
        if (this.gyms.some((gym) => gym.id === id)) {
          this.activeGymId = id
        }
      },

      addGym(payload) {
        const gym = {
          id: Date.now(),
          logo: null,
          address: '',
          phone: '',
          active: true,
          createdAt: new Date().toISOString().split('T')[0],
          ...payload,
        }

        this.gyms.push(gym)

        return gym
      },

      updateGym(id, payload) {
        const index = this.gyms.findIndex((gym) => gym.id === id)

        if (index === -1) return

        this.gyms[index] = {
          ...this.gyms[index],
          ...payload,
        }
      },

      removeGym(id) {
        if (this.gyms.length <= 1) return

        this.gyms = this.gyms.filter((gym) => gym.id !== id)

        if (this.activeGymId === id) {
          this.activeGymId = this.gyms[0]?.id ?? null
        }
      },
    },
  },
)