<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Cüzdanım</h1>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else class="grid lg:grid-cols-3 gap-8">
        <!-- Wallet Balance Card -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
            <div class="flex justify-between items-start mb-6">
              <div>
                <p class="text-indigo-100 text-sm mb-2">Mevcut Bakiye</p>
                <h2 class="text-4xl font-bold">₺{{ wallet.balance?.toFixed(2) || '0.00' }}</h2>
              </div>
              <div class="bg-white/20 p-3 rounded-lg">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
                </svg>
              </div>
            </div>
            <div class="flex gap-4">
              <button 
                @click="showAddFunds = true"
                class="flex-1 bg-white text-indigo-600 py-2 px-4 rounded-lg font-semibold hover:bg-indigo-50"
              >
                Para Ekle
              </button>
              <button 
                @click="showWithdraw = true"
                class="flex-1 bg-white/20 text-white py-2 px-4 rounded-lg font-semibold hover:bg-white/30"
              >
                Para Çek
              </button>
            </div>
          </div>

          <!-- Recent Transactions -->
          <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
              <div class="flex justify-between items-center">
                <h2 class="text-xl font-bold text-gray-900">Son İşlemler</h2>
                <NuxtLink to="/wallet/transactions" class="text-indigo-600 hover:text-indigo-800 text-sm">
                  Tümünü Gör
                </NuxtLink>
              </div>
            </div>
            
            <div v-if="!transactions.length" class="p-12 text-center">
              <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              <p class="text-gray-500">Henüz işlem yapılmadı</p>
            </div>

            <div v-else class="divide-y">
              <div v-for="transaction in transactions.slice(0, 5)" :key="transaction.id" class="p-6 hover:bg-gray-50">
                <div class="flex justify-between items-start">
                  <div class="flex gap-4">
                    <div :class="[
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      transaction.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    ]">
                      <svg v-if="transaction.amount > 0" class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                      <svg v-else class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path>
                      </svg>
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ getTransactionTitle(transaction.type) }}</p>
                      <p class="text-sm text-gray-500">{{ formatDate(transaction.createdAt) }}</p>
                      <p v-if="transaction.metadata" class="text-xs text-gray-400 mt-1">
                        {{ parseMetadata(transaction.metadata) }}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p :class="[
                      'text-lg font-bold',
                      transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    ]">
                      {{ transaction.amount > 0 ? '+' : '' }}₺{{ Math.abs(transaction.amount).toFixed(2) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="space-y-6">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Bu Ay</h3>
            <div class="space-y-4">
              <div>
                <p class="text-sm text-gray-600 mb-1">Toplam Gelir</p>
                <p class="text-2xl font-bold text-green-600">₺{{ monthlyIncome.toFixed(2) }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600 mb-1">Toplam Gider</p>
                <p class="text-2xl font-bold text-red-600">₺{{ monthlyExpense.toFixed(2) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Hızlı İşlemler</h3>
            <div class="space-y-3">
              <button 
                @click="showAddFunds = true"
                class="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center gap-3"
              >
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </div>
                <span class="font-medium text-gray-900">Para Ekle</span>
              </button>
              <NuxtLink 
                to="/wallet/transactions"
                class="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center gap-3"
              >
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                </div>
                <span class="font-medium text-gray-900">İşlem Geçmişi</span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Funds Modal -->
      <div v-if="showAddFunds" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showAddFunds = false">
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">Para Ekle</h3>
          <form @submit.prevent="addFunds">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Miktar (₺)</label>
              <input 
                v-model.number="addAmount" 
                type="number" 
                min="10" 
                step="0.01"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="100.00"
              >
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Ödeme Yöntemi</label>
              <select 
                v-model="paymentProvider" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="credit_card">Kredi Kartı</option>
                <option value="bank_transfer">Banka Transferi</option>
              </select>
            </div>
            <div class="flex gap-3">
              <button 
                type="button" 
                @click="showAddFunds = false"
                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button 
                type="submit"
                :disabled="processing"
                class="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ processing ? 'İşleniyor...' : 'Ekle' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Withdraw Modal -->
      <div v-if="showWithdraw" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click.self="showWithdraw = false">
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h3 class="text-2xl font-bold text-gray-900 mb-6">Para Çek</h3>
          <form @submit.prevent="withdrawFunds">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Miktar (₺)</label>
              <input 
                v-model.number="withdrawAmount" 
                type="number" 
                :max="wallet.balance" 
                min="10" 
                step="0.01"
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="100.00"
              >
              <p class="text-xs text-gray-500 mt-1">Maksimum: ₺{{ wallet.balance?.toFixed(2) }}</p>
            </div>
            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Banka Hesabı</label>
              <input 
                v-model="bankAccount" 
                type="text" 
                required
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="TR00 0000 0000 0000 0000 0000 00"
              >
            </div>
            <div class="flex gap-3">
              <button 
                type="button" 
                @click="showWithdraw = false"
                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button 
                type="submit"
                :disabled="processing"
                class="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {{ processing ? 'İşleniyor...' : 'Çek' }}
              </button>
            </div>
          </form>
        </div>
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
const processing = ref(false)
const wallet = ref<any>({})
const transactions = ref<any[]>([])
const showAddFunds = ref(false)
const showWithdraw = ref(false)
const addAmount = ref(100)
const withdrawAmount = ref(100)
const paymentProvider = ref('credit_card')
const bankAccount = ref('')

const getToken = () => {
  if (process.client) {
    return localStorage.getItem('accessToken')
  }
  return null
}

const fetchWallet = async () => {
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/wallet`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.status === 401) {
      router.push('/auth/login')
      return
    }

    if (response.ok) {
      const data = await response.json()
      wallet.value = data.data || {}
    }
  } catch (error) {
    console.error('Cüzdan yükleme hatası:', error)
  }
}

const fetchTransactions = async () => {
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/wallet/transactions?limit=10`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.ok) {
      const data = await response.json()
      transactions.value = data.data?.data || []
    }
  } catch (error) {
    console.error('İşlem geçmişi yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

const addFunds = async () => {
  if (addAmount.value < 10) {
    alert('Minimum 10 TL ekleme yapabilirsiniz')
    return
  }

  processing.value = true
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/wallet/add-funds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: addAmount.value,
        provider: paymentProvider.value,
      }),
    })

    if (response.ok) {
      alert('Para başarıyla eklendi!')
      showAddFunds.value = false
      addAmount.value = 100
      await fetchWallet()
      await fetchTransactions()
    } else {
      const error = await response.json()
      alert(error.message || 'Para eklenemedi')
    }
  } catch (error) {
    console.error('Para ekleme hatası:', error)
    alert('Bir hata oluştu')
  } finally {
    processing.value = false
  }
}

const withdrawFunds = async () => {
  if (withdrawAmount.value > wallet.value.balance) {
    alert('Yetersiz bakiye')
    return
  }

  processing.value = true
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/wallet/withdraw`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: withdrawAmount.value,
        bankAccount: bankAccount.value,
      }),
    })

    if (response.ok) {
      alert('Para çekme talebi oluşturuldu!')
      showWithdraw.value = false
      withdrawAmount.value = 100
      bankAccount.value = ''
      await fetchWallet()
      await fetchTransactions()
    } else {
      const error = await response.json()
      alert(error.message || 'Para çekilemedi')
    }
  } catch (error) {
    console.error('Para çekme hatası:', error)
    alert('Bir hata oluştu')
  } finally {
    processing.value = false
  }
}

const monthlyIncome = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return transactions.value
    .filter(t => {
      const date = new Date(t.createdAt)
      return t.amount > 0 && date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + t.amount, 0)
})

const monthlyExpense = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return Math.abs(transactions.value
    .filter(t => {
      const date = new Date(t.createdAt)
      return t.amount < 0 && date.getMonth() === currentMonth && date.getFullYear() === currentYear
    })
    .reduce((sum, t) => sum + t.amount, 0))
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
    hour: '2-digit',
    minute: '2-digit',
  })
}

const parseMetadata = (metadata: string) => {
  try {
    const data = JSON.parse(metadata)
    return data.description || data.note || ''
  } catch {
    return ''
  }
}

onMounted(() => {
  fetchWallet()
  fetchTransactions()
})
</script>
