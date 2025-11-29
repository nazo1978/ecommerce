<template>
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="container mx-auto px-4">
        <!-- Top Bar -->
        <div class="flex items-center justify-between py-3 border-b border-gray-200">
          <NuxtLink to="/" class="text-2xl font-bold text-orange-500">
            E-Commerce
          </NuxtLink>

          <!-- Search Bar -->
          <div class="flex-1 max-w-2xl mx-8">
            <div class="relative">
              <input
                type="text"
                placeholder="Ürün, kategori veya marka ara"
                class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
              >
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- User Actions -->
          <div class="flex items-center space-x-4">
            <template v-if="isAuthenticated">
              <div class="relative" ref="dropdownRef">
                <button 
                  @click="toggleDropdown" 
                  class="flex items-center space-x-2 hover:text-orange-500 focus:outline-none"
                  aria-haspopup="true"
                  :aria-expanded="isDropdownOpen"
                >
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span class="text-sm">{{ user?.firstName || 'Hesabım' }}</span>
                  <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                <!-- Dropdown -->
                <div 
                  v-show="isDropdownOpen" 
                  class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-200"
                  role="menu"
                >
                  <NuxtLink 
                    to="/account" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="closeDropdown"
                    role="menuitem"
                  >
                    Hesabım
                  </NuxtLink>
                  <NuxtLink 
                    to="/orders" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    @click="closeDropdown"
                    role="menuitem"
                  >
                    Siparişlerim
                  </NuxtLink>
                  <button 
                    @click="handleLogout" 
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Çıkış Yap
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <NuxtLink to="/auth/login" class="flex items-center space-x-2 hover:text-orange-500">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span class="text-sm">Giriş Yap</span>
              </NuxtLink>
            </template>

            <NuxtLink to="/cart" class="relative flex items-center space-x-2 hover:text-orange-500">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span class="text-sm">Sepetim</span>
              <span class="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>
            </NuxtLink>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex items-center space-x-8 py-3">
          <NuxtLink to="/products" class="text-sm font-medium hover:text-orange-500">
            Tüm Ürünler
          </NuxtLink>
          <NuxtLink to="/auctions" class="text-sm font-medium hover:text-orange-500">
            Açık Artırma
          </NuxtLink>
          <NuxtLink to="/lottery" class="text-sm font-medium hover:text-orange-500">
            Çekiliş
          </NuxtLink>
          <NuxtLink to="/categories" class="text-sm font-medium hover:text-orange-500">
            Kategoriler
          </NuxtLink>
          
          <!-- Role-based navigation -->
          <template v-if="user && user.primaryRole === 'ADMIN'">
            <NuxtLink to="/admin" class="text-sm font-medium hover:text-orange-500">
              Yönetici Paneli
            </NuxtLink>
          </template>
          
          <template v-else-if="user && user.primaryRole === 'SELLER'">
            <NuxtLink to="/seller" class="text-sm font-medium hover:text-orange-500">
              Satıcı Paneli
            </NuxtLink>
          </template>
        </nav>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-gray-800 text-white py-12 mt-12">
      <div class="container mx-auto px-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 class="text-lg font-semibold mb-4">E-Commerce</h3>
            <p class="text-sm text-gray-400">
              En iyi ürünleri en uygun fiyatlarla keşfedin.
            </p>
          </div>
          <div>
            <h4 class="text-sm font-semibold mb-4">Kurumsal</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a href="#" class="hover:text-white">Hakkımızda</a></li>
              <li><a href="#" class="hover:text-white">İletişim</a></li>
              <li><a href="#" class="hover:text-white">Kariyer</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold mb-4">Yardım</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a href="#" class="hover:text-white">Sıkça Sorulan Sorular</a></li>
              <li><a href="#" class="hover:text-white">Kargo & Teslimat</a></li>
              <li><a href="#" class="hover:text-white">İptal & İade</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold mb-4">Sosyal Medya</h4>
            <div class="flex space-x-4">
              <a href="#" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="#" class="text-gray-400 hover:text-white">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, user, logout } = useAuth()
const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

const handleLogout = () => {
  closeDropdown()
  logout()
}

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

const closeDropdown = () => {
  isDropdownOpen.value = false
}

// Close dropdown when clicking outside
onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.value && !(dropdownRef.value as HTMLElement).contains(event.target as Node)) {
      closeDropdown()
    }
  }
  
  document.addEventListener('click', handleClickOutside)
  
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>