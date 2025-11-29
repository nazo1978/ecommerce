<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-4xl">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Bildirimler</h1>
        <button 
          v-if="unreadCount > 0"
          @click="markAllAsRead"
          class="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
        >
          Tümünü Okundu İşaretle
        </button>
      </div>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else-if="notifications.length" class="space-y-2">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="[
            'bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer',
            !notification.isRead && 'border-l-4 border-indigo-600'
          ]"
          @click="markAsRead(notification.id)"
        >
          <div class="flex gap-4">
            <div :class="[
              'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
              getNotificationColor(notification.type)
            ]">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getNotificationIcon(notification.type)"></path>
              </svg>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start mb-2">
                <h3 class="font-semibold text-gray-900">{{ notification.title }}</h3>
                <span class="text-xs text-gray-500">{{ formatDate(notification.createdAt) }}</span>
              </div>
              <p class="text-gray-700 text-sm">{{ notification.body }}</p>
              <button 
                @click.stop="deleteNotification(notification.id)"
                class="text-red-600 hover:text-red-800 text-xs mt-2"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
        </svg>
        <p class="text-gray-500">Bildirim bulunmuyor</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const config = useRuntimeConfig()
const loading = ref(true)
const notifications = ref<any[]>([])

const getToken = () => {
  if (process.client) return localStorage.getItem('accessToken')
  return null
}

const fetchNotifications = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.ok) {
      const data = await response.json()
      notifications.value = data.data || []
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const markAsRead = async (id: string) => {
  try {
    const token = getToken()
    await fetch(`${config.public.apiBase}/api/v1/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    await fetchNotifications()
  } catch (error) {
    console.error('Error:', error)
  }
}

const markAllAsRead = async () => {
  try {
    const token = getToken()
    await fetch(`${config.public.apiBase}/api/v1/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    await fetchNotifications()
  } catch (error) {
    console.error('Error:', error)
  }
}

const deleteNotification = async (id: string) => {
  if (!confirm('Bu bildirimi silmek istediğinize emin misiniz?')) return

  try {
    const token = getToken()
    await fetch(`${config.public.apiBase}/api/v1/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    })
    await fetchNotifications()
  } catch (error) {
    console.error('Error:', error)
  }
}

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.isRead).length
})

const getNotificationColor = (type: string) => {
  const colors: Record<string, string> = {
    'ORDER': 'bg-blue-100 text-blue-600',
    'PAYMENT': 'bg-green-100 text-green-600',
    'AUCTION': 'bg-purple-100 text-purple-600',
    'LOTTERY': 'bg-pink-100 text-pink-600',
    'SYSTEM': 'bg-gray-100 text-gray-600',
  }
  return colors[type] || 'bg-gray-100 text-gray-600'
}

const getNotificationIcon = (type: string) => {
  const icons: Record<string, string> = {
    'ORDER': 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    'PAYMENT': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    'AUCTION': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    'LOTTERY': 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
    'SYSTEM': 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  }
  return icons[type] || icons['SYSTEM']
}

const formatDate = (date: string) => {
  const now = new Date()
  const notifDate = new Date(date)
  const diff = now.getTime() - notifDate.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'Şimdi'
  if (minutes < 60) return `${minutes}dk önce`
  if (hours < 24) return `${hours}sa önce`
  if (days < 7) return `${days}g önce`
  
  return notifDate.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
  })
}

onMounted(() => {
  fetchNotifications()
})
</script>
