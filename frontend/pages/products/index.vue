<template>
  <div class="container mx-auto px-4 py-8">
    <!-- Breadcrumb -->
    <nav class="mb-6 text-sm">
      <NuxtLink to="/" class="text-gray-500 hover:text-orange-500">Ana Sayfa</NuxtLink>
      <span class="mx-2 text-gray-400">/</span>
      <span class="text-gray-900">Tüm Ürünler</span>
    </nav>

    <div class="flex gap-6">
      <!-- Filters Sidebar -->
      <aside class="w-64 flex-shrink-0">
        <div class="card p-4 sticky top-24">
          <h3 class="font-semibold mb-4">Filtrele</h3>
          
          <!-- Category Filter -->
          <div class="mb-6">
            <h4 class="text-sm font-semibold mb-2">Kategori</h4>
            <div class="space-y-2">
              <label v-for="cat in categories" :key="cat" class="flex items-center">
                <input type="checkbox" class="mr-2" :value="cat">
                <span class="text-sm">{{ cat }}</span>
              </label>
            </div>
          </div>

          <!-- Price Filter -->
          <div class="mb-6">
            <h4 class="text-sm font-semibold mb-2">Fiyat Aralığı</h4>
            <div class="flex gap-2">
              <input type="number" placeholder="Min" class="input-field text-sm py-1">
              <input type="number" placeholder="Max" class="input-field text-sm py-1">
            </div>
          </div>

          <!-- Status Filter -->
          <div class="mb-6">
            <h4 class="text-sm font-semibold mb-2">Durum</h4>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" class="mr-2">
                <span class="text-sm">Ücretsiz Kargo</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" class="mr-2">
                <span class="text-sm">İndirimli</span>
              </label>
            </div>
          </div>

          <button class="btn-primary w-full">Filtrele</button>
        </div>
      </aside>

      <!-- Products Grid -->
      <div class="flex-1">
        <!-- Sort Bar -->
        <div class="flex justify-between items-center mb-6">
          <p class="text-sm text-gray-600">{{ totalProducts }} ürün bulundu</p>
          <select class="input-field text-sm py-2 w-auto">
            <option>Önerilen Sıralama</option>
            <option>En Düşük Fiyat</option>
            <option>En Yüksek Fiyat</option>
            <option>En Yeniler</option>
            <option>En Çok Satan</option>
          </select>
        </div>

        <!-- Products -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ProductCard v-for="product in products" :key="product.id" :product="product" />
        </div>

        <!-- Pagination -->
        <div class="flex justify-center items-center space-x-2 mt-8">
          <button class="px-4 py-2 border rounded hover:bg-gray-50">Önceki</button>
          <button class="px-4 py-2 bg-orange-500 text-white rounded">1</button>
          <button class="px-4 py-2 border rounded hover:bg-gray-50">2</button>
          <button class="px-4 py-2 border rounded hover:bg-gray-50">3</button>
          <button class="px-4 py-2 border rounded hover:bg-gray-50">Sonraki</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const categories = ref(['Elektronik', 'Moda', 'Ev & Yaşam', 'Spor', 'Kozmetik', 'Kitap', 'Oyuncak'])
const totalProducts = ref(156)

const products = ref([
  {
    id: '1',
    name: 'iPhone 15 Pro Max 256GB',
    price: 52999,
    images: 'https://images.unsplash.com/photo-1592286927505-2fd3de6ef840?w=300',
    category: 'Elektronik',
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24 Ultra',
    price: 45999,
    images: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300',
    category: 'Elektronik',
  },
  {
    id: '3',
    name: 'Sony WH-1000XM5 Kulaklık',
    price: 11999,
    images: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300',
    category: 'Elektronik',
  },
  {
    id: '4',
    name: 'Apple Watch Series 9',
    price: 14999,
    images: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=300',
    category: 'Elektronik',
  },
  {
    id: '5',
    name: 'Dell XPS 15 Laptop',
    price: 42999,
    images: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300',
    category: 'Elektronik',
  },
  {
    id: '6',
    name: 'Nike Air Max 270',
    price: 4999,
    images: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
    category: 'Spor',
  },
  {
    id: '7',
    name: 'Adidas Ultraboost 22',
    price: 5499,
    images: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=300',
    category: 'Spor',
  },
  {
    id: '8',
    name: 'Dyson V15 Süpürge',
    price: 19999,
    images: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=300',
    category: 'Ev & Yaşam',
  },
])
</script>
