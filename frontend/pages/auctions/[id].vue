<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold">Açık Artırma Detay</h1>
    <p class="text-gray-600">ID: {{ id }}</p>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const id = route.params.id
</script>
