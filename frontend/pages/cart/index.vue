<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Alışveriş Sepeti</h1>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Empty Cart -->
      <div v-else-if="!cartItems.length" class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">Sepetiniz Boş</h2>
        <p class="text-gray-600 mb-6">Alışverişe başlamak için ürünleri sepete ekleyin</p>
        <NuxtLink to="/products" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
          Alışverişe Başla
        </NuxtLink>
      </div>

      <!-- Cart Items -->
      <div v-else class="grid lg:grid-cols-3 gap-8">
        <!-- Cart Items List -->
        <div class="lg:col-span-2 space-y-4">
          <div v-for="item in cartItems" :key="item.id" class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-4">
              <!-- Product Image -->
              <img 
                :src="getProductImage(item.product)" 
                :alt="item.product.name" 
                class="w-24 h-24 object-cover rounded"
                @error="(e) => e.target.src = 'https://placehold.co/100x100/gray/white?text=No+Image'"
              >

              <!-- Product Info -->
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-gray-900">{{ item.product.name }}</h3>
                <p class="text-sm text-gray-500">{{ item.product.category }}</p>
                <p class="text-lg font-bold text-indigo-600 mt-2">₺{{ item.unitPrice.toFixed(2) }}</p>
              </div>

              <!-- Quantity Controls -->
              <div class="flex items-center gap-3">
                <button 
                  @click="updateQuantity(item.id, item.quantity - 1)"
                  :disabled="item.quantity <= 1"
                  class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                  </svg>
                </button>
                <span class="w-12 text-center font-semibold">{{ item.quantity }}</span>
                <button 
                  @click="updateQuantity(item.id, item.quantity + 1)"
                  :disabled="item.quantity >= item.product.stock"
                  class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </button>
              </div>

              <!-- Item Total -->
              <div class="text-right">
                <p class="text-lg font-bold text-gray-900">₺{{ (item.unitPrice * item.quantity).toFixed(2) }}</p>
                <button 
                  @click="removeItem(item.id)"
                  class="text-red-600 hover:text-red-800 text-sm mt-2"
                >
                  Kaldır
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Sipariş Özeti</h2>
            
            <div class="space-y-3 mb-4">
              <div class="flex justify-between text-gray-600">
                <span>Ara Toplam</span>
                <span>₺{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>KDV (%18)</span>
                <span>₺{{ tax.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>Kargo</span>
                <span>₺{{ shipping.toFixed(2) }}</span>
              </div>
              <div class="border-t pt-3">
                <div class="flex justify-between text-lg font-bold text-gray-900">
                  <span>Toplam</span>
                  <span>₺{{ total.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <button 
              @click="proceedToCheckout"
              class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Ödemeye Geç
            </button>

            <NuxtLink 
              to="/products" 
              class="block text-center text-indigo-600 hover:text-indigo-800 mt-4"
            >
              Alışverişe Devam Et
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const config = useRuntimeConfig()

const loading = ref(true)
const cartItems = ref<any[]>([])

// Get token from localStorage
const getToken = () => {
  if (process.client) {
    return localStorage.getItem('accessToken')
  }
  return null
}

// Fetch cart items
const fetchCart = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/orders?status=CART`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.status === 401) {
      router.push('/auth/login')
      return
    }

    if (!response.ok) {
      throw new Error('Sepet yüklenemedi')
    }

    const data = await response.json()
    const cart = data.data?.data?.[0]
    
    if (cart && cart.items) {
      cartItems.value = cart.items
    }
  } catch (error) {
    console.error('Sepet yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

// Update item quantity
const updateQuantity = async (itemId: string, newQuantity: number) => {
  if (newQuantity < 1) return

  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/orders/items/${itemId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity: newQuantity }),
    })

    if (response.ok) {
      await fetchCart()
    }
  } catch (error) {
    console.error('Miktar güncelleme hatası:', error)
  }
}

// Remove item from cart
const removeItem = async (itemId: string) => {
  if (!confirm('Bu ürünü sepetten kaldırmak istediğinize emin misiniz?')) {
    return
  }

  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/orders/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.ok) {
      await fetchCart()
    }
  } catch (error) {
    console.error('Ürün kaldırma hatası:', error)
  }
}

// Get product image
const getProductImage = (product: any) => {
  if (product.images) {
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
    return images[0] || 'https://placehold.co/100x100/gray/white?text=No+Image'
  }
  return 'https://placehold.co/100x100/gray/white?text=No+Image'
}

// Computed values
const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
})

const tax = computed(() => {
  return subtotal.value * 0.18
})

const shipping = computed(() => {
  return subtotal.value > 500 ? 0 : 29.99
})

const total = computed(() => {
  return subtotal.value + tax.value + shipping.value
})

// Proceed to checkout
const proceedToCheckout = () => {
  router.push('/checkout')
}

onMounted(() => {
  fetchCart()
})
</script>
