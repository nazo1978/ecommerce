<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Ödeme</h1>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else class="grid lg:grid-cols-3 gap-8">
        <!-- Forms Section -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Shipping Information -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Teslimat Bilgileri</h2>
            <form class="space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                  <input 
                    v-model="shippingInfo.firstName" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                  <input 
                    v-model="shippingInfo.lastName" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input 
                  v-model="shippingInfo.phone" 
                  type="tel" 
                  required
                  placeholder="+90 5XX XXX XX XX"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea 
                  v-model="shippingInfo.address" 
                  rows="3" 
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                ></textarea>
              </div>

              <div class="grid md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                  <input 
                    v-model="shippingInfo.city" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
                  <input 
                    v-model="shippingInfo.district" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Posta Kodu</label>
                  <input 
                    v-model="shippingInfo.postalCode" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
              </div>
            </form>
          </div>

          <!-- Billing Information -->
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-xl font-bold text-gray-900">Fatura Bilgileri</h2>
              <label class="flex items-center gap-2">
                <input 
                  v-model="sameAsShipping" 
                  type="checkbox" 
                  class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                >
                <span class="text-sm text-gray-700">Teslimat adresiyle aynı</span>
              </label>
            </div>

            <form v-if="!sameAsShipping" class="space-y-4">
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                  <input 
                    v-model="billingInfo.firstName" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                  <input 
                    v-model="billingInfo.lastName" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                <textarea 
                  v-model="billingInfo.address" 
                  rows="3" 
                  required
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                ></textarea>
              </div>

              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
                  <input 
                    v-model="billingInfo.city" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Posta Kodu</label>
                  <input 
                    v-model="billingInfo.postalCode" 
                    type="text" 
                    required
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
              </div>
            </form>
          </div>

          <!-- Payment Method -->
          <div class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Ödeme Yöntemi</h2>
            <div class="space-y-3">
              <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500">
                <input 
                  v-model="paymentMethod" 
                  type="radio" 
                  value="credit_card" 
                  class="w-4 h-4 text-indigo-600"
                >
                <span class="ml-3 font-medium">Kredi/Banka Kartı</span>
              </label>
              <label class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-500">
                <input 
                  v-model="paymentMethod" 
                  type="radio" 
                  value="wallet" 
                  class="w-4 h-4 text-indigo-600"
                >
                <span class="ml-3 font-medium">Cüzdan (Bakiye: ₺{{ walletBalance.toFixed(2) }})</span>
              </label>
            </div>

            <!-- Credit Card Form -->
            <div v-if="paymentMethod === 'credit_card'" class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Kart Numarası</label>
                <input 
                  v-model="cardInfo.number" 
                  type="text" 
                  placeholder="1234 5678 9012 3456"
                  maxlength="19"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Son Kullanma</label>
                  <input 
                    v-model="cardInfo.expiry" 
                    type="text" 
                    placeholder="MM/YY"
                    maxlength="5"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input 
                    v-model="cardInfo.cvv" 
                    type="text" 
                    placeholder="123"
                    maxlength="3"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Sipariş Özeti</h2>
            
            <!-- Cart Items -->
            <div class="space-y-3 mb-4 max-h-60 overflow-y-auto">
              <div v-for="item in cartItems" :key="item.id" class="flex gap-3">
                <img 
                  :src="getProductImage(item.product)" 
                  :alt="item.product.name" 
                  class="w-16 h-16 object-cover rounded"
                >
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900">{{ item.product.name }}</p>
                  <p class="text-xs text-gray-500">Adet: {{ item.quantity }}</p>
                  <p class="text-sm font-bold text-indigo-600">₺{{ (item.unitPrice * item.quantity).toFixed(2) }}</p>
                </div>
              </div>
            </div>

            <div class="border-t pt-4 space-y-2">
              <div class="flex justify-between text-gray-600">
                <span>Ara Toplam</span>
                <span>₺{{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>KDV</span>
                <span>₺{{ tax.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between text-gray-600">
                <span>Kargo</span>
                <span>₺{{ shipping.toFixed(2) }}</span>
              </div>
              <div class="border-t pt-2">
                <div class="flex justify-between text-lg font-bold text-gray-900">
                  <span>Toplam</span>
                  <span>₺{{ total.toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <button 
              @click="placeOrder"
              :disabled="processing"
              class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold mt-6 disabled:opacity-50"
            >
              {{ processing ? 'İşleniyor...' : 'Siparişi Tamamla' }}
            </button>
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
const processing = ref(false)
const cartItems = ref<any[]>([])
const walletBalance = ref(0)
const sameAsShipping = ref(true)
const paymentMethod = ref('credit_card')

const shippingInfo = ref({
  firstName: '',
  lastName: '',
  phone: '',
  address: '',
  city: '',
  district: '',
  postalCode: '',
})

const billingInfo = ref({
  firstName: '',
  lastName: '',
  address: '',
  city: '',
  postalCode: '',
})

const cardInfo = ref({
  number: '',
  expiry: '',
  cvv: '',
})

const getToken = () => {
  if (process.client) {
    return localStorage.getItem('accessToken')
  }
  return null
}

const fetchCart = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/orders?status=CART`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.status === 401) {
      router.push('/auth/login')
      return
    }

    if (response.ok) {
      const data = await response.json()
      const cart = data.data?.data?.[0]
      if (cart && cart.items) {
        cartItems.value = cart.items
      }
    }
  } catch (error) {
    console.error('Sepet yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

const fetchWallet = async () => {
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/wallet`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.ok) {
      const data = await response.json()
      walletBalance.value = data.data?.balance || 0
    }
  } catch (error) {
    console.error('Cüzdan yükleme hatası:', error)
  }
}

const getProductImage = (product: any) => {
  if (product.images) {
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
    return images[0] || 'https://placehold.co/100x100/gray/white?text=No+Image'
  }
  return 'https://placehold.co/100x100/gray/white?text=No+Image'
}

const subtotal = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0)
})

const tax = computed(() => subtotal.value * 0.18)
const shipping = computed(() => subtotal.value > 500 ? 0 : 29.99)
const total = computed(() => subtotal.value + tax.value + shipping.value)

const placeOrder = async () => {
  if (!shippingInfo.value.firstName || !shippingInfo.value.address || !shippingInfo.value.phone) {
    alert('Lütfen teslimat bilgilerini doldurun')
    return
  }

  if (paymentMethod.value === 'credit_card' && (!cardInfo.value.number || !cardInfo.value.cvv)) {
    alert('Lütfen kart bilgilerini doldurun')
    return
  }

  processing.value = true
  try {
    const token = getToken()
    const billing = sameAsShipping.value ? shippingInfo.value : billingInfo.value

    const response = await fetch(`${config.public.apiBase}/api/v1/orders/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shippingInfo: JSON.stringify(shippingInfo.value),
        billingInfo: JSON.stringify(billing),
        paymentMethod: paymentMethod.value,
        cardInfo: paymentMethod.value === 'credit_card' ? cardInfo.value : undefined,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      alert('Siparişiniz başarıyla oluşturuldu!')
      router.push(`/orders/${data.data.id}`)
    } else {
      const error = await response.json()
      alert(error.message || 'Sipariş oluşturulamadı')
    }
  } catch (error) {
    console.error('Sipariş hatası:', error)
    alert('Bir hata oluştu')
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  fetchCart()
  fetchWallet()
})
</script>
