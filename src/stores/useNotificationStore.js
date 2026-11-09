import { defineStore } from 'pinia'
// Notificaciones de UI derivadas exclusivamente de registros reales de ventas/check-ins.
// Todavía no hay endpoint de notificaciones persistidas en Java.
export const useNotificationStore = defineStore('notifications', {
  state: () => ({ items: [] }),
  getters: {
    unreadCount: (s) => s.items.filter((i) => !i.read).length,
    sortedItems: (s) => [...s.items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
  },
  actions: {
    ensureNotification(item) {
      const prior = this.items.find((i) => i.id === item.id)
      if (prior) Object.assign(prior, { ...item, read: prior.read })
      else this.items.unshift({ ...item, read: false })
    },
    markAsRead(id) {
      const row = this.items.find((i) => i.id === id)
      if (row) row.read = true
    },
    markAllAsRead() {
      this.items.forEach((i) => (i.read = true))
    },
    removeNotification(id) {
      this.items = this.items.filter((i) => i.id !== id)
    },
    removeByPrefix(prefix) {
      this.items = this.items.filter((i) => !i.id.startsWith(prefix))
    },
    reset() {
      this.items = []
    },
  },
})
