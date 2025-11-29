<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Admin Dashboard</h1>
      <div class="flex gap-3">
        <button @click="router.push('/admin/products')" class="btn-primary">
          <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          Manage Products
        </button>
        <button @click="router.push('/admin/users')" class="btn-primary">
          <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Manage Users
        </button>
        <button @click="handleLogout" class="btn-secondary">
          Logout
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading dashboard data...</p>
      </div>
    </div>

    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-8">
      <p class="text-sm">{{ error }}</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-500 text-sm">Total Users</p>
            <p class="text-2xl font-bold">{{ stats.users.total }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-500 text-sm">Total Products</p>
            <p class="text-2xl font-bold">{{ stats.products.total }}</p>
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
            <p class="text-gray-500 text-sm">Total Orders</p>
            <p class="text-2xl font-bold">{{ stats.orders.total }}</p>
          </div>
        </div>
      </div>

      <div class="card p-6">
        <div class="flex items-center">
          <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p class="text-gray-500 text-sm">Total Revenue</p>
            <p class="text-2xl font-bold">₺{{ Number(stats.revenue.total).toFixed(2) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Recent Users -->
      <div class="card">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold">Recent Users</h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div v-for="user in recentUsers" :key="user.id" class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                  <span class="text-gray-600 font-medium">{{ user.name.charAt(0) }}</span>
                </div>
                <div>
                  <p class="font-medium">{{ user.name }}</p>
                  <p class="text-sm text-gray-500">{{ user.email }}</p>
                </div>
              </div>
              <span class="px-2 py-1 text-xs rounded-full" :class="{
                'bg-green-100 text-green-800': user.status === 'active',
                'bg-yellow-100 text-yellow-800': user.status === 'pending',
                'bg-red-100 text-red-800': user.status === 'suspended'
              }">
                {{ user.status }}
              </span>
            </div>
          </div>
          <NuxtLink to="/admin/users" class="btn-primary mt-6 inline-block">
            Tüm Kullanıcıları Görüntüle
          </NuxtLink>
        </div>
      </div>

      <!-- Recent Orders -->
      <div class="card">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold">Recent Orders</h2>
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
          <NuxtLink to="/admin/orders" class="btn-primary mt-6 inline-block">
            Tüm Siparişleri Görüntüle
          </NuxtLink>
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

// Fetch dashboard data
const loading = ref(true)
const error = ref('')
const stats = ref({
  users: { total: 0, customers: 0, sellers: 0 },
  products: { total: 0, pending: 0 },
  orders: { total: 0, pending: 0 },
  revenue: { total: 0 }
})
const recentUsers = ref([])
const recentOrders = ref([])

onMounted(async () => {
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/admin/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        router.push('/auth/login')
        return
      }
      throw new Error('Failed to fetch dashboard data')
    }

    const data = await response.json()
    stats.value = data.data.stats
    recentUsers.value = data.data.recentActivity.users.map((u: any) => ({
      id: u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      email: u.email,
      status: u.emailVerified ? 'active' : 'pending'
    }))
    recentOrders.value = data.data.recentActivity.orders.map((o: any) => ({
      id: o.id,
      date: new Date(o.createdAt).toLocaleDateString('tr-TR'),
      amount: `₺${Number(o.total || 0).toFixed(2)}`,
      status: o.status === 'PAID' ? 'completed' : o.status === 'PENDING_PAYMENT' ? 'pending' : o.status.toLowerCase()
    }))
  } catch (err: any) {
    error.value = err.message
    console.error('Error fetching dashboard data:', err)
  } finally {
    loading.value = false
  }
})
</script>