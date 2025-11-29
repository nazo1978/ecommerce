<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Müzayedeler</h1>
        <p class="text-gray-600">Canlı müzayedelere katılın ve kazanın</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select 
              v-model="filterStatus" 
              @change="fetchAuctions"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tümü</option>
              <option value="SCHEDULED">Planlanmış</option>
              <option value="RUNNING">Canlı</option>
              <option value="ENDED">Bitti</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
            <select 
              v-model="filterCategory" 
              @change="fetchAuctions"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tümü</option>
              <option value="Electronics">Elektronik</option>
              <option value="Fashion">Moda</option>
              <option value="Home">Ev & Yaşam</option>
              <option value="Sports">Spor</option>
              <option value="Books">Kitap</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <input 
              v-model="searchQuery" 
              @input="debouncedSearch"
              type="text" 
              placeholder="Ürün ara..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
            <select 
              v-model="sortBy" 
              @change="fetchAuctions"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="endTime">Bitiş Zamanı</option>
              <option value="currentBid">En Yüksek Teklif</option>
              <option value="startPrice">Başlangıç Fiyatı</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Auctions Grid -->
      <div v-else-if="auctions.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="auction in auctions" :key="auction.id" class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
          <!-- Product Image -->
          <div class="relative h-48 bg-gray-200">
            <img 
              :src="getProductImage(auction.product)" 
              :alt="auction.product.name" 
              class="w-full h-full object-cover"
              @error="(e) => e.target.src = 'https://placehold.co/400x300/gray/white?text=No+Image'"
            >
            <!-- Status Badge -->
            <div class="absolute top-4 right-4">
              <span :class="[
                'px-3 py-1 rounded-full text-xs font-semibold',
                auction.status === 'RUNNING' ? 'bg-green-500 text-white' :
                auction.status === 'SCHEDULED' ? 'bg-blue-500 text-white' :
                'bg-gray-500 text-white'
              ]">
                {{ getStatusText(auction.status) }}
              </span>
            </div>
            <!-- Countdown Timer -->
            <div v-if="auction.status === 'RUNNING'" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div class="text-white text-center">
                <p class="text-xs mb-1">Kalan Süre</p>
                <p class="text-lg font-bold">{{ getTimeRemaining(auction.endTime) }}</p>
              </div>
            </div>
          </div>

          <!-- Auction Info -->
          <div class="p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{{ auction.product.name }}</h3>
            <p class="text-sm text-gray-600 mb-4 line-clamp-2">{{ auction.product.description }}</p>

            <div class="space-y-2 mb-4">
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Başlangıç Fiyatı</span>
                <span class="text-sm font-semibold text-gray-900">₺{{ auction.startPrice.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Güncel Teklif</span>
                <span class="text-lg font-bold text-indigo-600">₺{{ auction.currentBid.toFixed(2) }}</span>
              </div>
              <div v-if="auction.buyNowPrice" class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Hemen Al</span>
                <span class="text-sm font-semibold text-green-600">₺{{ auction.buyNowPrice.toFixed(2) }}</span>
              </div>
            </div>

            <div class="flex gap-2">
              <NuxtLink 
                :to="`/auctions/${auction.id}`" 
                class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-center font-semibold"
              >
                {{ auction.status === 'RUNNING' ? 'Teklif Ver' : 'Detayları Gör' }}
              </NuxtLink>
              <button 
                v-if="auction.buyNowPrice && auction.status === 'RUNNING'" 
                @click="buyNow(auction.id)"
                class="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-semibold whitespace-nowrap"
              >
                Hemen Al
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
        </svg>
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">Müzayede Bulunamadı</h2>
        <p class="text-gray-600">Şu anda aktif müzayede bulunmamaktadır</p>
      </div>

      <!-- Pagination -->
      <div v-if="auctions.length" class="mt-8 flex justify-center gap-2">
        <button 
          @click="changePage(currentPage - 1)"
          :disabled="currentPage === 1"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50"
        >
          Önceki
        </button>
        <button 
          v-for="page in visiblePages" 
          :key="page"
          @click="changePage(page)"
          :class="[
            'px-4 py-2 border rounded-lg',
            page === currentPage 
              ? 'bg-indigo-600 text-white border-indigo-600' 
              : 'border-gray-300 hover:bg-white'
          ]"
        >
          {{ page }}
        </button>
        <button 
          @click="changePage(currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const config = useRuntimeConfig()

const loading = ref(true)
const auctions = ref<any[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const filterStatus = ref('')
const filterCategory = ref('')
const searchQuery = ref('')
const sortBy = ref('endTime')

let searchTimeout: any = null
let countdownInterval: any = null

const getToken = () => {
  if (process.client) {
    return localStorage.getItem('accessToken')
  }
  return null
}

const fetchAuctions = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '12',
    })

    if (filterStatus.value) params.append('status', filterStatus.value)
    if (filterCategory.value) params.append('category', filterCategory.value)
    if (searchQuery.value) params.append('q', searchQuery.value)
    if (sortBy.value) params.append('sortBy', sortBy.value)

    const response = await fetch(`${config.public.apiBase}/api/v1/auctions?${params}`)

    if (response.ok) {
      const data = await response.json()
      auctions.value = data.data?.data || []
      totalPages.value = data.data?.meta?.totalPages || 1
    }
  } catch (error) {
    console.error('Müzayede yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchAuctions()
  }, 500)
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchAuctions()
  }
}

const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

const getProductImage = (product: any) => {
  if (product.images) {
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
    return images[0] || 'https://placehold.co/400x300/gray/white?text=No+Image'
  }
  return 'https://placehold.co/400x300/gray/white?text=No+Image'
}

const getStatusText = (status: string) => {
  const statusTexts: Record<string, string> = {
    'SCHEDULED': 'Planlanmış',
    'RUNNING': 'Canlı',
    'ENDED': 'Bitti',
    'CANCELLED': 'İptal',
  }
  return statusTexts[status] || status
}

const getTimeRemaining = (endTime: string) => {
  const now = new Date().getTime()
  const end = new Date(endTime).getTime()
  const distance = end - now

  if (distance < 0) return 'Bitti'

  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)

  if (days > 0) return `${days}g ${hours}s ${minutes}d`
  if (hours > 0) return `${hours}s ${minutes}d ${seconds}sn`
  return `${minutes}d ${seconds}sn`
}

const buyNow = async (auctionId: string) => {
  if (!confirm('Bu ürünü hemen almak istediğinize emin misiniz?')) {
    return
  }

  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/auctions/${auctionId}/buy-now`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      alert('Satın alma işlemi başarılı!')
      fetchAuctions()
    } else {
      const error = await response.json()
      alert(error.message || 'Satın alma başarısız')
    }
  } catch (error) {
    console.error('Satın alma hatası:', error)
    alert('Bir hata oluştu')
  }
}

// Update countdown every second
const startCountdown = () => {
  countdownInterval = setInterval(() => {
    // Force re-render to update countdown
    auctions.value = [...auctions.value]
  }, 1000)
}

onMounted(() => {
  fetchAuctions()
  startCountdown()
})

onUnmounted(() => {
  clearInterval(countdownInterval)
  clearTimeout(searchTimeout)
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
