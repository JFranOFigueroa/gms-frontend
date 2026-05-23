import { defineStore } from 'pinia'

export const useClassScheduleStore = defineStore(
  'class-schedule',

  {
    state: () => ({
      classes: [],
    }),

    actions: {
      addClass(payload) {
        this.classes.push({
          id: Date.now(),

          ...payload,
        })
      },

      removeClass(id) {
        this.classes = this.classes.filter((c) => c.id !== id)
      },
    },
  },
)
