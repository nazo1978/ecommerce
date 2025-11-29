<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold">Product Management</h1>
      <button @click="openCreateModal" class="btn-primary">
        <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add New Product
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-6 mb-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <input 
            type="text" 
            placeholder="Product name or SKU" 
            class="input-field w-full"
            v-model="filters.search"
            @input="debouncedSearch"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select class="input-field w-full" v-model="filters.category" @change="fetchProducts">
            <option value="">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Books">Books</option>
            <option value="Home">Home & Garden</option>
            <option value="Sports">Sports</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select class="input-field w-full" v-model="filters.status" @change="fetchProducts">
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="resetFilters" class="btn-secondary w-full">
            Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>

    <!-- Products Table -->
    <div class="card">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-4 text-center text-gray-500">Loading...</td>
            </tr>
            <tr v-else-if="products.length === 0">
              <td colspan="6" class="px-6 py-4 text-center text-gray-500">No products found</td>
            </tr>
            <tr v-else v-for="product in products" :key="product.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <img 
                    :src="Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : 'https://placehold.co/100x100/gray/white?text=No+Image'" 
                    :alt="product.name" 
                    class="w-12 h-12 rounded object-cover mr-3"
                    @error="(e) => e.target.src = 'https://placehold.co/100x100/gray/white?text=Error'"
                  >
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ product.name }}</div>
                    <div class="text-sm text-gray-500">{{ product.seller?.firstName }} {{ product.seller?.lastName }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ product.category }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ₺{{ Number(product.price || 0).toFixed(2) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ product.stock }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="{
                  'bg-green-100 text-green-800': product.status === 'PUBLISHED',
                  'bg-yellow-100 text-yellow-800': product.status === 'DRAFT',
                  'bg-gray-100 text-gray-800': product.status === 'ARCHIVED'
                }">
                  {{ product.status }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button @click="editProduct(product)" class="text-orange-600 hover:text-orange-900">
                  Edit
                </button>
                <button @click="deleteProduct(product)" class="text-red-600 hover:text-red-900">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
        <div class="text-sm text-gray-700">
          Showing {{ products.length }} of {{ totalProducts }} products
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

    <!-- Create/Edit Modal -->
    <div v-if="editingProduct" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click.self="closeEditModal">
      <div class="relative top-20 mx-auto p-8 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-2xl font-bold text-gray-900">{{ editingProduct.id ? 'Edit Product' : 'Create New Product' }}</h3>
          <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input v-model="editingProduct.name" type="text" class="input-field w-full" placeholder="Enter product name">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea v-model="editingProduct.description" rows="4" class="input-field w-full" placeholder="Enter product description"></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Price *</label>
              <input v-model="editingProduct.price" type="number" step="0.01" class="input-field w-full" placeholder="0.00">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
              <input v-model="editingProduct.stock" type="number" class="input-field w-full" placeholder="0">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select v-model="editingProduct.category" class="input-field w-full">
                <option value="">Select category</option>
                <option value="Electronics">Electronics</option>
                <option value="Clothing">Clothing</option>
                <option value="Books">Books</option>
                <option value="Home">Home & Garden</option>
                <option value="Sports">Sports</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select v-model="editingProduct.status" class="input-field w-full">
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Images (URLs, comma separated)</label>
            <input v-model="imageUrls" type="text" class="input-field w-full" placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg">
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-3">
          <button @click="closeEditModal" class="btn-secondary" :disabled="saving">
            Cancel
          </button>
          <button @click="saveProduct" class="btn-primary" :disabled="saving">
            {{ saving ? 'Saving...' : (editingProduct.id ? 'Update Product' : 'Create Product') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deletingProduct" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click.self="closeDeleteModal">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mb-4">
          <h3 class="text-lg font-medium text-gray-900">Confirm Delete</h3>
        </div>
        <div class="mb-4">
          <p class="text-sm text-gray-600">
            Are you sure you want to delete product <strong>{{ deletingProduct.name }}</strong>?
          </p>
          <p class="text-sm text-red-600 mt-2">
            This action cannot be undone.
          </p>
        </div>
        <div class="flex justify-end space-x-3">
          <button @click="closeDeleteModal" class="btn-secondary" :disabled="deleting">
            Cancel
          </button>
          <button @click="confirmDelete" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" :disabled="deleting">
            {{ deleting ? 'Deleting...' : 'Delete' }}
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
const saving = ref(false)
const deleting = ref(false)
const error = ref('')

const products = ref([])
const totalProducts = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)

const filters = ref({
  search: '',
  category: '',
  status: ''
})

const editingProduct = ref(null)
const deletingProduct = ref(null)
const imageUrls = ref('')

// Fetch products
const fetchProducts = async () => {
  loading.value = true
  error.value = ''
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
    if (filters.value.category) params.append('category', filters.value.category)
    if (filters.value.status) params.append('status', filters.value.status)

    const response = await fetch(`${config.public.apiBase}/api/v1/admin/products?${params}`, {
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
      throw new Error('Failed to fetch products')
    }

    const data = await response.json()
    // Parse images from JSON string to array
    products.value = (data.data?.data || []).map((product: any) => ({
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images
    }))
    totalProducts.value = data.data?.meta?.total || 0
    totalPages.value = data.data?.meta?.totalPages || 1
  } catch (err: any) {
    error.value = err.message
    console.error('Error fetching products:', err)
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
    fetchProducts()
  }, 500)
}

// Pagination
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchProducts()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchProducts()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchProducts()
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
    category: '',
    status: ''
  }
  currentPage.value = 1
  fetchProducts()
}

// Create product
const openCreateModal = () => {
  editingProduct.value = {
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    status: 'DRAFT',
    images: []
  }
  imageUrls.value = ''
}

// Edit product
const editProduct = (product: any) => {
  editingProduct.value = { ...product }
  // Convert images array to comma-separated string
  if (Array.isArray(product.images)) {
    imageUrls.value = product.images.join(', ')
  } else {
    imageUrls.value = ''
  }
}

const closeEditModal = () => {
  editingProduct.value = null
  imageUrls.value = ''
  error.value = ''
}

const saveProduct = async () => {
  if (!editingProduct.value) return
  
  // Validation
  if (!editingProduct.value.name || !editingProduct.value.description || !editingProduct.value.price || !editingProduct.value.stock || !editingProduct.value.category) {
    error.value = 'Please fill in all required fields'
    return
  }

  saving.value = true
  error.value = ''
  try {
    const token = getToken()
    
    // Parse image URLs
    const images = imageUrls.value
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0)

    const productData = {
      name: editingProduct.value.name,
      description: editingProduct.value.description,
      price: Number(editingProduct.value.price),
      stock: Number(editingProduct.value.stock),
      category: editingProduct.value.category,
      status: editingProduct.value.status,
      images: images.length > 0 ? images : undefined
    }

    const url = editingProduct.value.id 
      ? `${config.public.apiBase}/api/v1/admin/products/${editingProduct.value.id}`
      : `${config.public.apiBase}/api/v1/admin/products`
    
    const method = editingProduct.value.id ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Failed to save product')
    }

    await fetchProducts()
    closeEditModal()
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

// Delete product
const deleteProduct = (product: any) => {
  deletingProduct.value = { ...product }
}

const closeDeleteModal = () => {
  deletingProduct.value = null
  error.value = ''
}

const confirmDelete = async () => {
  if (!deletingProduct.value) return
  
  deleting.value = true
  error.value = ''
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/admin/products/${deletingProduct.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to delete product')
    }

    await fetchProducts()
    closeDeleteModal()
  } catch (err: any) {
    error.value = err.message
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchProducts()
})
</script>
