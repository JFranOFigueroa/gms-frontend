<script setup>
import { computed, ref } from 'vue'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import { useAuthStore } from '@/stores/useAuthStore'
import { usePosStore } from '@/stores/usePosStore'

import { isManager as isManagerRole } from '@/config/permissions'

const authStore = useAuthStore()
const posStore = usePosStore()

const isManager = computed(() => isManagerRole(authStore.role))
const availableTabs = computed(() => {
  return isManager.value ? ['sales', 'inventory', 'reports'] : ['sales']
})
const activeTab = ref('sales')

const search = ref('')
const checkoutStatus = ref('')

const filteredProducts = computed(() => {
  const query = search.value.trim().toLowerCase()

  if (!query) return posStore.products

  return posStore.products.filter((product) => {
    return (
      product.name.toLowerCase().includes(query) ||
      (product.category || '').toLowerCase().includes(query) ||
      (product.sku || '').toLowerCase().includes(query) ||
      (product.barcode || '').toLowerCase().includes(query)
    )
  })
})

const paymentOpen = ref(false)
const cashAmount = ref('')

const changeAmount = computed(() => {
  return Number(cashAmount.value || 0) - posStore.cartTotal
})

const canPay = computed(() => {
  return Number(cashAmount.value || 0) >= posStore.cartTotal && posStore.cart.length > 0
})

const openPayment = () => {
  if (!posStore.cart.length) return

  cashAmount.value = ''
  checkoutStatus.value = ''
  paymentOpen.value = true
}

const closePayment = () => {
  paymentOpen.value = false
  cashAmount.value = ''
}

const confirmPayment = () => {
  if (!canPay.value) return

  const result = posStore.checkout({
    soldBy: authStore.user?.name || 'Trainer',
  })

  if (result.ok) {
    checkoutStatus.value = `Venta registrada. Cambio: $${changeAmount.value.toFixed(2)}`
    closePayment()
  } else {
    checkoutStatus.value = result.reason
  }
}

const roleLabel = (tab) => {
  const labels = {
    sales: 'Ventas',
    inventory: 'Inventario',
    reports: 'Reportes',
  }

  return labels[tab]
}

const addProductToCart = (product) => {
  if (product.stock <= 0) return

  posStore.addToCart(product)
}

const productName = ref('')
const productCategory = ref('')
const productSku = ref('')
const productBarcode = ref('')
const productPrice = ref('')
const productStock = ref('')

const addProduct = () => {
  if (!productName.value.trim()) return

  posStore.addProduct({
    name: productName.value.trim(),
    category: productCategory.value.trim() || 'General',
    sku: productSku.value.trim(),
    barcode: productBarcode.value.trim(),
    price: Number(productPrice.value) || 0,
    stock: Number(productStock.value) || 0,
  })

  productName.value = ''
  productCategory.value = ''
  productSku.value = ''
  productBarcode.value = ''
  productPrice.value = ''
  productStock.value = ''
}

