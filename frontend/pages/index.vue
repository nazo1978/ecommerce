<template>
  <div>
    <!-- Hero Banner -->
    <section class="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-20">
      <div class="container mx-auto px-4 text-center">
        <h1 class="text-5xl font-bold mb-4">Türkiye'nin En İyi E-Ticaret Platformu</h1>
        <p class="text-xl mb-8">Milyonlarca ürün arasından seç, açık artırmalara katıl, çekilişlerde şansını dene!</p>
        <div class="flex justify-center space-x-4">
          <NuxtLink to="/products" class="bg-white text-orange-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
            Alışverişe Başla
          </NuxtLink>
          <NuxtLink to="/auctions" class="bg-transparent border-2 border-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-500 transition">
            Açık Artırma
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Featured Categories -->
    <section class="py-12">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl font-bold mb-8">Popüler Kategoriler</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div v-for="category in categories" :key="category.name" class="card p-6 text-center cursor-pointer hover:shadow-lg">
            <div class="text-4xl mb-2">{{ category.icon }}</div>
            <h3 class="font-semibold">{{ category.name }}</h3>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold">Öne Çıkan Ürünler</h2>
          <NuxtLink to="/products" class="text-orange-500 hover:text-orange-600 font-semibold">
            Tümünü Gör →
          </NuxtLink>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <ProductCard v-for="product in featuredProducts" :key="product.id" :product="product" />
        </div>
      </div>
    </section>

    <!-- Active Auctions -->
    <section class="py-12">
      <div class="container mx-auto px-4">
        <div class="flex justify-between items-center mb-8">
          <h2 class="text-3xl font-bold">Devam Eden Açık Artırmalar</h2>
          <NuxtLink to="/auctions" class="text-orange-500 hover:text-orange-600 font-semibold">
            Tümünü Gör →
          </NuxtLink>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AuctionCard v-for="auction in activeAuctions" :key="auction.id" :auction="auction" />
        </div>
      </div>
    </section>

    <!-- Lottery Section -->
    <section class="py-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-4xl font-bold mb-4">🎁 Şansını Dene, Kazan!</h2>
        <p class="text-xl mb-8">Düşük fiyatlarla bilet al, büyük ödüller kazan</p>
        <NuxtLink to="/lottery" class="bg-white text-purple-500 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-block">
          Çekilişleri Gör
        </NuxtLink>
      </div>
    </section>

    <!-- Features -->
    <section class="py-12 bg-white">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div class="text-center">
            <div class="text-4xl mb-4">🚚</div>
            <h3 class="font-semibold mb-2">Ücretsiz Kargo</h3>
            <p class="text-sm text-gray-600">150 TL ve üzeri alışverişlerde</p>
          </div>
          <div class="text-center">
            <div class="text-4xl mb-4">💳</div>
            <h3 class="font-semibold mb-2">Güvenli Ödeme</h3>
            <p class="text-sm text-gray-600">SSL sertifikalı güvenli alışveriş</p>
          </div>
          <div class="text-center">
            <div class="text-4xl mb-4">↩️</div>
            <h3 class="font-semibold mb-2">Kolay İade</h3>
            <p class="text-sm text-gray-600">14 gün içinde ücretsiz iade</p>
          </div>
          <div class="text-center">
            <div class="text-4xl mb-4">🎯</div>
            <h3 class="font-semibold mb-2">Müşteri Memnuniyeti</h3>
            <p class="text-sm text-gray-600">7/24 müşteri destek hizmeti</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const categories = ref([
  { name: 'Elektronik', icon: '📱' },
  { name: 'Moda', icon: '👕' },
  { name: 'Ev & Yaşam', icon: '🏠' },
  { name: 'Spor', icon: '⚽' },
  { name: 'Kozmetik', icon: '💄' },
  { name: 'Kitap', icon: '📚' },
])

const featuredProducts = ref([
  {
    id: '1',
    name: 'iPhone 15 Pro',
    price: 45999,
    images: 'https://images.unsplash.com/photo-1592286927505-2fd3de6ef840?w=300',
    category: 'Elektronik',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24',
    price: 39999,
    images: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300',
    category: 'Elektronik',
  },
  {
    id: '3',
    name: 'MacBook Air M3',
    price: 54999,
    images: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300',
    category: 'Elektronik',
  },
  {
    id: '4',
    name: 'AirPods Pro',
    price: 8999,
    images: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=300',
    category: 'Elektronik',
  },
  {
    id: '5',
    name: 'PlayStation 5',
    price: 24999,
    images: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300',
    category: 'Elektronik',
  },
])

const activeAuctions = ref([
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
  {
    id: '2',
    product: {
      name: 'iPad Pro 2024',
      images: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
    },
    currentBid: 18500,
    bidCount: 23,
    endTime: new Date(Date.now() + 3600000 * 2).toISOString(),
  },
  {
    id: '3',
    product: {
      name: 'Canon EOS R5',
      images: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
    },
    currentBid: 42000,
    bidCount: 18,
    endTime: new Date(Date.now() + 3600000 * 6).toISOString(),
  },
])
</script>
