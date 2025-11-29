// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
  ],

  experimental: {
    appManifest: false,
  },

  css: [
    '~/assets/css/main.css',
  ],

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3000',
    }
  },

  app: {
    head: {
      title: 'E-Commerce - Online Alışveriş',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'En iyi ürünleri en uygun fiyatlarla keşfedin. Açık artırma ve çekiliş fırsatları!' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress app-manifest warnings
          if (warning.message.includes('#app-manifest')) return
          warn(warning)
        },
      },
    },
  },

  nitro: {
    devProxy: {
      '/api': {
        target: 'http://localhost:3000/api',
        changeOrigin: true
      }
    }
  }
})
