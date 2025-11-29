<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Logo & Title -->
      <div class="text-center">
        <NuxtLink to="/" class="text-4xl font-bold text-orange-500">
          E-Commerce
        </NuxtLink>
        <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
          Hesap oluşturun
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          veya
          <NuxtLink to="/auth/login" class="font-medium text-orange-500 hover:text-orange-600">
            mevcut hesabınızla giriş yapın
          </NuxtLink>
        </p>
      </div>

      <!-- Success Message -->
      <div v-if="success" class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
        <p class="text-sm">Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...</p>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        <p class="text-sm">{{ error }}</p>
      </div>

      <!-- Register Form -->
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <!-- First Name & Last Name -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">
                Ad
              </label>
              <input
                id="firstName"
                v-model="form.firstName"
                type="text"
                required
                class="input-field"
                placeholder="Ahmet"
              >
            </div>
            <div>
              <label for="lastName" class="block text-sm font-medium text-gray-700 mb-1">
                Soyad
              </label>
              <input
                id="lastName"
                v-model="form.lastName"
                type="text"
                required
                class="input-field"
                placeholder="Yılmaz"
              >
            </div>
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              E-posta adresi
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="input-field"
              placeholder="ornek@email.com"
            >
          </div>

          <!-- Password -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="input-field"
              placeholder="••••••••"
            >
            <p class="mt-1 text-xs text-gray-500">
              En az 8 karakter, büyük harf, küçük harf ve rakam içermelidir
            </p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Şifre Tekrar
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              class="input-field"
              placeholder="••••••••"
            >
          </div>
        </div>

        <!-- Terms & Conditions -->
        <div class="flex items-start">
          <input
            id="terms"
            v-model="form.acceptTerms"
            type="checkbox"
            required
            class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded mt-1"
          >
          <label for="terms" class="ml-2 block text-sm text-gray-900">
            <a href="#" class="text-orange-500 hover:text-orange-600">Kullanım Koşulları</a>'nı ve
            <a href="#" class="text-orange-500 hover:text-orange-600">Gizlilik Politikası</a>'nı kabul ediyorum
          </label>
        </div>

        <!-- Submit Button -->
        <div>
          <button
            type="submit"
            :disabled="loading"
            class="btn-primary w-full relative"
          >
            <span v-if="loading" class="flex items-center justify-center">
              <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Kayıt yapılıyor...
            </span>
            <span v-else>Hesap Oluştur</span>
          </button>
        </div>

        <!-- Social Register -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-gray-50 text-gray-500">veya</span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              class="btn-secondary flex items-center justify-center"
            >
              <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>

            <button
              type="button"
              class="btn-secondary flex items-center justify-center"
            >
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const config = useRuntimeConfig()

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleRegister = async () => {
  // Validate passwords match
  if (form.value.password !== form.value.confirmPassword) {
    error.value = 'Şifreler eşleşmiyor'
    return
  }

  // Validate password strength
  if (form.value.password.length < 8) {
    error.value = 'Şifre en az 8 karakter olmalıdır'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await fetch(`${config.public.apiBase}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: form.value.email,
        password: form.value.password,
        firstName: form.value.firstName,
        lastName: form.value.lastName,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Kayıt başarısız')
    }

    // Show success message
    success.value = true

    // Auto login and redirect
    setTimeout(() => {
      localStorage.setItem('accessToken', data.data.tokens.accessToken)
      localStorage.setItem('refreshToken', data.data.tokens.refreshToken)
      localStorage.setItem('user', JSON.stringify(data.data.user))
      router.push('/')
    }, 2000)
  } catch (err: any) {
    error.value = err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
  } finally {
    loading.value = false
  }
}
</script>
