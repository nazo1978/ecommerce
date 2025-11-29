<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Piyango Çekilişleri</h1>
        <p class="text-gray-600">Şansınızı deneyin ve büyük ödüller kazanın</p>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Durum</label>
            <select 
              v-model="filterStatus" 
              @change="fetchLotteries"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tümü</option>
              <option value="SCHEDULED">Planlanmış</option>
              <option value="ACTIVE">Aktif</option>
              <option value="COMPLETED">Tamamlandı</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sıralama</label>
            <select 
              v-model="sortBy" 
              @change="fetchLotteries"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="drawDate">Çekiliş Tarihi</option>
              <option value="prizePool">Ödül Havuzu</option>
              <option value="ticketPrice">Bilet Fiyatı</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <input 
              v-model="searchQuery" 
              @input="debouncedSearch"
              type="text" 
              placeholder="Piyango ara..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Lotteries Grid -->
      <div v-else-if="lotteries.length" class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="lottery in lotteries" :key="lottery.id" class="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
          <!-- Header with gradient -->
          <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div class="flex justify-between items-start mb-4">
              <span :class="[
                'px-3 py-1 rounded-full text-xs font-semibold',
                lottery.status === 'ACTIVE' ? 'bg-green-500' :
                lottery.status === 'SCHEDULED' ? 'bg-blue-500' :
                'bg-gray-500'
              ]">
                {{ getStatusText(lottery.status) }}
              </span>
              <div class="text-right">
                <p class="text-xs opacity-90">Ödül Havuzu</p>
                <p class="text-2xl font-bold">₺{{ lottery.prizePool.toFixed(2) }}</p>
              </div>
            </div>
            <h3 class="text-xl font-bold">{{ lottery.title }}</h3>
          </div>

          <!-- Body -->
          <div class="p-6">
            <p class="text-gray-600 mb-4 line-clamp-3">{{ lottery.description || 'Açıklama yok' }}</p>

            <div class="space-y-3 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Çekiliş Tarihi</span>
                <span class="font-semibold">{{ formatDate(lottery.drawDate) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Bilet Fiyatı</span>
                <span class="font-semibold text-indigo-600">₺{{ lottery.ticketPrice.toFixed(2) }}</span>
              </div>
              <div v-if="lottery.maxTickets" class="flex justify-between text-sm">
                <span class="text-gray-600">Kalan Bilet</span>
                <span class="font-semibold">{{ getRemainingTickets(lottery) }}</span>
              </div>
            </div>

            <NuxtLink 
              :to="`/lottery/${lottery.id}`" 
              class="block w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 text-center font-semibold"
            >
              {{ lottery.status === 'ACTIVE' ? 'Bilet Al' : 'Detayları Gör' }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
        </svg>
        <h2 class="text-2xl font-semibold text-gray-900 mb-2">Piyango Bulunamadı</h2>
        <p class="text-gray-600">Şu anda aktif piyango çekilişi bulunmamaktadır</p>
      </div>

      <!-- Pagination -->
      <div v-if="lotteries.length" class="mt-8 flex justify-center gap-2">
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
import { ref, computed, onMounted } from 'vue'

const config = useRuntimeConfig()

const loading = ref(true)
const lotteries = ref<any[]>([])
const currentPage = ref(1)
const totalPages = ref(1)
const filterStatus = ref('')
const sortBy = ref('drawDate')
const searchQuery = ref('')

let searchTimeout: any = null

const fetchLotteries = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: '12',
    })

    if (filterStatus.value) params.append('status', filterStatus.value)
    if (sortBy.value) params.append('sortBy', sortBy.value)
    if (searchQuery.value) params.append('q', searchQuery.value)

    const response = await fetch(`${config.public.apiBase}/api/v1/lottery?${params}`)

    if (response.ok) {
      const data = await response.json()
      lotteries.value = data.data?.data || []
      totalPages.value = data.data?.meta?.totalPages || 1
    }
  } catch (error) {
    console.error('Piyango yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchLotteries()
  }, 500)
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchLotteries()
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

const getStatusText = (status: string) => {
  const statusTexts: Record<string, string> = {
    'SCHEDULED': 'Planlanmış',
    'ACTIVE': 'Aktif',
    'COMPLETED': 'Tamamlandı',
    'CANCELLED': 'İptal',
  }
  return statusTexts[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getRemainingTickets = (lottery: any) => {
  if (!lottery.maxTickets) return 'Sınırsız'
  const sold = lottery.tickets?.length || 0
  const remaining = lottery.maxTickets - sold
  return remaining > 0 ? remaining : 'Tükendi'
}

onMounted(() => {
  fetchLotteries()
})
</script>

<style scoped>
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