const updateProductField = (product, field, value) => {
  const payload = {
    [field]: field === 'price' || field === 'stock' ? Number(value) || 0 : value,
  }

  posStore.updateProduct(product.id, payload)
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-4xl font-black">POS</h1>

      <p class="text-[var(--color-text-secondary)] mt-2">
        {{ isManager ? 'Ventas, inventario y reportes' : 'Punto de venta' }}
      </p>
    </div>

    <div class="flex flex-wrap gap-3">
      <BaseButton
        v-for="tab in availableTabs"
        :key="tab"
        variant="secondary"
        @click="activeTab = tab"
        :class="{ '!border-[var(--color-primary)]': activeTab === tab }"
      >
        {{ roleLabel(tab) }}
      </BaseButton>
    </div>

    <!-- Sales -->
    <div v-if="activeTab === 'sales'" class="grid gap-6 xl:grid-cols-[2fr_1fr]">
      <!-- Left: search, cart, charge -->
      <div class="flex min-h-[650px] flex-col gap-6">
        <BaseCard>
          <div class="space-y-3">
            <h2 class="text-2xl font-bold">Búsqueda</h2>

            <BaseInput
              v-model="search"
              placeholder="Buscar por código de barras, SKU, nombre o keyword"
            />
          </div>
        </BaseCard>

        <BaseCard class="flex-1">
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">Cesta</h2>

            <div v-if="!posStore.cart.length" class="text-[var(--color-text-secondary)]">
              No hay productos en la cesta
            </div>

            <div
              v-for="item in posStore.cart"
              :key="item.productId"
              class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-3"
            >
              <div class="flex items-center justify-between gap-3">
                <div>
                  <p class="font-semibold">
                    {{ item.name }}
                  </p>

                  <p class="text-sm text-[var(--color-text-secondary)]">
                    ${{ item.price }} c/u
                  </p>
                </div>

                <BaseButton variant="secondary" @click="posStore.removeFromCart(item.productId)">
                  ✕
                </BaseButton>
              </div>

              <div class="flex items-center gap-3">
                <BaseInput
                  :model-value="item.qty"
                  type="number"
                  @update:modelValue="posStore.updateCartItemQty(item.productId, $event)"
                />

                <p class="font-semibold">
                  ${{ item.price * item.qty }}
                </p>
              </div>
            </div>

            <div class="flex items-center justify-between text-2xl font-black pt-4 border-t border-[var(--color-border)]">
              <span>Total</span>

              <span>${{ posStore.cartTotal }}</span>
            </div>

            <BaseButton class="w-full" @click="openPayment" :disabled="!posStore.cart.length">
              Cobrar
            </BaseButton>

            <p v-if="checkoutStatus" class="text-[var(--color-text-secondary)]">
              {{ checkoutStatus }}
            </p>
          </div>
        </BaseCard>
      </div>

      <!-- Right: product catalog -->
      <BaseCard>
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Catálogo</h2>

          <div class="space-y-3 max-h-[650px] overflow-auto pr-1">
            <BaseCard
              v-for="product in filteredProducts"
              :key="product.id"
              class="cursor-pointer"
              @click="addProductToCart(product)"
            >
              <div class="space-y-2">
                <div class="flex items-start justify-between gap-3">
                  <h3 class="font-bold">
                    {{ product.name }}
                  </h3>

                  <span class="text-xs text-[var(--color-text-secondary)]">
                    {{ product.sku }}
                  </span>
                </div>

                <p class="text-sm text-[var(--color-text-secondary)]">
                  {{ product.category }} · Stock {{ product.stock }} · ${{ product.price }}
                </p>

                <BaseButton variant="secondary" class="w-full" :disabled="product.stock <= 0">
                  {{ product.stock <= 0 ? 'Sin stock' : 'Agregar' }}
                </BaseButton>
              </div>
            </BaseCard>

            <div v-if="!filteredProducts.length" class="text-[var(--color-text-secondary)]">
              No se encontraron productos
            </div>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Inventory -->
    <div v-if="activeTab === 'inventory' && isManager" class="space-y-6">
      <BaseCard>
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Nuevo producto</h2>

          <div class="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <BaseInput v-model="productName" placeholder="Nombre" />

            <BaseInput v-model="productCategory" placeholder="Categoría" />

            <BaseInput v-model="productSku" placeholder="SKU" />

            <BaseInput v-model="productBarcode" placeholder="Código de barras" />

            <BaseInput v-model="productPrice" type="number" placeholder="Precio" />

            <BaseInput v-model="productStock" type="number" placeholder="Stock" />
          </div>

          <BaseButton @click="addProduct"> Agregar producto </BaseButton>
        </div>
      </BaseCard>

      <div class="grid gap-4">
        <BaseCard v-for="product in posStore.products" :key="product.id">
          <div class="grid gap-4 md:grid-cols-6 md:items-center">
            <div>
              <p class="font-semibold">
                {{ product.name }}
              </p>

              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ product.category }} · {{ product.sku }}
              </p>
            </div>

            <BaseInput :model-value="product.name" @update:modelValue="updateProductField(product, 'name', $event)" />

            <BaseInput :model-value="product.sku" @update:modelValue="updateProductField(product, 'sku', $event)" />

            <BaseInput :model-value="product.price" type="number" @update:modelValue="updateProductField(product, 'price', $event)" />

            <BaseInput :model-value="product.stock" type="number" @update:modelValue="updateProductField(product, 'stock', $event)" />

            <div class="flex gap-3">
              <BaseButton variant="secondary" @click="posStore.removeProduct(product.id)">
                Eliminar
              </BaseButton>
            </div>
          </div>
        </BaseCard>
      </div>
    </div>

    <!-- Reports -->
    <div v-if="activeTab === 'reports' && isManager" class="space-y-6">
      <div class="grid gap-6 md:grid-cols-4">
        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Ventas</p>

          <h3 class="text-4xl font-black mt-3">
            {{ posStore.totalSales }}
          </h3>
        </BaseCard>

        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Ingresos</p>

          <h3 class="text-4xl font-black mt-3">
            ${{ posStore.totalRevenue }}
          </h3>
        </BaseCard>

        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Productos</p>

          <h3 class="text-4xl font-black mt-3">
            {{ posStore.products.length }}
          </h3>
        </BaseCard>

        <BaseCard>
          <p class="text-[var(--color-text-secondary)]">Stock bajo</p>

          <h3 class="text-4xl font-black mt-3">
            {{ posStore.lowStockProducts.length }}
          </h3>
        </BaseCard>
      </div>

      <BaseCard>
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Productos más vendidos</h2>

          <div v-if="!posStore.salesByProduct.length" class="text-[var(--color-text-secondary)]">
            Aún no hay ventas
          </div>

          <div
            v-for="product in posStore.salesByProduct"
            :key="product.productId"
            class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 flex items-center justify-between gap-4"
          >
            <div>
              <p class="font-semibold">
                {{ product.name }}
              </p>

              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ product.qty }} unidades
              </p>
            </div>

            <p class="font-bold">
              ${{ product.revenue }}
            </p>
          </div>
        </div>
      </BaseCard>

      <BaseCard>
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">Últimas ventas</h2>

          <div v-if="!posStore.sales.length" class="text-[var(--color-text-secondary)]">
            Aún no hay ventas registradas
          </div>

          <div
            v-for="sale in posStore.sales.slice(0, 20)"
            :key="sale.id"
            class="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]/50 p-4 space-y-2"
          >
            <div class="flex items-center justify-between gap-4">
              <p class="font-semibold">
                #{{ sale.id }}
              </p>

              <p class="text-sm text-[var(--color-text-secondary)]">
                {{ new Date(sale.createdAt).toLocaleString() }}
              </p>
            </div>

            <p class="text-sm text-[var(--color-text-secondary)]">
              {{ sale.items.map((item) => `${item.name} x${item.qty}`).join(', ') }}
            </p>

            <p class="font-bold">
              Total: ${{ sale.total }} · {{ sale.createdBy }}
            </p>
          </div>
        </div>
      </BaseCard>
    </div>

    <!-- Payment modal -->
    <BaseModal :open="paymentOpen" @close="closePayment">
      <div class="space-y-6">
        <div>
          <h2 class="text-3xl font-black">Cobro</h2>

          <p class="text-[var(--color-text-secondary)] mt-2">
            Ingresa el monto proporcionado por el cliente
          </p>
        </div>

        <BaseCard>
          <div class="space-y-2">
            <p class="text-[var(--color-text-secondary)]">Saldo a cobrar</p>

            <h3 class="text-5xl font-black">
              ${{ posStore.cartTotal }}
            </h3>
          </div>
        </BaseCard>

        <BaseInput v-model="cashAmount" type="number" placeholder="Monto recibido" />

        <BaseCard>
          <div class="flex items-center justify-between">
            <p class="text-[var(--color-text-secondary)]">Cambio</p>

            <h3 class="text-3xl font-black">
              ${{ changeAmount < 0 ? 0 : changeAmount.toFixed(2) }}
            </h3>
          </div>
        </BaseCard>

        <p v-if="Number(cashAmount || 0) > 0 && Number(cashAmount || 0) < posStore.cartTotal" class="text-red-400">
          El monto es insuficiente
        </p>

        <BaseButton class="w-full" @click="confirmPayment" :disabled="!canPay">
          Confirmar pago
        </BaseButton>
      </div>
    </BaseModal>
  </div>
</template>