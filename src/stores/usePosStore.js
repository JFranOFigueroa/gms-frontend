import { defineStore } from 'pinia'

export const usePosStore = defineStore(
  'pos',

  {
    state: () => ({
      products: [
        { id: 1, name: 'Agua 500ml', category: 'Bebidas', price: 25, stock: 40, sku: 'SKU-001', barcode: '750100010001' },
        { id: 2, name: 'Bebida isotónica', category: 'Bebidas', price: 45, stock: 25, sku: 'SKU-002', barcode: '750100010002' },
        { id: 3, name: 'Barra proteica', category: 'Suplementos', price: 60, stock: 30, sku: 'SKU-003', barcode: '750100010003' },
        { id: 4, name: 'Toalla deportiva', category: 'Accesorios', price: 150, stock: 12, sku: 'SKU-004', barcode: '750100010004' },
        { id: 5, name: 'Guantes de entrenamiento', category: 'Accesorios', price: 320, stock: 8, sku: 'SKU-005', barcode: '750100010005' },
      ],
      sales: [],
      cart: [],
    }),

    persist: true,

    getters: {
      cartTotal(state) {
        return state.cart.reduce((total, item) => total + item.price * item.qty, 0)
      },

      totalRevenue(state) {
        return state.sales.reduce((total, sale) => total + sale.total, 0)
      },

      totalSales(state) {
        return state.sales.length
      },

      lowStockProducts(state) {
        return state.products.filter((product) => product.stock <= 5)
      },

      salesByProduct(state) {
        const summary = new Map()

        state.sales.forEach((sale) => {
          sale.items.forEach((item) => {
            const current = summary.get(item.productId) || {
              productId: item.productId,
              name: item.name,
              qty: 0,
              revenue: 0,
            }

            current.qty += item.qty
            current.revenue += item.price * item.qty

            summary.set(item.productId, current)
          })
        })

        return Array.from(summary.values()).sort((a, b) => b.revenue - a.revenue)
      },
    },

    actions: {
      addToCart(product) {
        if (product.stock <= 0) return

        const existing = this.cart.find((item) => item.productId === product.id)

        if (existing) {
          existing.qty += 1
        } else {
          this.cart.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            qty: 1,
          })
        }
      },

      updateCartItemQty(productId, qty) {
        const item = this.cart.find((cartItem) => cartItem.productId === productId)

        if (!item) return

        const product = this.products.find((entry) => entry.id === productId)

        if (!product) return

        const nextQty = Math.max(1, Math.min(product.stock, Number(qty) || 1))

        item.qty = nextQty
      },

      removeFromCart(productId) {
        this.cart = this.cart.filter((item) => item.productId !== productId)
      },

      clearCart() {
        this.cart = []
      },

      checkout({ soldBy = 'Trainer' } = {}) {
        if (!this.cart.length) {
          return { ok: false, reason: 'El carrito está vacío' }
        }

        const unavailable = this.cart.find((item) => {
          const product = this.products.find((entry) => entry.id === item.productId)

          return !product || product.stock < item.qty
        })

        if (unavailable) {
          return { ok: false, reason: 'Stock insuficiente para uno o más productos' }
        }

        this.cart.forEach((item) => {
          const product = this.products.find((entry) => entry.id === item.productId)

          if (product) {
            product.stock -= item.qty
          }
        })

        const sale = {
          id: Date.now(),
          items: this.cart.map((item) => ({ ...item })),
          total: this.cartTotal,
          createdBy: soldBy,
          createdAt: new Date().toISOString(),
        }

        this.sales.unshift(sale)
        this.clearCart()

        return { ok: true, sale }
      },

      addProduct(payload) {
        this.products.push({
          id: Date.now(),
          stock: 0,
          sku: (payload.sku || '').trim() || `SKU-${Date.now()}`,
          barcode: (payload.barcode || '').trim(),
          ...payload,
        })
      },

      updateProduct(id, payload) {
        const product = this.products.find((entry) => entry.id === id)

        if (!product) return

        Object.assign(product, payload)
      },

      removeProduct(id) {
        this.products = this.products.filter((product) => product.id !== id)
      },
    },
  },
)