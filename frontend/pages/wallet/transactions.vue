<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">İşlem Geçmişi</h1>
        <NuxtLink to="/wallet" class="text-indigo-600 hover:text-indigo-800 flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Cüzdana Dön
        </NuxtLink>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <div class="grid md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tür</label>
            <select 
              v-model="filterType" 
              @change="fetchTransactions"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tümü</option>
              <option value="DEPOSIT">Para Yükleme</option>
              <option value="WITHDRAWAL">Para Çekme</option>
              <option value="PAYMENT">Ödeme</option>
              <option value="REFUND">İade</option>
              <option value="EARNING">Kazanç</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Başlangıç Tarihi</label>
            <input 
              v-model="filterStartDate" 
              @change="fetchTransactions"
              type="date" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Bitiş Tarihi</label>
            <input 
              v-model="filterEndDate" 
              @change="fetchTransactions"
              type="date" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Miktar</label>
            <select 
              v-model="filterAmount" 
              @change="fetchTransactions"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tümü</option>
              <option value="positive">Gelir</option>
              <option value="negative">Gider</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <!-- Transactions List -->
      <div v-else-if="transactions.length" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tür
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Miktar
                </th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="transaction in transactions" :key="transaction.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ formatDate(transaction.createdAt) }}</div>
                  <div class="text-xs text-gray-500">{{ formatTime(transaction.createdAt) }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <div :class="[
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    ]">
                      <svg v-if="transaction.amount > 0" class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      <svg v-else class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                      </svg>
                    </div>
                    <span class="text-sm font-medium text-gray-900">{{ getTransactionTitle(transaction.type) }}</span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900">{{ parseMetadata(transaction.metadata) || '-' }}</div>
                  <div v-if="transaction.referenceId" class="text-xs text-gray-500">Ref: {{ transaction.referenceId }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <span :class="[
                    'text-lg font-bold',
                    transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                  ]">
                    {{ transaction.amount > 0 ? '+' : '' }}₺{{ Math.abs(transaction.amount).toFixed(2) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Tamamlandı
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
          <div class="text-sm text-gray-700">
            Toplam <span class="font-medium">{{ totalTransactions }}</span> işlem
          </div>
          <div class="flex gap-2">
            <button 
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sonraki
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <p class="text-gray-500">İşlem bulunamadı</p>
      </div>

      <!-- Export Button -->
      <div v-if="transactions.length" class="mt-6 text-center">
        <button 
          @click="exportTransactions"
          class="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          CSV Olarak İndir
        </button>
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
const transactions = ref<any[]>([])
const totalTransactions = ref(0)
const currentPage = ref(1)
const totalPages = ref(1)
const limit = 20

const filterType = ref('')
const filterStartDate = ref('')
const filterEndDate = ref('')
const filterAmount = ref('')

const getToken = () => {
  if (process.client) {
    return localStorage.getItem('accessToken')
  }
  return null
}

const fetchTransactions = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: limit.toString(),
    })

    if (filterType.value) params.append('type', filterType.value)
    if (filterStartDate.value) params.append('startDate', filterStartDate.value)
    if (filterEndDate.value) params.append('endDate', filterEndDate.value)
    if (filterAmount.value === 'positive') params.append('minAmount', '0')
    if (filterAmount.value === 'negative') params.append('maxAmount', '0')

    const response = await fetch(`${config.public.apiBase}/api/v1/wallet/transactions?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.status === 401) {
      router.push('/auth/login')
      return
    }

    if (response.ok) {
      const data = await response.json()
      transactions.value = data.data?.data || []
      totalTransactions.value = data.data?.meta?.total || 0
      totalPages.value = data.data?.meta?.totalPages || 1
    }
  } catch (error) {
    console.error('İşlem geçmişi yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchTransactions()
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

const getTransactionTitle = (type: string) => {
  const titles: Record<string, string> = {
    'DEPOSIT': 'Para Yükleme',
    'WITHDRAWAL': 'Para Çekme',
    'PAYMENT': 'Ödeme',
    'REFUND': 'İade',
    'EARNING': 'Kazanç',
  }
  return titles[type] || type
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formatTime = (date: string) => {
  return new Date(date).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const parseMetadata = (metadata: string) => {
  if (!metadata) return ''
  try {
    const data = JSON.parse(metadata)
    return data.description || data.note || ''
  } catch {
    return metadata
  }
}

const exportTransactions = () => {
  let csv = 'Tarih,Tür,Açıklama,Miktar\n'
  
  transactions.value.forEach(t => {
    const date = formatDate(t.createdAt) + ' ' + formatTime(t.createdAt)
    const type = getTransactionTitle(t.type)
    const desc = parseMetadata(t.metadata) || '-'
    const amount = (t.amount > 0 ? '+' : '') + t.amount.toFixed(2)
    
    csv += `"${date}","${type}","${desc}","${amount}"\n`
  })

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `islem-gecmisi-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

onMounted(() => {
  fetchTransactions()
})
</script>
