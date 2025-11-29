<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Tekliflerim</h1>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else-if="bids.length" class="bg-white rounded-lg shadow overflow-hidden">
        <div class="divide-y">
          <div v-for="bid in bids" :key="bid.id" class="p-6 hover:bg-gray-50">
            <div class="flex gap-6">
              <img 
                :src="getProductImage(bid.auction.product)" 
                :alt="bid.auction.product.name" 
                class="w-24 h-24 object-cover rounded"
              >
              <div class="flex-1">
                <NuxtLink :to="`/auctions/${bid.auction.id}`" class="text-lg font-bold text-gray-900 hover:text-indigo-600">
                  {{ bid.auction.product.name }}
                </NuxtLink>
                <p class="text-sm text-gray-600 mt-1">{{ formatDate(bid.createdAt) }}</p>
                <div class="flex gap-4 mt-3">
                  <div>
                    <p class="text-xs text-gray-500">Sizin Teklifiniz</p>
                    <p class="text-lg font-bold text-indigo-600">₺{{ bid.amount.toFixed(2) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Güncel Teklif</p>
                    <p class="text-lg font-bold text-gray-900">₺{{ bid.auction.currentBid.toFixed(2) }}</p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500">Durum</p>
                    <span :class="[
                      'px-2 py-1 rounded text-xs font-semibold',
                      bid.auction.status === 'RUNNING' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    ]">
                      {{ bid.auction.status === 'RUNNING' ? 'Aktif' : 'Bitti' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <p class="text-gray-500">Henüz teklif vermediniz</p>
        <NuxtLink to="/auctions" class="inline-block mt-4 text-indigo-600 hover:text-indigo-800">
          Müzayedelere Göz Atın
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const config = useRuntimeConfig()
const loading = ref(true)
const bids = ref<any[]>([])

const getToken = () => {
  if (process.client) return localStorage.getItem('accessToken')
  return null
}

const fetchMyBids = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/auctions/my-bids`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.ok) {
      const data = await response.json()
      bids.value = data.data || []
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const getProductImage = (product: any) => {
  if (product.images) {
    const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images
    return images[0] || 'https://placehold.co/100x100/gray/white?text=No+Image'
  }
  return 'https://placehold.co/100x100/gray/white?text=No+Image'
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
  fetchMyBids()
})
</script>
