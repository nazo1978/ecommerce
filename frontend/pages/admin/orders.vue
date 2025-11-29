<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Order Management</h1>
    </div>

    <!-- Filters -->
    <div class="card p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Order ID or customer" 
            class="input-field w-full"
            v-model="filters.search"
            @input="debouncedSearch"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select class="input-field w-full" v-model="filters.status" @change="fetchOrders">
            <option value="">All Statuses</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="PAID">Paid</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
          <select class="input-field w-full" v-model="filters.dateRange" @change="fetchOrders">
            <option value="">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="resetFilters" class="btn-secondary w-full">
            Reset
          </button>
        </div>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-4 text-center text-gray-500">Loading...</td>
            </tr>
            <tr v-else-if="orders.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-gray-500">No orders found</td>
            </tr>
            <tr v-else v-for="order in orders" :key="order.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #{{ order.id.slice(0, 8) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ order.user?.firstName }} {{ order.user?.lastName }}</div>
                <div class="text-sm text-gray-500">{{ order.user?.email }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(order.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ₺{{ Number(order.total || 0).toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="{
                  'bg-yellow-100 text-yellow-800': order.status === 'PENDING_PAYMENT',
                  'bg-green-100 text-green-800': order.status === 'PAID',
                  'bg-blue-100 text-blue-800': order.status === 'SHIPPED',
                  'bg-purple-100 text-purple-800': order.status === 'DELIVERED',
                  'bg-red-100 text-red-800': order.status === 'CANCELLED'
                }">
                  {{ order.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button @click="viewOrder(order.id)" class="text-orange-600 hover:text-orange-900">
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ orders.length }} of {{ totalOrders }} orders
        </div>
        <div class="flex space-x-2">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1"
            class="px-3 py-1 rounded border text-sm"
            :class="currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Previous
          </button>
          <button 
            v-for="page in visiblePages" 
            :key="page"
            @click="goToPage(page)"
            class="px-3 py-1 rounded border text-sm"
            :class="page === currentPage ? 'bg-orange-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            {{ page }}
          </button>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="px-3 py-1 rounded border text-sm"
            :class="currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const config = useRuntimeConfig()
const { getToken } = useAuth()

const loading = ref(true)
const orders = ref([])
const totalOrders = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)

const filters = ref({
  search: '',
  status: '',
  dateRange: ''
})

// Fetch orders
const fetchOrders = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '20'
    })

    if (filters.value.search) params.append('q', filters.value.search)
    if (filters.value.status) params.append('status', filters.value.status)

    const response = await fetch(`${config.public.apiBase}/api/v1/admin/orders?${params}`, {
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
      throw new Error('Failed to fetch orders')
    }

    const data = await response.json()
    orders.value = data.data?.data || []
    totalOrders.value = data.data?.meta?.total || 0
    totalPages.value = data.data?.meta?.totalPages || 1
  } catch (err: any) {
    console.error('Error fetching orders:', err)
  } finally {
    loading.value = false
  }
}

// Debounced search
let searchTimeout: NodeJS.Timeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchOrders()
  }, 500)
}

// Pagination
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchOrders()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchOrders()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchOrders()
}

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Reset filters
const resetFilters = () => {
  filters.value = {
    search: '',
    status: '',
    dateRange: ''
  }
  currentPage.value = 1
  fetchOrders()
}

// View order
const viewOrder = (orderId: string) => {
  router.push(`/orders/${orderId}`)
}

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(dateString).toLocaleDateString('en-US', options)
}

onMounted(() => {
  fetchOrders()
})
</script>
