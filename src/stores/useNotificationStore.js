import { defineStore } from 'pinia'

export const useNotificationStore = defineStore(
  'notifications',

  {
    state: () => ({
      items: [],
    }),

    persist: true,

    getters: {
      unreadCount(state) {
        return state.items.filter((item) => !item.read).length
      },

      sortedItems(state) {
        return [...state.items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      },
    },

    actions: {
      ensureNotification(item) {
        const existing = this.items.find((notification) => notification.id === item.id)

        if (!existing) {
          this.items.unshift({
            ...item,
            read: false,
          })

          return
        }

        Object.assign(existing, {
          ...item,
          read: existing.read,
        })
      },

      markAsRead(id) {
        const item = this.items.find((notification) => notification.id === id)

        if (item) item.read = true
      },

      markAllAsRead() {
        this.items.forEach((item) => {
          item.read = true
        })
      },

      removeNotification(id) {
        this.items = this.items.filter((notification) => notification.id !== id)
      },

      removeByPrefix(prefix) {
        this.items = this.items.filter((notification) => !notification.id.startsWith(prefix))
      },
    },
  },
)