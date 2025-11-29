<template>
  <div class="product-card">
    <NuxtLink :to="`/products/${product.id}`">
      <div class="aspect-square bg-gray-100 overflow-hidden">
        <img 
          :src="product.images || 'https://via.placeholder.com/300'" 
          :alt="product.name"
          class="product-image w-full h-full object-cover"
        >
      </div>
      <div class="p-4">
        <p class="text-xs text-gray-500 mb-1">{{ product.category }}</p>
        <h3 class="font-semibold text-sm mb-2 line-clamp-2">{{ product.name }}</h3>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold text-orange-500">{{ formatPrice(product.price) }} TL</span>
          <button class="text-gray-400 hover:text-orange-500">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
interface Product {
  id: string
  name: string
  price: number
  images: string
  category: string
}

defineProps<{
  product: Product
}>()

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}
</script>
