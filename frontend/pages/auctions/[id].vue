<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-7xl">
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else-if="auction" class="grid lg:grid-cols-3 gap-8">
        <!-- Left: Product Images & Details -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Product Images -->
          <div class="bg-white rounded-lg shadow overflow-hidden">
            <div class="aspect-w-16 aspect-h-9 bg-gray-200">
              <img 
                :src="currentImage" 
                :alt="auction.product.name" 
                class="w-full h-96 object-cover"
                @error="(e) => e.target.src = 'https://placehold.co/800x600/gray/white?text=No+Image'"
              >
            </div>
            <div v-if="productImages.length > 1" class="p-4 flex gap-2 overflow-x-auto">
              <img 
                v-for="(img, idx) in productImages" 
                :key="idx"
                :src="img" 
                @click="currentImage = img"
                :class="[
                  'w-20 h-20 object-cover rounded cursor-pointer border-2',
                  currentImage === img ? 'border-indigo-600' : 'border-gray-200'
                ]"
              >
            </div>
          </div>

          <!-- Product Description -->
          <div class="bg-white rounded-lg shadow p-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-4">{{ auction.product.name }}</h1>
            <div class="flex gap-2 mb-4">
              <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{{ auction.product.category }}</span>
              <span :class="[
                'px-3 py-1 rounded-full text-sm font-semibold',
                auction.status === 'RUNNING' ? 'bg-green-100 text-green-800' :
                auction.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              ]">
                {{ getStatusText(auction.status) }}
              </span>
            </div>
            <p class="text-gray-700 whitespace-pre-wrap">{{ auction.product.description }}</p>
          </div>

          <!-- Bid History -->
          <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b">
              <h2 class="text-xl font-bold text-gray-900">Teklif Geçmişi</h2>
            </div>
            <div v-if="!bids.length" class="p-12 text-center text-gray-500">
              Henüz teklif verilmedi
            </div>
            <div v-else class="divide-y max-h-96 overflow-y-auto">
              <div v-for="bid in bids" :key="bid.id" class="p-6 hover:bg-gray-50">
                <div class="flex justify-between items-center">
                  <div>
                    <p class="font-semibold text-gray-900">
                      {{ bid.user.firstName }} {{ bid.user.lastName?.charAt(0) }}.
                    </p>
                    <p class="text-sm text-gray-500">{{ formatDate(bid.createdAt) }}</p>
                    <span v-if="bid.isAutoBid" class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mt-1 inline-block">
                      Otomatik Teklif
                    </span>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-indigo-600">₺{{ bid.amount.toFixed(2) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Bidding Panel -->
        <div class="space-y-6">
          <!-- Auction Info Card -->
          <div class="bg-white rounded-lg shadow p-6 sticky top-4">
            <div class="mb-6">
              <p class="text-sm text-gray-600 mb-1">Başlangıç Fiyatı</p>
              <p class="text-lg font-semibold text-gray-900">₺{{ auction.startPrice.toFixed(2) }}</p>
            </div>

            <div class="mb-6 pb-6 border-b">
              <p class="text-sm text-gray-600 mb-1">Güncel Teklif</p>
              <p class="text-4xl font-bold text-indigo-600">₺{{ auction.currentBid.toFixed(2) }}</p>
              <p v-if="auction.bids?.length" class="text-xs text-gray-500 mt-1">
                {{ auction.bids.length }} teklif
              </p>
            </div>

            <!-- Countdown Timer -->
            <div v-if="auction.status === 'RUNNING'" class="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
              <p class="text-sm text-gray-600 mb-2 text-center">Kalan Süre</p>
              <p class="text-3xl font-bold text-indigo-600 text-center">{{ timeRemaining }}</p>
            </div>

            <div v-else-if="auction.status === 'SCHEDULED'" class="mb-6 p-4 bg-blue-50 rounded-lg">
              <p class="text-sm text-gray-600 mb-2 text-center">Başlangıç Zamanı</p>
              <p class="text-lg font-semibold text-blue-600 text-center">{{ formatDate(auction.startTime) }}</p>
            </div>

            <div v-else class="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <p class="text-lg font-semibold text-gray-600">Müzayede Sona Erdi</p>
              <p v-if="auction.winnerId" class="text-sm text-gray-500 mt-2">Kazanan belirlendi</p>
            </div>

            <!-- Place Bid Form -->
            <div v-if="auction.status === 'RUNNING'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Teklif Tutarı (₺)</label>
                <input 
                  v-model.number="bidAmount" 
                  type="number" 
                  :min="minBid"
                  step="0.01"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-lg font-semibold"
                  :placeholder="`Min: ₺${minBid.toFixed(2)}`"
                >
                <p class="text-xs text-gray-500 mt-1">Minimum: ₺{{ minBid.toFixed(2) }}</p>
              </div>

              <button 
                @click="placeBid"
                :disabled="processing || bidAmount < minBid"
                class="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50"
              >
                {{ processing ? 'İşleniyor...' : 'Teklif Ver' }}
              </button>

              <!-- Auto Bid -->
              <div class="border-t pt-4">
                <label class="flex items-center gap-2 mb-3">
                  <input 
                    v-model="enableAutoBid" 
                    type="checkbox" 
                    class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  >
                  <span class="text-sm font-medium text-gray-900">Otomatik Teklif Etkinleştir</span>
                </label>
                <div v-if="enableAutoBid">
                  <input 
                    v-model.number="maxAutoBid" 
                    type="number" 
                    :min="minBid"
                    step="0.01"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Maksimum teklif tutarı"
                  >
                  <p class="text-xs text-gray-500 mt-1">
                    Sistem sizin adınıza otomatik olarak teklif verecek
                  </p>
                </div>
              </div>

              <!-- Buy Now -->
              <div v-if="auction.buyNowPrice" class="border-t pt-4">
                <p class="text-sm text-gray-600 mb-2">Hemen Al Fiyatı</p>
                <p class="text-2xl font-bold text-green-600 mb-3">₺{{ auction.buyNowPrice.toFixed(2) }}</p>
                <button 
                  @click="buyNow"
                  :disabled="processing"
                  class="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50"
                >
                  {{ processing ? 'İşleniyor...' : 'Hemen Al' }}
                </button>
              </div>
            </div>

            <!-- Auction Ended - Winner Info -->
            <div v-if="auction.status === 'ENDED' && auction.winnerId">
              <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <p class="text-sm text-green-800 font-semibold text-center">
                  🏆 Müzayede Tamamlandı
                </p>
                <p v-if="isWinner" class="text-lg font-bold text-green-600 text-center mt-2">
                  Tebrikler! Kazandınız!
                </p>
              </div>
            </div>
          </div>

          <!-- Seller Info -->
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Satıcı Bilgisi</h3>
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                <span class="text-indigo-600 font-bold text-lg">
                  {{ auction.product.seller.firstName?.charAt(0) }}
                </span>
              </div>
              <div>
                <p class="font-semibold text-gray-900">
                  {{ auction.product.seller.firstName }} {{ auction.product.seller.lastName }}
                </p>
                <p class="text-sm text-gray-500">{{ auction.product.seller.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

const loading = ref(true)
const processing = ref(false)
const auction = ref<any>(null)
const bids = ref<any[]>([])
const bidAmount = ref(0)
const enableAutoBid = ref(false)
const maxAutoBid = ref(0)
const currentImage = ref('')
const timeRemaining = ref('')
const isWinner = ref(false)

let countdownInterval: any = null

const getToken = () => {
  if (process.client) {
    return localStorage.getItem('accessToken')
  }
  return null
}

const fetchAuction = async () => {
  loading.value = true
  try {
    const response = await fetch(`${config.public.apiBase}/api/v1/auctions/${route.params.id}`)

    if (response.ok) {
      const data = await response.json()
      auction.value = data.data
      bids.value = data.data.bids || []
      bidAmount.value = minBid.value
      
      if (productImages.value.length > 0) {
        currentImage.value = productImages.value[0]
      }

      // Check if current user is winner
      const token = getToken()
      if (token && auction.value.winnerId) {
        // You'd need to get current user ID from token
        // For now, we'll just show winner info
      }
    }
  } catch (error) {
    console.error('Müzayede yükleme hatası:', error)
  } finally {
    loading.value = false
  }
}

const placeBid = async () => {
  if (bidAmount.value < minBid.value) {
    alert(`Minimum teklif tutarı ₺${minBid.value.toFixed(2)}`)
    return
  }

  processing.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/auctions/${route.params.id}/bid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: bidAmount.value,
        isAutoBid: enableAutoBid.value,
        maxAutoBid: enableAutoBid.value ? maxAutoBid.value : undefined,
      }),
    })

    if (response.ok) {
      alert('Teklifiniz başarıyla alındı!')
      await fetchAuction()
      bidAmount.value = minBid.value
    } else {
      const error = await response.json()
      alert(error.message || 'Teklif verilemedi')
    }
  } catch (error) {
    console.error('Teklif verme hatası:', error)
    alert('Bir hata oluştu')
  } finally {
    processing.value = false
  }
}

