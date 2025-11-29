<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Açık Artırmalar</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AuctionCard v-for="auction in auctions" :key="auction.id" :auction="auction" />
    </div>
  </div>
</template>

<script setup lang="ts">
const auctions = ref([
  {
    id: '1',
    product: {
      name: 'Rolex Submariner',
      images: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400',
    },
    currentBid: 125000,
    bidCount: 45,
    endTime: new Date(Date.now() + 3600000 * 4).toISOString(),
  },
])
</script>
