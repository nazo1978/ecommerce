<template>
  <div class="container mx-auto px-4 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Product Image -->
      <div>
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          <img 
            :src="product.images" 
            :alt="product.name"
            class="w-full h-full object-cover"
          >
        </div>
      </div>

      <!-- Product Info -->
      <div>
        <nav class="text-sm text-gray-500 mb-4">
          <NuxtLink to="/">Ana Sayfa</NuxtLink> / 
          <NuxtLink to="/products">Ürünler</NuxtLink> / 
          <span class="text-gray-900">{{ product.name }}</span>
        </nav>

        <h1 class="text-3xl font-bold mb-4">{{ product.name }}</h1>
        <p class="text-sm text-gray-600 mb-6">{{ product.category }}</p>

        <div class="bg-gray-50 p-6 rounded-lg mb-6">
          <div class="text-3xl font-bold text-orange-500 mb-2">
            {{ formatPrice(product.price) }} TL
          </div>
          <p class="text-sm text-green-600">✓ Ücretsiz Kargo</p>
        </div>

        <div class="mb-6">
          <h3 class="font-semibold mb-2">Ürün Açıklaması</h3>
          <p class="text-gray-600">{{ product.description }}</p>
        </div>

        <div class="flex gap-4">
          <button class="btn-primary flex-1">
            <svg class="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Sepete Ekle
          </button>
          <button class="btn-secondary">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = route.params.id

const product = ref({
  id,
  name: 'iPhone 15 Pro Max',
  price: 52999,
  images: 'https://images.unsplash.com/photo-1592286927505-2fd3de6ef840?w=600',
  category: 'Elektronik',
  description: 'En son teknoloji ile donatılmış iPhone 15 Pro Max. A17 Pro çip, titanyum tasarım ve gelişmiş kamera sistemi.',
})

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}
</script>
