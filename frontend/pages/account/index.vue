<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Hesabım</h1>
    
    <div v-if="!isAuthenticated" class="card p-6">
      <p class="text-gray-600">Giriş yapmadınız</p>
      <NuxtLink to="/auth/login" class="btn-primary mt-4 inline-block">
        Giriş Yap
      </NuxtLink>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Profile Information -->
      <div class="lg:col-span-1">
        <div class="card p-6">
          <div class="flex items-center mb-6">
            <div class="w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mr-4">
              <span class="text-xl font-bold">{{ user?.firstName?.charAt(0) || 'U' }}{{ user?.lastName?.charAt(0) || '' }}</span>
            </div>
            <div>
              <h2 class="text-xl font-semibold">{{ user?.firstName }} {{ user?.lastName }}</h2>
              <p class="text-gray-500">{{ user?.email }}</p>
            </div>
          </div>
          
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-500">Üyelik Tarihi:</span>
              <span>15 Haziran 2023</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Rol:</span>
              <span class="font-medium">{{ getRoleLabel(user?.primaryRole) }}</span>
            </div>
          </div>
          
          <button @click="handleLogout" class="btn-secondary w-full mt-6">
            Çıkış Yap
          </button>
        </div>
      </div>
      
      <!-- Account Options -->
      <div class="lg:col-span-2">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <NuxtLink to="/orders" class="card p-6 hover:shadow-md transition-shadow">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold">Siparişlerim</h3>
                <p class="text-sm text-gray-500 mt-1">Sipariş geçmişinizi görüntüleyin</p>
              </div>
            </div>
          </NuxtLink>
          
          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold">Cüzdanım</h3>
                <p class="text-sm text-gray-500 mt-1">Bakiyenizi yönetin</p>
              </div>
            </div>
          </div>
          
          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold">Profil Bilgileri</h3>
                <p class="text-sm text-gray-500 mt-1">Kişisel bilgilerinizi güncelleyin</p>
              </div>
            </div>
          </div>
          
          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 class="font-semibold">Güvenlik</h3>
                <p class="text-sm text-gray-500 mt-1">Şifre ve güvenlik ayarlarınızı yönetin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isAuthenticated, user, logout } = useAuth()
const router = useRouter()

const handleLogout = () => {
  logout()
  router.push('/auth/login')
}

const getRoleLabel = (role) => {
  const roleLabels = {
    'ADMIN': 'Yönetici',
    'SELLER': 'Satıcı',
    'CUSTOMER': 'Müşteri'
  }
  return roleLabels[role] || role
}
</script>
