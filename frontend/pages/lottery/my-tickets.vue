<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="container mx-auto px-4 max-w-6xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Piyango Biletlerim</h1>

      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>

      <div v-else-if="tickets.length" class="space-y-6">
        <div v-for="group in groupedTickets" :key="group.lotteryId" class="bg-white rounded-lg shadow overflow-hidden">
          <div class="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h2 class="text-xl font-bold">{{ group.lotteryTitle }}</h2>
            <p class="text-sm opacity-90">Çekiliş: {{ formatDate(group.drawDate) }}</p>
          </div>
          <div class="p-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div v-for="ticket in group.tickets" :key="ticket.id" :class="[
              'border-2 rounded-lg p-4 text-center',
              ticket.isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'
            ]">
              <p class="text-xs text-gray-500">Bilet No</p>
              <p class="text-2xl font-bold text-indigo-600">{{ ticket.ticketNumber }}</p>
              <p v-if="ticket.isWinner" class="text-xs text-green-600 font-semibold mt-2">
                🏆 ₺{{ ticket.prizeAmount?.toFixed(2) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <p class="text-gray-500">Henüz bilet almadınız</p>
        <NuxtLink to="/lottery" class="inline-block mt-4 text-indigo-600 hover:text-indigo-800">
          Piyangolara Göz Atın
        </NuxtLink>
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
const tickets = ref<any[]>([])

const getToken = () => {
  if (process.client) return localStorage.getItem('accessToken')
  return null
}

const fetchMyTickets = async () => {
  loading.value = true
  try {
    const token = getToken()
    if (!token) {
      router.push('/auth/login')
      return
    }

    const response = await fetch(`${config.public.apiBase}/api/v1/lottery/my-tickets`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (response.ok) {
      const data = await response.json()
      tickets.value = data.data || []
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    loading.value = false
  }
}

const groupedTickets = computed(() => {
  const groups: any = {}
  tickets.value.forEach(ticket => {
    const lotteryId = ticket.lottery.id
    if (!groups[lotteryId]) {
      groups[lotteryId] = {
        lotteryId,
        lotteryTitle: ticket.lottery.title,
        drawDate: ticket.lottery.drawDate,
        tickets: []
      }
    }
    groups[lotteryId].tickets.push(ticket)
  })
  return Object.values(groups)
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

onMounted(() => {
  fetchMyTickets()
})
</script>
