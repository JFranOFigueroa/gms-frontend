import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapTemplate } from '@/api/mappers'
import { useBranchesStore } from './useBranchesStore'
import { useIntegrationStore } from './useIntegrationStore'
export const useClassTemplateStore = defineStore('class-templates', {
  state: () => ({ allTemplates: [] }),
  getters: {
    templates: (s) =>
      s.allTemplates.filter((t) => t.branchId === useBranchesStore().activeBranchId),
  },
  actions: {
    async load(branch = useBranchesStore().activeBranchId) {
      if (!branch) {
        this.allTemplates = []
        return
      }
      const rows = await useIntegrationStore().track('plantillas', () => api.templates.list(branch))
      if (branch === useBranchesStore().activeBranchId) this.allTemplates = rows.map(mapTemplate)
    },
    async addTemplate(data) {
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('plantillas', () =>
        api.templates.create(branch, {
          name: data.name,
          color: data.color,
          durationMinutes: Number(data.duration),
          capacity: Number(data.capacity),
          category: data.category || 'normal',
        }),
      )
      this.allTemplates.push(mapTemplate(row))
      return row
    },
    async updateTemplate(id, data) {
      const branch = useBranchesStore().activeBranchId
      const row = await useIntegrationStore().track('plantillas', () =>
        api.templates.update(branch, id, {
          name: data.name,
          color: data.color,
          durationMinutes: Number(data.duration),
          capacity: Number(data.capacity),
          category: data.category || 'normal',
        }),
      )
      if (branch === useBranchesStore().activeBranchId) {
        this.allTemplates = this.allTemplates.map((template) =>
          template.id === id ? mapTemplate(row) : template,
        )
      }
      return row
    },
    async removeTemplate(id) {
      const branch = useBranchesStore().activeBranchId
      await useIntegrationStore().track('plantillas', () => api.templates.remove(branch, id))
      this.allTemplates = this.allTemplates.filter((t) => t.id !== id)
    },
  },
})
