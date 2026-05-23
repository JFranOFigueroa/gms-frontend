import { defineStore } from 'pinia'

export const useClassTemplateStore = defineStore(
  'class-templates',

  {
    state: () => ({
      templates: [
        {
          id: 1,

          name: 'Full Body',

          color: '#22c55e',

          duration: 60,

          capacity: 20,

          category: 'functional',
        },
      ],
    }),

    actions: {
      addTemplate(template) {
        this.templates.push({
          id: Date.now(),

          ...template,
        })
      },

      removeTemplate(id) {
        this.templates = this.templates.filter((t) => t.id !== id)
      },
    },
  },
)
