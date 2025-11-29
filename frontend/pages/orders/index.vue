<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Siparişlerim</h1>
    
    <div v-if="!isAuthenticated" class="card p-6 text-center">
      <p class="text-gray-600 mb-4">Siparişlerinizi görmek için giriş yapmanız gerekiyor.</p>
      <NuxtLink to="/auth/login" class="btn-primary inline-block">
        Giriş Yap
      </NuxtLink>
    </div>
    
    <div v-else>
      <!-- Order Filters -->
      <div class="card p-6 mb-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Sipariş Durumu</label>
            <select class="input-field w-full">
              <option value="">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="processing">Hazırlanıyor</option>
              <option value="shipped">Kargoda</option>
              <option value="delivered">Teslim Edildi</option>
              <option value="cancelled">İptal Edildi</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Tarih Aralığı</label>
            <select class="input-field w-full">
              <option value="">Tüm Zamanlar</option>
              <option value="30">Son 30 gün</option>
              <option value="90">Son 90 gün</option>
              <option value="365">Son 1 yıl</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="btn-primary w-full">
              Filtrele
            </button>
          </div>
        </div>
      </div>
      
      <!-- Orders List -->
      <div class="space-y-6">
        <div v-for="order in orders" :key="order.id" class="card">
          <div class="p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h2 class="text-lg font-semibold">Sipariş #{{ order.id }}</h2>
                <p class="text-sm text-gray-500">{{ formatDate(order.date) }}</p>
              </div>
              <div class="mt-2 md:mt-0">
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
            
            <div class="border-t border-gray-200 pt-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <img :src="order.items[0].image" :alt="order.items[0].name" class="w-16 h-16 object-cover rounded mr-4">
                  <div>
                    <p class="font-medium">{{ order.items[0].name }}</p>
                    <p class="text-sm text-gray-500">{{ order.items[0].quantity }} adet</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-semibold">{{ order.total }}</p>
                  <NuxtLink :to="`/orders/${order.id}`" class="text-orange-500 hover:text-orange-700 text-sm mt-1 inline-block">
                    Detayları Görüntüle
                  </NuxtLink>
                </div>
              </div>
              
              <div v-if="order.items.length > 1" class="mt-2 text-sm text-gray-500">
                +{{ order.items.length - 1 }} diğer ürün
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Empty State -->
      <div v-if="orders.length === 0" class="card p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-gray-900">Henüz siparişiniz yok</h3>
        <p class="mt-1 text-gray-500">Alışverişe başlayarak ilk siparişinizi verebilirsiniz.</p>
        <NuxtLink to="/products" class="btn-primary mt-6 inline-block">
          Alışverişe Başla
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, getToken } = useAuth()
const router = useRouter()
const config = useRuntimeConfig()

const loading = ref(true)
const orders = ref([])

// Fetch orders from API
const fetchOrders = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/orders?page=1&limit=20`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch orders')
    }

    const data = await response.json()
    orders.value = data.data.data.map((order: any) => ({
      id: order.id,
      date: order.createdAt,
      status: order.status.toLowerCase(),
      total: `₺${Number(order.total).toFixed(2)}`,
      items: order.items?.map((item: any) => ({
        name: item.product?.name || 'Product',
        quantity: item.quantity,
        image: item.product?.images?.[0] || 'https://placehold.co/100'
      })) || []
    }))
  } catch (err) {
    console.error('Error fetching orders:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchOrders()
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