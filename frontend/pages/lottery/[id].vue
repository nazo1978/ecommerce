<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else-if="lottery" class="grid lg:grid-cols-3 gap-8">
        <!-- Lottery Info -->
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-8 text-white">
            <span :class="[
              'px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block',
              lottery.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'
            ]">
              {{ getStatusText(lottery.status) }}
            </span>
            <h1 class="text-3xl font-bold mb-4">{{ lottery.title }}</h1>
            <p class="text-white/90 mb-6">{{ lottery.description || 'Açıklama yok' }}</p>
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-white/20 rounded-lg p-4">
                <p class="text-xs opacity-75">Ödül Havuzu</p>
                <p class="text-3xl font-bold">₺{{ lottery.prizePool.toFixed(2) }}</p>
              </div>
              <div class="bg-white/20 rounded-lg p-4">
                <p class="text-xs opacity-75">Çekiliş Tarihi</p>
                <p class="text-lg font-semibold">{{ formatDate(lottery.drawDate) }}</p>
              </div>
            </div>
          </div>

          <!-- My Tickets -->
          <div v-if="myTickets.length" class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
              <h2 class="text-xl font-bold text-gray-900">Biletlerim</h2>
            </div>
            <div class="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div v-for="ticket in myTickets" :key="ticket.id" :class="[
                'border-2 rounded-lg p-4 text-center',
                ticket.isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
              ]">
                <p class="text-xs text-gray-500">Bilet No</p>
                <p class="text-2xl font-bold text-indigo-600">{{ ticket.ticketNumber }}</p>
                <p v-if="ticket.isWinner" class="text-xs text-green-600 font-semibold mt-2">🏆 Kazandı!</p>
              </div>
            </div>
          </div>

          <!-- Winners -->
          <div v-if="lottery.status === 'COMPLETED' && winners.length" class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
              <h2 class="text-xl font-bold text-gray-900">Kazananlar</h2>
            </div>
            <div class="divide-y">
              <div v-for="winner in winners" :key="winner.id" class="p-6">
                <div class="flex justify-between items-center">
                  <div>
                    <p class="font-semibold text-gray-900">Bilet: {{ winner.ticket.ticketNumber }}</p>
                    <p class="text-sm text-gray-600">{{ winner.prizeTier }}. Ödül</p>
                  </div>
                  <p class="text-2xl font-bold text-green-600">₺{{ winner.prizeAmount.toFixed(2) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Buy Tickets Panel -->
        <div>
          <div class="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Bilet Satın Al</h2>

            <div v-if="lottery.status === 'ACTIVE'">
              <div class="mb-6">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-gray-600">Bilet Fiyatı</span>
                  <span class="font-semibold">₺{{ lottery.ticketPrice.toFixed(2) }}</span>
                </div>
                <div v-if="lottery.maxTickets" class="flex justify-between text-sm">
                  <span class="text-gray-600">Kalan Bilet</span>
                  <span class="font-semibold">{{ getRemainingTickets() }}</span>
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">Bilet Adedi</label>
                <input 
                  v-model.number="ticketQuantity" 
                  type="number" 
                  min="1" 
                  :max="getMaxPurchase()"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-semibold"
                >
              </div>

              <div class="mb-6 p-4 bg-gray-50 rounded-lg">
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-gray-600">Bilet Adedi</span>
                  <span class="font-semibold">{{ ticketQuantity }}</span>
                </div>
                <div class="flex justify-between text-lg font-bold">
                  <span>Toplam</span>
                  <span class="text-indigo-600">₺{{ (lottery.ticketPrice * ticketQuantity).toFixed(2) }}</span>
                </div>
              </div>

              <button 
                @click="buyTickets"
                :disabled="processing || ticketQuantity < 1"
                class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50"
              >
                {{ processing ? 'İşleniyor...' : 'Bilet Al' }}
              </button>
            </div>

            <div v-else-if="lottery.status === 'SCHEDULED'" class="text-center py-8">
              <p class="text-gray-600">Piyango henüz başlamadı</p>
              <p class="text-sm text-gray-500 mt-2">{{ formatDate(lottery.drawDate) }} tarihinde başlayacak</p>
            </div>

            <div v-else class="text-center py-8">
              <p class="text-gray-600">Piyango sona erdi</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const loading = ref(true)
const processing = ref(false)
const lottery = ref<any>(null)
const myTickets = ref<any[]>([])
const winners = ref<any[]>([])
const ticketQuantity = ref(1)

const getToken = () => {
  if (process.client) return localStorage.getItem('accessToken')
  return null
}

const fetchLottery = async () => {
  loading.value = true
  try {
    const response = await fetch(`${config.public.apiBase}/api/v1/lottery/${route.params.id}`)

    if (response.ok) {
      const data = await response.json()
      lottery.value = data.data
      winners.value = data.data.winners || []

      // Fetch my tickets
      const token = getToken()
      if (token) {
        const myTicketsRes = await fetch(`${config.public.apiBase}/api/v1/lottery/${route.params.id}/my-tickets`, {
          headers: { 'Authorization': `Bearer ${token}` },
        })
        if (myTicketsRes.ok) {
          const ticketsData = await myTicketsRes.json()
          myTickets.value = ticketsData.data || []
        }
      }
    }
  } catch (error) {
    console.error('Piyango yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

const buyTickets = async () => {
  if (ticketQuantity.value < 1) return

  processing.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/lottery/${route.params.id}/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ quantity: ticketQuantity.value }),
    })

    if (response.ok) {
      alert('Bilet satın alma başarılı!')
      ticketQuantity.value = 1
      await fetchLottery()
    } else {
      const error = await response.json()
      alert(error.message || 'Bilet alınamadı')
    }
  } catch (error) {
    console.error('Bilet satın alma hatası:', error)
    alert('Bir hata oluştu')
  } finally {
    processing.value = false
  }
}

const getRemainingTickets = () => {
  if (!lottery.value.maxTickets) return 'Sınırsız'
  const sold = lottery.value.tickets?.length || 0
  return lottery.value.maxTickets - sold
}

const getMaxPurchase = () => {
  if (!lottery.value.maxTickets) return 100
  const remaining = getRemainingTickets()
  return typeof remaining === 'number' ? Math.min(remaining, 100) : 100
}

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

onMounted(() => {
  fetchLottery()
})
</script>
