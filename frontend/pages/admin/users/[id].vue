<template>
  <div class="container mx-auto px-4 py-8">
    <div class="mb-6">
      <button @click="router.back()" class="text-orange-600 hover:text-orange-700 flex items-center mb-4">
        <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Users
      </button>
      <h1 class="text-3xl font-bold">User Details</h1>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading user details...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
      <p class="text-sm">{{ error }}</p>
    </div>

    <!-- User Details -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left Column - User Info -->
      <div class="lg:col-span-1 space-y-6">
        <!-- Profile Card -->
        <div class="card p-6">
          <div class="flex flex-col items-center">
            <div class="w-24 h-24 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <span class="text-3xl font-bold">{{ getInitials(user) }}</span>
            </div>
            <h2 class="text-xl font-semibold text-center">{{ user.firstName }} {{ user.lastName }}</h2>
            <p class="text-gray-500 text-center">{{ user.email }}</p>
            <div class="mt-4">
              <span :class="getRoleBadgeClass(user.primaryRole)" class="px-3 py-1 inline-flex text-sm font-semibold rounded-full">
                {{ user.primaryRole }}
              </span>
            </div>
          </div>

          <div class="mt-6 border-t pt-6 space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Status</span>
              <span :class="user.emailVerified ? 'text-green-600' : 'text-yellow-600'" class="font-medium">
                {{ user.emailVerified ? 'Verified' : 'Unverified' }}
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">2FA</span>
              <span class="font-medium">{{ user.twoFactorEnabled ? 'Enabled' : 'Disabled' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Member Since</span>
              <span class="font-medium">{{ formatDate(user.createdAt) }}</span>
            </div>
          </div>
        </div>

        <!-- Wallet Card -->
        <div v-if="user.wallet" class="card p-6">
          <h3 class="text-lg font-semibold mb-4">Wallet</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-gray-600">Balance</span>
              <span class="text-2xl font-bold text-green-600">₺{{ Number(user.wallet.balance).toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Currency</span>
              <span class="font-medium">{{ user.wallet.currency }}</span>
            </div>
          </div>
        </div>

        <!-- Actions Card -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4">Actions</h3>
          <div class="space-y-3">
            <button @click="suspendUser" class="btn-secondary w-full">
              Suspend User
            </button>
            <button @click="resetPassword" class="btn-secondary w-full">
              Reset Password
            </button>
            <button @click="viewActivity" class="btn-secondary w-full">
              View Activity Log
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column - Activity & Stats -->
      <div class="lg:col-span-2 space-y-6">
        <!-- Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Total Orders</p>
                <p class="text-2xl font-bold">{{ user._count?.orders || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Products</p>
                <p class="text-2xl font-bold">{{ user._count?.products || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <div class="flex items-center">
              <div class="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <div>
                <p class="text-gray-500 text-sm">Lottery Tickets</p>
                <p class="text-2xl font-bold">{{ user._count?.lotteryTickets || 0 }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Roles & Permissions -->
        <div class="card p-6">
          <h3 class="text-lg font-semibold mb-4">Roles & Permissions</h3>
          <div class="space-y-4">
            <div v-for="userRole in user.userRoles" :key="userRole.id">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium">{{ userRole.role.name }}</span>
                <span class="text-sm text-gray-500">{{ userRole.role.code }}</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="rp in userRole.role.rolePermissions"
                  :key="rp.permission.id"
                  class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                >
                  {{ rp.permission.name }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-900">Account created</p>
                  <p class="text-sm text-gray-500">{{ formatDateTime(user.createdAt) }}</p>
                </div>
              </div>
              <div v-if="user.emailVerified" class="flex items-start">
                <div class="flex-shrink-0">
                  <div class="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-900">Email verified</p>
                  <p class="text-sm text-gray-500">Verified account</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { getToken } = useAuth()
const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()

const userId = route.params.id as string

const loading = ref(true)
const error = ref('')
const user = ref<any>(null)

// Fetch user details
const fetchUserDetails = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user details')
    }

    const data = await response.json()
    user.value = data.data
  } catch (err: any) {
    error.value = err.message
    console.error('Error fetching user details:', err)
  } finally {
    loading.value = false
  }
}

// Actions
const suspendUser = () => {
  // TODO: Implement suspend user
  alert('Suspend user functionality coming soon')
}

const resetPassword = () => {
  // TODO: Implement reset password
  alert('Reset password functionality coming soon')
}

const viewActivity = () => {
  // TODO: Implement activity log
  alert('Activity log functionality coming soon')
}

// Helpers
const getInitials = (user: any) => {
  return `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() || 'U'
}

const getRoleBadgeClass = (role: string) => {
  const classes = {
    ADMIN: 'bg-purple-100 text-purple-800',
    SELLER: 'bg-blue-100 text-blue-800',
    CUSTOMER: 'bg-green-100 text-green-800',
    VISITOR: 'bg-gray-100 text-gray-800',
  }
  return classes[role as keyof typeof classes] || 'bg-gray-100 text-gray-800'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Initialize
onMounted(() => {
  fetchUserDetails()
})
</script>
