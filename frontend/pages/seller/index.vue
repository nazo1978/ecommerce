<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Satıcı Paneli</h1>
      <button @click="handleLogout" class="btn-secondary">
        Çıkış Yap
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-500 text-sm">Toplam Ürün</p>
            <p class="text-2xl font-bold">{{ stats.totalProducts }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-500 text-sm">Satılan Ürün</p>
            <p class="text-2xl font-bold">{{ stats.soldProducts }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-500 text-sm">Toplam Gelir</p>
            <p class="text-2xl font-bold">₺{{ stats?.totalRevenue?.toFixed(2) || '0.00' }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-500 text-sm">Yorumlar</p>
            <p class="text-2xl font-bold">{{ stats.reviews }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Products -->
      <div class="card">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-semibold">Son Ürünler</h2>
          <NuxtLink to="/seller/products" class="text-orange-500 hover:text-orange-700 text-sm">
            Tüm Ürünler
          </NuxtLink>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div v-for="product in recentProducts" :key="product.id" class="flex items-center">
              <img :src="product.image" :alt="product.name" class="w-16 h-16 object-cover rounded mr-4">
              <div class="flex-1">
                <p class="font-medium">{{ product.name }}</p>
                <p class="text-sm text-gray-500">{{ product.price }}</p>
              </div>
              <span class="px-2 py-1 text-xs rounded-full" :class="{
                'bg-green-100 text-green-800': product.status === 'active',
                'bg-yellow-100 text-yellow-800': product.status === 'pending',
                'bg-red-100 text-red-800': product.status === 'inactive'
              }">
                {{ product.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="card">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 class="text-lg font-semibold">Son Siparişler</h2>
          <NuxtLink to="/seller/orders" class="text-orange-500 hover:text-orange-700 text-sm">
            Tüm Siparişler
          </NuxtLink>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div v-for="order in recentOrders" :key="order.id" class="flex items-center justify-between">
              <div>
                <p class="font-medium">Sipariş #{{ order.id }}</p>
                <p class="text-sm text-gray-500">{{ order.date }}</p>
              </div>
              <div class="text-right">
                <p class="font-medium">{{ order.amount }}</p>
                <span class="px-2 py-1 text-xs rounded-full" :class="{
                  'bg-green-100 text-green-800': order.status === 'completed',
                  'bg-yellow-100 text-yellow-800': order.status === 'pending',
                  'bg-blue-100 text-blue-800': order.status === 'processing',
                  'bg-red-100 text-red-800': order.status === 'cancelled'
                }">
                  {{ order.status }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { logout, getToken } = useAuth()
const router = useRouter()
const config = useRuntimeConfig()

const handleLogout = () => {
  logout()
  router.push('/auth/login')
}

// Real data
const loading = ref(true)
const stats = ref({
  totalProducts: 0,
  soldProducts: 0,
  totalRevenue: 0,
  reviews: 0
})
const recentProducts = ref([])
const recentOrders = ref([])

// Fetch seller dashboard data
const fetchDashboardData = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    // Fetch products
    const productsRes = await fetch(`${config.public.apiBase}/api/v1/products?page=1&limit=4`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
    
    if (productsRes.ok) {
      const productsData = await productsRes.json()
      recentProducts.value = productsData.data.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: `₺${Number(p.price).toFixed(2)}`,
        status: p.status.toLowerCase(),
        image: p.images?.[0] || 'https://placehold.co/100'
      }))
      stats.value.totalProducts = productsData.data.meta?.total || 0
    }

    // Fetch orders
    const ordersRes = await fetch(`${config.public.apiBase}/api/v1/orders?page=1&limit=4`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (ordersRes.ok) {
      const ordersData = await ordersRes.json()
      recentOrders.value = ordersData.data.data.map((o: any) => ({
        id: o.id,
        date: new Date(o.createdAt).toLocaleDateString('tr-TR'),
        amount: `₺${Number(o.total || 0).toFixed(2)}`,
        status: o.status.toLowerCase()
      }))
      
      // Calculate stats from orders
      const completedOrders = ordersData.data.data.filter((o: any) => o.status === 'PAID')
      stats.value.soldProducts = completedOrders.reduce((sum: number, o: any) => sum + (o.items?.length || 0), 0)
      stats.value.totalRevenue = completedOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0)
    }

  } catch (err) {
    console.error('Error fetching dashboard data:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>