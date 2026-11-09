import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapBlock } from '@/api/mappers'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'
// Conservar edición con debounce y sincronizar antes de reordenar o eliminar.
const updates = new Map() // id -> { timer, gym }
const inFlight = new Map() // id -> { gym, promise }
const failedSaves = new Map() // id -> gym; reintentar tras error
let editSerial = 0
function persist(block, gym) {
  const id = block.id,
    payload = toRequest(block),
    serial = ++editSerial
  const previous = inFlight.get(id)?.promise
  const promise = (async () => {
    if (previous) await previous.catch(() => {}) // escrituras ordenadas por bloque
    return useIntegrationStore().track('landing', () => api.landing.update(gym, id, payload))
  })()
  inFlight.set(id, { gym, promise, serial })
  promise.then(
    () => failedSaves.delete(id),
    () => failedSaves.set(id, gym),
  )
  promise
    .finally(() => {
      if (inFlight.get(id)?.serial === serial) inFlight.delete(id)
    })
    .catch(() => {})
  return promise
}
const toRequest = (b) => ({
  blockType: b.type,
  sortOrder: b.order,
  enabled: b.enabled,
  blockData: b.data,
})
export const useLandingStore = defineStore('landing', {
  state: () => ({ allBlocks: [] }),
  getters: {
    blocks: (s) =>
      s.allBlocks
        .filter((b) => b.gymId === useGymsStore().activeGymId)
        .sort((a, b) => a.order - b.order),
    sortedBlocks() {
      return this.blocks.filter((b) => b.enabled)
    },
  },
  actions: {
    async load(gym = useGymsStore().activeGymId) {
      if (!gym) {
        this.allBlocks = []
        return
      }
      const rows = await useIntegrationStore().track('landing', () => api.landing.list(gym))
      if (gym === useGymsStore().activeGymId) this.allBlocks = rows.map(mapBlock)
    },
    seedDefaultsForGym() {
      /* No crear bloques ficticios al registrar un gimnasio. */
    },
    async addBlock(config) {
      const gym = useGymsStore().activeGymId
      const row = await useIntegrationStore().track('landing', () =>
        api.landing.create(gym, {
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
      clearTimeout(updates.get(id)?.timer)
      const gym = block.gymId
      const timer = setTimeout(() => {
        updates.delete(id)
        const lastPersisted = persist(block, gym)
        lastPersisted
          .then((row) => {
            if (!updates.has(id) && inFlight.get(id)?.promise === lastPersisted) {
              const current = this.allBlocks.find((b) => b.id === id)
              if (current) Object.assign(current, mapBlock(row))
            }
          })
          .catch(() => {
            /* El error queda disponible en el banner de integración. */
          })
      }, 600)
      updates.set(id, { timer, gym })
    },
    async flushPendingUpdates(gym = useGymsStore().activeGymId) {
      const jobs = []
      for (const [id, pending] of updates) {
        if (pending.gym !== gym) continue
        clearTimeout(pending.timer)
        updates.delete(id)
        const block = this.allBlocks.find((b) => b.id === id)
        if (block) jobs.push(persist(block, gym))
      }
      for (const [id, failedGym] of failedSaves) {
        if (failedGym !== gym || updates.has(id)) continue
        const block = this.allBlocks.find((b) => b.id === id)
        if (block) {
          failedSaves.delete(id)
          jobs.push(persist(block, gym))
        }
      }
      for (const item of inFlight.values()) if (item.gym === gym) jobs.push(item.promise)
      // No continuar con reordenamientos o eliminaciones si hay escrituras fallidas.
      const settled = await Promise.allSettled(jobs)
      const failed = settled.find((r) => r.status === 'rejected')
      if (failed) throw failed.reason
    },
    async setBlocks(value) {
      const gym = useGymsStore().activeGymId
      await this.flushPendingUpdates(gym)
      const changed = (value || []).map((b, i) => ({ ...b, order: i }))
      try {
        for (const b of changed)
          await useIntegrationStore().track('landing', () =>
            api.landing.update(gym, b.id, toRequest(b)),
          )
        await this.load(gym)
      } catch (error) {
        await this.load(gym)
        throw error
      }
    },
    recalculateOrder() {},
    async toggleBlock(id) {
      const block = this.allBlocks.find((b) => b.id === id)
      if (!block) return
      const row = await useIntegrationStore().track('landing', () =>
        api.landing.update(block.gymId, id, { enabled: !block.enabled }),
      )
      Object.assign(block, mapBlock(row))
    },
    async removeBlock(id) {
      const gym = useGymsStore().activeGymId
      await this.flushPendingUpdates(gym)
      await useIntegrationStore().track('landing', () => api.landing.remove(gym, id))
      this.allBlocks = this.allBlocks.filter((b) => b.id !== id)
    },
  },
})
