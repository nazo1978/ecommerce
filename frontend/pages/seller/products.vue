<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Ürünlerim</h1>
      <button class="btn-primary">
        Yeni Ürün Ekle
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Arama</label>
          <input 
            type="text" 
            placeholder="Ürün adı veya açıklama" 
            class="input-field w-full"
            v-model="filters.search"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Durum</label>
          <select class="input-field w-full" v-model="filters.status">
            <option value="">Tüm Durumlar</option>
            <option value="active">Aktif</option>
            <option value="pending">Beklemede</option>
            <option value="inactive">Pasif</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
          <select class="input-field w-full" v-model="filters.category">
            <option value="">Tüm Kategoriler</option>
            <option value="electronics">Elektronik</option>
            <option value="clothing">Giyim</option>
            <option value="home">Ev & Yaşam</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="applyFilters" class="btn-primary w-full">
            Filtrele
          </button>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ürün
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fiyat
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stok
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Satışlar
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="product in products" :key="product.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img :src="product.image" :alt="product.name" class="w-16 h-16 object-cover rounded mr-4">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                    <div class="text-sm text-gray-500">{{ product.category }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ product.price }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ product.stock }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="{
                  'bg-green-100 text-green-800': product.status === 'active',
                  'bg-yellow-100 text-yellow-800': product.status === 'pending',
                  'bg-red-100 text-red-800': product.status === 'inactive'
                }">
                  {{ getStatusLabel(product.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ product.sales }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-orange-600 hover:text-orange-900 mr-3">
                  Düzenle
                </button>
                <button class="text-red-600 hover:text-red-900">
                  Sil
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Toplam {{ pagination.total }} üründen {{ pagination.from }}-{{ pagination.to }} arası gösteriliyor
        </div>
        <div class="flex space-x-2">
          <button 
            @click="prevPage" 
            :disabled="pagination.currentPage === 1"
            class="px-3 py-1 rounded border text-sm"
            :class="pagination.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Önceki
          </button>
          <button 
            @click="nextPage" 
            :disabled="pagination.currentPage === pagination.totalPages"
            class="px-3 py-1 rounded border text-sm"
            :class="pagination.currentPage === pagination.totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'"
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()
const { getToken } = useAuth()
const router = useRouter()

const filters = ref({
  search: '',
  status: '',
  category: ''
})

const loading = ref(true)
const products = ref([])
const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  total: 0,
  from: 1,
  to: 10
})

// Fetch products from API
const fetchProducts = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const params = new URLSearchParams({
      page: pagination.value.currentPage.toString(),
      limit: '10'
    })

    if (filters.value.search) params.append('q', filters.value.search)
    if (filters.value.category) params.append('category', filters.value.category)
    if (filters.value.status) params.append('status', filters.value.status.toUpperCase())

    const response = await fetch(`${config.public.apiBase}/api/v1/products?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch products')
    }

    const data = await response.json()
    products.value = data.data.data.map((product: any) => ({
      id: product.id,
      name: product.name,
      price: `₺${Number(product.price).toFixed(2)}`,
      stock: product.stock,
      status: product.status.toLowerCase(),
      sales: 0, // This would come from analytics
      category: product.category,
      image: product.images?.[0] || 'https://placehold.co/100'
    }))
    
    pagination.value = {
      currentPage: data.data.meta.page,
      totalPages: data.data.meta.totalPages,
      total: data.data.meta.total,
      from: (data.data.meta.page - 1) * 10 + 1,
      to: Math.min(data.data.meta.page * 10, data.data.meta.total)
    }
  } catch (err) {
    console.error('Error fetching products:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchProducts()
})

const getStatusLabel = (status) => {
  const statusLabels = {
    'published': 'Aktif',
    'pending': 'Beklemede',
    'inactive': 'Pasif',
    'draft': 'Taslak'
  }
  return statusLabels[status] || status
}

const applyFilters = () => {
  pagination.value.currentPage = 1
  fetchProducts()
}

const prevPage = () => {
  if (pagination.value.currentPage > 1) {
    pagination.value.currentPage--
    fetchProducts()
  }
}

const nextPage = () => {
  if (pagination.value.currentPage < pagination.value.totalPages) {
    pagination.value.currentPage++
    fetchProducts()
  }
}
</script>