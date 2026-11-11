import { defineStore } from 'pinia'
import { api } from '@/api/service'
import { mapProduct, mapSale } from '@/api/mappers'
import { useGymsStore } from './useGymsStore'
import { useIntegrationStore } from './useIntegrationStore'
export const usePosStore = defineStore('pos', {
  state: () => ({ allProducts: [], allSales: [], cart: [], checkoutAttempt: null, checkoutSubmitting: false }),
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
      if (this.checkoutSubmitting) return
      if (product.stock <= 0) return
      this.checkoutAttempt = null
      const row = this.cart.find((i) => i.productId === product.id)
      if (row) {
        if (row.qty < product.stock) row.qty++
      } else
        this.cart.push({ productId: product.id, name: product.name, price: product.price, qty: 1 })
    },
    updateCartItemQty(id, qty) {
      if (this.checkoutSubmitting) return
      const row = this.cart.find((i) => i.productId === id)
      const p = this.products.find((p) => p.id === id)
      if (row && p) {
        const nextQty = Math.max(1, Math.min(p.stock, Number(qty) || 1))
        if (nextQty !== row.qty) this.checkoutAttempt = null
        row.qty = nextQty
      }
    },
    removeFromCart(id) {
      if (this.checkoutSubmitting) return
      this.checkoutAttempt = null
      this.cart = this.cart.filter((i) => i.productId !== id)
    },
    clearCart() {
      this.cart = []
      this.checkoutAttempt = null
    },
    async checkout() {
      if (!this.cart.length) return { ok: false, reason: 'El carrito está vacío' }
      if (this.checkoutSubmitting) return { ok: false, reason: 'La venta ya se está procesando.' }
      const gym = useGymsStore().activeGymId
      const items = this.cart.map((i) => ({ productId: i.productId, quantity: i.qty }))
      const signature = JSON.stringify({ gym, items })
      // En un fallo de red, conservar el mismo cuerpo y la misma clave al reintentar.
      if (!this.checkoutAttempt || this.checkoutAttempt.signature !== signature) {
        this.checkoutAttempt = { signature, items, key: crypto.randomUUID() }
      }
      const attempt = this.checkoutAttempt
      this.checkoutSubmitting = true
      try {
        const row = await useIntegrationStore().track('ventas', () =>
          api.sales.checkout(gym, attempt.items, attempt.key),
        )
        this.clearCart()
        // La venta YA se registró. Un fallo refrescando el catálogo no autoriza repetirla.
        await this.load(gym).catch(() => {})
        return { ok: true, sale: mapSale(row) }
      } catch (error) {
        if (error.status === 409) this.checkoutAttempt = null
        return { ok: false, reason: error.message }
      } finally {
        this.checkoutSubmitting = false
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
