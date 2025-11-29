<template>
  <div class="card overflow-hidden">
    <NuxtLink :to="`/auctions/${auction.id}`">
      <div class="aspect-video bg-gray-100 overflow-hidden relative">
        <img 
          :src="auction.product.images || 'https://via.placeholder.com/400x300'" 
          :alt="auction.product.name"
          class="w-full h-full object-cover"
        >
        <div class="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
          🔥 {{ timeRemaining }}
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-semibold mb-3">{{ auction.product.name }}</h3>
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-600">Mevcut Teklif</span>
          <span class="text-xl font-bold text-orange-500">{{ formatPrice(auction.currentBid) }} TL</span>
        </div>
        <div class="flex justify-between items-center text-sm text-gray-500">
          <span>{{ auction.bidCount }} teklif</span>
          <span>{{ formatEndTime(auction.endTime) }}</span>
        </div>
        <button class="w-full mt-4 btn-primary">
          Teklif Ver
        </button>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
interface Auction {
  id: string
  product: {
    name: string
    images: string
  }
  currentBid: number
  bidCount: number
  endTime: string
}

const props = defineProps<{
  auction: Auction
}>()

const timeRemaining = computed(() => {
  const now = new Date().getTime()
  const end = new Date(props.auction.endTime).getTime()
  const diff = end - now
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}s ${minutes}dk`
  }
  return `${minutes}dk`
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

const formatEndTime = (endTime: string) => {
  const date = new Date(endTime)
  return date.toLocaleDateString('tr-TR', { 
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
