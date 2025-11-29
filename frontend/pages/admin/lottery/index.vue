<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Piyango Yönetimi</h1>
          <p class="text-gray-600 mt-1">Tüm piyango çekilişlerini görüntüle ve yönet</p>
        </div>
        <NuxtLink to="/admin" class="text-indigo-600 hover:text-indigo-800">
          ← Admin Paneline Dön
        </NuxtLink>
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
              <option value="CANCELLED">İptal</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sayfa Başına</label>
            <select 
              v-model="limit" 
              @change="fetchLotteries"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="50">50</option>
              <option :value="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Lotteries Table -->
      <div v-else-if="lotteries.length" class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Başlık</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Çekiliş Tarihi</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bilet Fiyatı</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ödül Havuzu</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satılan Bilet</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="lottery in lotteries" :key="lottery.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="text-sm font-medium text-gray-900">{{ lottery.title }}</div>
                <div class="text-xs text-gray-500">ID: {{ lottery.id.substring(0, 8) }}</div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ formatDate(lottery.drawDate) }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">₺{{ lottery.ticketPrice.toFixed(2) }}</td>
              <td class="px-6 py-4">
                <span class="text-lg font-bold text-green-600">₺{{ lottery.prizePool.toFixed(2) }}</span>
              </td>
              <td class="px-6 py-4">
                <span :class="[
                  'px-2 py-1 rounded-full text-xs font-semibold',
                  lottery.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                  lottery.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                  lottery.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                ]">
                  {{ getStatusText(lottery.status) }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900 text-center">
                {{ lottery.tickets?.length || 0 }}
                <span v-if="lottery.maxTickets" class="text-xs text-gray-500">
                  / {{ lottery.maxTickets }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div class="text-sm text-gray-700">
            Toplam <span class="font-medium">{{ totalLotteries }}</span> piyango
          </div>
          <div class="flex gap-2">
            <button 
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50"
            >
              Önceki
            </button>
            <div class="flex gap-1">
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
            </div>
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

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <p class="text-gray-500">Piyango bulunamadı</p>
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
const lotteries = ref<any[]>([])
const totalLotteries = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const limit = ref(20)
const filterStatus = ref('')

const getToken = () => {
  if (process.client) return localStorage.getItem('accessToken')
  return null
}

const fetchLotteries = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.value.toString(),
    })

    if (filterStatus.value) params.append('status', filterStatus.value)

    const response = await fetch(`${config.public.apiBase}/api/v1/admin/lottery?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.status === 401) {
      router.push('/auth/login')
      return
    }

    if (response.ok) {
      const data = await response.json()
      lotteries.value = data.data?.data || []
      totalLotteries.value = data.data?.meta?.total || 0
      totalPages.value = data.data?.meta?.totalPages || 1
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
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
  return new Date(date).toLocaleString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchLotteries()
})
</script>
