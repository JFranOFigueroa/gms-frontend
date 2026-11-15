import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapBlock } from '@/api/mappers'
import { useIntegrationStore } from './useIntegrationStore'

// Conservar edición con debounce y sincronizar antes de reordenar o eliminar.
const updates = new Map() // id -> timer
const inFlight = new Map() // id -> promise
const failedSaves = new Set() // ids con escritura fallida

const toRequest = (b) => ({
  blockType: b.type,
  sortOrder: b.order,
  enabled: b.enabled,
  blockData: b.data,
})

function persist(block) {
  const id = block.id
  const payload = toRequest(block)
  const previous = inFlight.get(id)
  const promise = (async () => {
    if (previous) await previous.catch(() => {}) // escrituras ordenadas por bloque
    return useIntegrationStore().track('landing', () => api.site.landing.update(null, id, payload))
  })()
  inFlight.set(id, promise)
  promise.then(
    () => failedSaves.delete(id),
    () => failedSaves.add(id),
  )
  promise
    .finally(() => {
      if (inFlight.get(id) === promise) inFlight.delete(id)
    })
    .catch(() => {})
  return promise
}

export const useLandingStore = defineStore('landing', {
  state: () => ({ allBlocks: [] }),
  getters: {
    blocks: (s) => [...s.allBlocks].sort((a, b) => a.order - b.order),
    sortedBlocks() {
      return this.blocks.filter((b) => b.enabled)
    },
  },
  actions: {
    async load() {
      const rows = await useIntegrationStore().track('landing', () =>
        api.site.landing.list(null),
      )
      this.allBlocks = rows.map(mapBlock)
    },
    async addBlock(config) {
      const row = await useIntegrationStore().track('landing', () =>
        api.site.landing.create(null, {
          blockType: config.type,
          enabled: true,
          sortOrder: this.blocks.length,
          blockData: config.defaultData || {},
        }),
      )
      this.allBlocks.push(mapBlock(row))
      return row
    },
    updateBlock(id, payload) {
      const block = this.allBlocks.find((b) => b.id === id)
      if (!block) return
      Object.assign(block, payload, { data: { ...block.data, ...payload.data } })
      clearTimeout(updates.get(id))
      const timer = setTimeout(() => {
        updates.delete(id)
        const lastPersisted = persist(block)
        lastPersisted
          .then((row) => {
            if (!updates.has(id) && inFlight.get(id) === lastPersisted) {
              const current = this.allBlocks.find((b) => b.id === id)
              if (current) Object.assign(current, mapBlock(row))
            }
          })
          .catch(() => {
            /* El error queda disponible en el banner de integración. */
          })
      }, 600)
      updates.set(id, timer)
    },
    async flushPendingUpdates() {
      const jobs = []
      for (const [id, timer] of updates) {
        clearTimeout(timer)
        updates.delete(id)
        const block = this.allBlocks.find((b) => b.id === id)
        if (block) jobs.push(persist(block))
      }
      for (const id of failedSaves) {
        if (updates.has(id)) continue
        const block = this.allBlocks.find((b) => b.id === id)
        if (block) {
          failedSaves.delete(id)
          jobs.push(persist(block))
        }
      }
      jobs.push(...inFlight.values())
      // No continuar con reordenamientos o eliminaciones si hay escrituras fallidas.
      const settled = await Promise.allSettled(jobs)
      const failed = settled.find((r) => r.status === 'rejected')
      if (failed) throw failed.reason
    },
    async setBlocks(value) {
      await this.flushPendingUpdates()
      const changed = (value || []).map((b, i) => ({ ...b, order: i }))
      try {
        for (const b of changed)
          await useIntegrationStore().track('landing', () =>
            api.site.landing.update(null, b.id, toRequest(b)),
          )
        await this.load()
      } catch (error) {
        await this.load()
        throw error
      }
    },
    async toggleBlock(id) {
      const block = this.allBlocks.find((b) => b.id === id)
      if (!block) return
      const row = await useIntegrationStore().track('landing', () =>
        api.site.landing.update(null, id, { enabled: !block.enabled }),
      )
      Object.assign(block, mapBlock(row))
    },
    async removeBlock(id) {
      await this.flushPendingUpdates()
      await useIntegrationStore().track('landing', () => api.site.landing.remove(null, id))
      this.allBlocks = this.allBlocks.filter((b) => b.id !== id)
    },
  },
})
