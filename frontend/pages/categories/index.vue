<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Kategoriler</h1>
    
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div v-for="cat in categories" :key="cat" class="card p-6 text-center">
        <h3 class="font-semibold">{{ cat }}</h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const categories = ['Elektronik', 'Moda', 'Ev & Yaşam', 'Spor']
</script>
