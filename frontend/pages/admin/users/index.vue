<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold">User Management</h1>
        <p class="text-gray-600 mt-1">Manage all users, roles, and permissions</p>
      </div>
      <button @click="handleLogout" class="btn-secondary">
        Logout
      </button>
    </div>

    <!-- Filters -->
    <div class="card p-6 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Email, name..."
            class="input"
            @input="debouncedSearch"
          >
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
          <select v-model="filters.role" class="input" @change="fetchUsers">
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SELLER">Seller</option>
            <option value="CUSTOMER">Customer</option>
            <option value="VISITOR">Visitor</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select v-model="filters.verified" class="input" @change="fetchUsers">
            <option value="">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
        <div class="flex items-end">
          <button @click="resetFilters" class="btn-secondary w-full">
            Reset Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p class="text-gray-600">Loading users...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
      <p class="text-sm">{{ error }}</p>
    </div>

    <!-- Users Table -->
    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in users" :key="user.id" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                      <span class="text-sm font-medium">{{ getInitials(user) }}</span>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ user.firstName }} {{ user.lastName }}</div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getRoleBadgeClass(user.primaryRole)" class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ user.primaryRole }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="user.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ user.emailVerified ? 'Verified' : 'Unverified' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div class="flex gap-4">
                  <span>{{ user._count.orders }} orders</span>
                  <span v-if="user.primaryRole === 'SELLER'">{{ user._count.products }} products</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2">
                  <button @click="viewUser(user.id)" class="text-orange-600 hover:text-orange-900" title="View Details">
                    View
                  </button>
                  <button @click="editUser(user)" class="text-blue-600 hover:text-blue-900" title="Edit User">
                    Edit
                  </button>
                  <button 
                    v-if="user.primaryRole === 'SELLER' && !user.emailVerified" 
                    @click="approveSeller(user)" 
                    class="text-green-600 hover:text-green-900"
                    title="Approve Seller"
                  >
                    Approve
                  </button>
                  <button 
                    v-if="user.primaryRole === 'SELLER' && user.emailVerified" 
                    @click="rejectSeller(user)" 
                    class="text-yellow-600 hover:text-yellow-900"
                    title="Revoke Approval"
                  >
                    Revoke
                  </button>
                  <button 
                    @click="deleteUser(user)" 
                    class="text-red-600 hover:text-red-900"
                    title="Delete User"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button @click="prevPage" :disabled="currentPage === 1" class="btn-secondary">Previous</button>
          <button @click="nextPage" :disabled="currentPage === totalPages" class="btn-secondary">Next</button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Showing <span class="font-medium">{{ (currentPage - 1) * pageSize + 1 }}</span> to 
              <span class="font-medium">{{ Math.min(currentPage * pageSize, totalUsers) }}</span> of 
              <span class="font-medium">{{ totalUsers }}</span> results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button @click="prevPage" :disabled="currentPage === 1" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Previous
              </button>
              <button
                v-for="page in visiblePages"
                :key="page"
                @click="goToPage(page)"
                :class="page === currentPage ? 'z-10 bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'"
                class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                {{ page }}
              </button>
              <button @click="nextPage" :disabled="currentPage === totalPages" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Modal -->
    <div v-if="editingUser" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click.self="closeEditModal">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mb-4">
          <h3 class="text-lg font-medium text-gray-900">Edit User</h3>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input v-model="editingUser.email" type="email" class="input" disabled>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
            <input v-model="editingUser.firstName" type="text" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
            <input v-model="editingUser.lastName" type="text" class="input">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select v-model="editingUser.primaryRole" class="input">
              <option value="ADMIN">Admin</option>
              <option value="SELLER">Seller</option>
              <option value="CUSTOMER">Customer</option>
              <option value="VISITOR">Visitor</option>
            </select>
          </div>
          <div class="flex items-center">
            <input v-model="editingUser.emailVerified" type="checkbox" id="verified" class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded">
            <label for="verified" class="ml-2 block text-sm text-gray-900">Email Verified</label>
          </div>
        </div>
        <div class="mt-6 flex gap-3">
          <button @click="saveUser" :disabled="saving" class="btn-primary flex-1">
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <button @click="closeEditModal" class="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="deletingUser" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click.self="closeDeleteModal">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div class="mb-4">
          <h3 class="text-lg font-medium text-gray-900">Confirm Delete</h3>
        </div>
        <div class="mb-4">
          <p class="text-sm text-gray-600">
            Are you sure you want to delete user <strong>{{ deletingUser.email }}</strong>?
          </p>
          <p class="text-sm text-red-600 mt-2">
            This action cannot be undone.
          </p>
        </div>
        <div class="flex gap-3">
          <button @click="confirmDelete" :disabled="deleting" class="btn-primary bg-red-600 hover:bg-red-700 flex-1">
            {{ deleting ? 'Deleting...' : 'Delete' }}
          </button>
          <button @click="closeDeleteModal" class="btn-secondary flex-1">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { logout, getToken } = useAuth()