const buyNow = async () => {
  if (!confirm(`Bu ürünü ₺${auction.value.buyNowPrice.toFixed(2)} karşılığında satın almak istediğinize emin misiniz?`)) {
    return
  }

  processing.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/auctions/${route.params.id}/buy-now`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      alert('Satın alma işlemi başarılı!')
      router.push('/orders')
    } else {
      const error = await response.json()
      alert(error.message || 'Satın alma başarısız')
    }
  } catch (error) {
    console.error('Satın alma hatası:', error)
    alert('Bir hata oluştu')
  } finally {
    processing.value = false
  }
}

const productImages = computed(() => {
  if (!auction.value?.product.images) return []
  const images = typeof auction.value.product.images === 'string' 
    ? JSON.parse(auction.value.product.images) 
    : auction.value.product.images
  return Array.isArray(images) ? images : []
})

const minBid = computed(() => {
  if (!auction.value) return 0
  return auction.value.currentBid + 10 // Minimum 10 TL artış
})

const getStatusText = (status: string) => {
  const statusTexts: Record<string, string> = {
    'SCHEDULED': 'Planlanmış',
    'RUNNING': 'Canlı',
    'ENDED': 'Bitti',
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

const updateCountdown = () => {
  if (!auction.value || auction.value.status !== 'RUNNING') {
    timeRemaining.value = ''
    return
  }

  const now = new Date().getTime()
  const end = new Date(auction.value.endTime).getTime()
  const distance = end - now

  if (distance < 0) {
    timeRemaining.value = 'Bitti'
    clearInterval(countdownInterval)
    fetchAuction() // Refresh to get final status
    return
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24))
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((distance % (1000 * 60)) / 1000)

  if (days > 0) {
    timeRemaining.value = `${days}g ${hours}s ${minutes}d`
  } else if (hours > 0) {
    timeRemaining.value = `${hours}s ${minutes}d ${seconds}sn`
  } else {
    timeRemaining.value = `${minutes}d ${seconds}sn`
  }
}

onMounted(() => {
  fetchAuction()
  countdownInterval = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  clearInterval(countdownInterval)
})
</script>
