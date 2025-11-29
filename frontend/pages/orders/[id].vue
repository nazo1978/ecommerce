<template>
  <div class="container mx-auto px-4 py-8">
    <NuxtLink to="/orders" class="flex items-center text-orange-500 hover:text-orange-700 mb-6">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      Siparişlerime Dön
    </NuxtLink>
    
    <!-- Loading State -->
    <div v-if="loading" class="card p-6 text-center">
      <p class="text-gray-500">Yükleniyor...</p>
    </div>
    
    <!-- Order Details -->
    <div v-else-if="order" class="card p-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 class="text-2xl font-bold">Sipariş Detayları</h1>
          <p class="text-gray-500">Sipariş #{{ order.id }}</p>
        </div>
        <div class="mt-4 md:mt-0">
          <span class="px-3 py-1 rounded-full text-sm font-medium" :class="{
            'bg-blue-100 text-blue-800': order.status === 'pending',
            'bg-yellow-100 text-yellow-800': order.status === 'processing',
            'bg-purple-100 text-purple-800': order.status === 'shipped',
            'bg-green-100 text-green-800': order.status === 'delivered',
            'bg-red-100 text-red-800': order.status === 'cancelled'
          }">
            {{ getStatusLabel(order.status) }}
          </span>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Order Items -->
        <div class="lg:col-span-2">
          <h2 class="text-lg font-semibold mb-4">Sipariş İçeriği</h2>
          <div class="space-y-4">
            <div v-for="item in order.items" :key="item.id" class="flex items-center border-b border-gray-200 pb-4">
              <img :src="item.image" :alt="item.name" class="w-20 h-20 object-cover rounded mr-4">
              <div class="flex-1">
                <h3 class="font-medium">{{ item.name }}</h3>
                <p class="text-sm text-gray-500">Adet: {{ item.quantity }}</p>
              </div>
              <div class="text-right">
                <p class="font-semibold">{{ item.price }}</p>
              </div>
            </div>
          </div>
          
          <!-- Order Summary -->
          <div class="mt-6 bg-gray-50 p-4 rounded-lg">
            <div class="flex justify-between mb-2">
              <span>Ürünler Toplamı</span>
              <span>{{ order.subtotal }}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span>Kargo Ücreti</span>
              <span>{{ order.shipping }}</span>
            </div>
            <div class="flex justify-between mb-2">
              <span>KDV (%18)</span>
              <span>{{ order.tax }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg mt-3 pt-3 border-t border-gray-300">
              <span>Toplam</span>
              <span>{{ order.total }}</span>
            </div>
          </div>
        </div>
        
        <!-- Order Information -->
        <div>
          <h2 class="text-lg font-semibold mb-4">Sipariş Bilgileri</h2>
          <div class="space-y-4">
            <div>
              <h3 class="text-sm font-medium text-gray-500">Sipariş Tarihi</h3>
              <p class="mt-1">{{ formatDate(order.date) }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500">Teslimat Adresi</h3>
              <p class="mt-1">{{ order.shippingAddress }}</p>
            </div>
            
            <div>
              <h3 class="text-sm font-medium text-gray-500">Ödeme Yöntemi</h3>
              <p class="mt-1">{{ order.paymentMethod }}</p>
            </div>
            
            <div v-if="order.trackingNumber">
              <h3 class="text-sm font-medium text-gray-500">Kargo Takip Numarası</h3>
              <p class="mt-1 font-mono">{{ order.trackingNumber }}</p>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="mt-8 space-y-3">
            <button class="btn-primary w-full">
              Faturayı Görüntüle
            </button>
            <button v-if="order.status === 'delivered'" class="btn-secondary w-full">
              Ürünü İade Et
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()
const { getToken } = useAuth()

const loading = ref(true)
const order = ref(null)

// Fetch order details from API
const fetchOrder = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const orderId = route.params.id
    const response = await fetch(`${config.public.apiBase}/api/v1/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch order')
    }

    const data = await response.json()
    const orderData = data.data
    
    order.value = {
      id: orderData.id,
      date: orderData.createdAt,
      status: orderData.status.toLowerCase(),
      subtotal: `₺${Number((orderData.total || 0) - (orderData.shipping || 0) - (orderData.tax || 0)).toFixed(2)}`,
      shipping: `₺${Number(orderData.shipping || 0).toFixed(2)}`,
      tax: `₺${Number(orderData.tax || 0).toFixed(2)}`,
      total: `₺${Number(orderData.total || 0).toFixed(2)}`,
      shippingAddress: orderData.shippingAddress || 'No shipping address provided',
      paymentMethod: orderData.paymentMethod || 'Not specified',
      trackingNumber: orderData.trackingNumber || 'Not available',
      items: orderData.items?.map((item: any) => ({
        id: item.id,
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        price: `₺${Number(item.price || 0).toFixed(2)}`,
        image: item.product?.images?.[0] || 'https://placehold.co/100'
      })) || []
    }
  } catch (err) {
    console.error('Error fetching order:', err)
    // Redirect to orders list if error
    router.push('/orders')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrder()
})

const getStatusLabel = (status) => {
  const statusLabels = {
    'pending_payment': 'Beklemede',
    'paid': 'Hazırlanıyor',
    'shipped': 'Kargoda',
    'delivered': 'Teslim Edildi',
    'cancelled': 'İptal Edildi'
  }
  return statusLabels[status] || status
}

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Date(dateString).toLocaleDateString('tr-TR', options)
}
</script>