const router = useRouter()
const config = useRuntimeConfig()

const handleLogout = () => {
  logout()
  router.push('/auth/login')
}

// State
const loading = ref(true)
const error = ref('')
const users = ref([])
const currentPage = ref(1)
const pageSize = ref(10)
const totalUsers = ref(0)
const totalPages = ref(0)
const saving = ref(false)
const editingUser = ref(null)
const deletingUser = ref(null)
const deleting = ref(false)

const filters = ref({
  search: '',
  role: '',
  verified: ''
})

// Fetch users
const fetchUsers = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const params = new URLSearchParams({
      page: currentPage.value.toString(),
      limit: pageSize.value.toString()
    })

    if (filters.value.search) params.append('q', filters.value.search)
    if (filters.value.role) params.append('role', filters.value.role)
    if (filters.value.verified) params.append('emailVerified', filters.value.verified)

    const response = await fetch(`${config.public.apiBase}/api/v1/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        router.push('/auth/login')
        return
      }
      throw new Error('Failed to fetch users')
    }

    const data = await response.json()
    users.value = data.data?.data || []
    totalUsers.value = data.data?.meta?.total || 0
    totalPages.value = data.data?.meta?.totalPages || 1
  } catch (err: any) {
    error.value = err.message
    console.error('Error fetching users:', err)
  } finally {
    loading.value = false
  }
}

// Debounced search
let searchTimeout: NodeJS.Timeout
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchUsers()
  }, 500)
}

// Pagination
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchUsers()
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    fetchUsers()
  }
}

const goToPage = (page: number) => {
  currentPage.value = page
  fetchUsers()
}

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  return pages
})

// Reset filters
const resetFilters = () => {
  filters.value = {
    search: '',
    role: '',
    verified: ''
  }
  currentPage.value = 1
  fetchUsers()
}

// User actions
const viewUser = (userId: string) => {
  router.push(`/admin/users/${userId}`)
}

const editUser = (user: any) => {
  editingUser.value = { ...user }
}

const closeEditModal = () => {
  editingUser.value = null
}

const saveUser = async () => {
  if (!editingUser.value) return
  
  saving.value = true
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/admin/users/${editingUser.value.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: editingUser.value.firstName,
        lastName: editingUser.value.lastName,
        primaryRole: editingUser.value.primaryRole,
        emailVerified: editingUser.value.emailVerified,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update user')
    }

    await fetchUsers()
    closeEditModal()
  } catch (err: any) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}

// Delete user
const deleteUser = (user: any) => {
  deletingUser.value = { ...user }
}

const closeDeleteModal = () => {
  deletingUser.value = null
}

const confirmDelete = async () => {
  if (!deletingUser.value) return
  
  deleting.value = true
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/admin/users/${deletingUser.value.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error('Failed to delete user')
    }

    await fetchUsers()
    closeDeleteModal()
  } catch (err: any) {
    error.value = err.message
  } finally {
    deleting.value = false
  }
}

// Approve/Reject seller
const approveSeller = async (user: any) => {
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/admin/sellers/${user.id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approved: true,
        reason: 'Approved by admin',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to approve seller')
    }

    await fetchUsers()
  } catch (err: any) {
    error.value = err.message
  }
}

const rejectSeller = async (user: any) => {
  try {
    const token = getToken()
    const response = await fetch(`${config.public.apiBase}/api/v1/admin/sellers/${user.id}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        approved: false,
        reason: 'Revoked by admin',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to revoke seller approval')
    }

    await fetchUsers()
  } catch (err: any) {
    error.value = err.message
  }
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

// Initialize
onMounted(() => {
  fetchUsers()
})
</script>
