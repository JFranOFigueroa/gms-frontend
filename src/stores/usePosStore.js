import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapProduct, mapSale } from '@/api/mappers'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'
export const usePosStore = defineStore('pos', {
  state: () => ({ allProducts: [], allSales: [], cart: [] }),
  getters: {
    products: (s) => s.allProducts.filter((p) => p.gymId === useGymsStore().activeGymId),
    sales: (s) => s.allSales.filter((sale) => sale.gymId === useGymsStore().activeGymId),
    cartTotal: (s) => s.cart.reduce((sum, i) => sum + i.price * i.qty, 0),
    totalRevenue() {
      return this.sales.reduce((sum, s) => sum + s.total, 0)
    },
    totalSales() {
      return this.sales.length
    },
    lowStockProducts() {
      return this.products.filter((p) => p.stock <= (p.lowStockThreshold ?? 5))
    },
    salesByProduct() {
      const map = new Map()
      for (const sale of this.sales)
        for (const item of sale.items) {
          const row = map.get(item.productId) || {
            productId: item.productId,
            name: item.name,
            qty: 0,
            revenue: 0,
          }
          row.qty += item.qty
          row.revenue += item.price * item.qty
          map.set(item.productId, row)
        }
      return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
    },
  },
  actions: {
    async load(gym = useGymsStore().activeGymId) {
      if (!gym) {
        this.allProducts = []
        this.allSales = []
        return
      }
      const [products, sales] = await Promise.all([
        useIntegrationStore().track('productos', () => api.products.list(gym)),
        useIntegrationStore().track('ventas', () => api.sales.list(gym)),
      ])
      if (useGymsStore().activeGymId === gym) {
        this.allProducts = products.map(mapProduct)
        this.allSales = sales.map(mapSale)
      }
    },
    addToCart(product) {
      if (product.stock <= 0) return
      const row = this.cart.find((i) => i.productId === product.id)
      if (row) {
        if (row.qty < product.stock) row.qty++
      } else
        this.cart.push({ productId: product.id, name: product.name, price: product.price, qty: 1 })
    },
    updateCartItemQty(id, qty) {
      const row = this.cart.find((i) => i.productId === id)
      const p = this.products.find((p) => p.id === id)
      if (row && p) row.qty = Math.max(1, Math.min(p.stock, Number(qty) || 1))
    },
    removeFromCart(id) {
      this.cart = this.cart.filter((i) => i.productId !== id)
    },
    clearCart() {
      this.cart = []
    },
    async checkout() {
      if (!this.cart.length) return { ok: false, reason: 'El carrito está vacío' }
      const gym = useGymsStore().activeGymId
      try {
        const row = await useIntegrationStore().track('ventas', () =>
          api.sales.checkout(
            gym,
            this.cart.map((i) => ({ productId: i.productId, quantity: i.qty })),
          ),
        )
        this.clearCart()
        await this.load(gym)
        return { ok: true, sale: mapSale(row) }
      } catch (error) {
        return { ok: false, reason: error.message }
      }
    },
    async addProduct(data) {
      const gym = useGymsStore().activeGymId
      const body = { ...data, sku: data.sku?.trim(), barcode: data.barcode?.trim() || null }
      const row = await useIntegrationStore().track('productos', () =>
        api.products.create(gym, body),
      )
      this.allProducts.push(mapProduct(row))
      return row
    },
    async updateProduct(id, data) {
      const gym = useGymsStore().activeGymId
      const row = await useIntegrationStore().track('productos', () =>
        api.products.update(gym, id, data),
      )
      this.allProducts = this.allProducts.map((p) => (p.id === id ? mapProduct(row) : p))
      return row
    },
    async removeProduct(id) {
      const gym = useGymsStore().activeGymId
      await useIntegrationStore().track('productos', () => api.products.remove(gym, id))
      this.allProducts = this.allProducts.filter((p) => p.id !== id)
    },
  },
})
