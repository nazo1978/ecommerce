export const useAuth = () => {
  const router = useRouter()

  const getToken = () => {
    if (process.client) {
      return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
    }
    return null
  }

  const getUser = () => {
    if (process.client) {
      const userStr = localStorage.getItem('user') || sessionStorage.getItem('user')
      return userStr ? JSON.parse(userStr) : null
    }
    return null
  }

  const isAuthenticated = computed(() => {
    return !!getToken()
  })

  const user = computed(() => {
    return getUser()
  })

  const logout = () => {
    if (process.client) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      sessionStorage.removeItem('accessToken')
      sessionStorage.removeItem('refreshToken')
      sessionStorage.removeItem('user')
      router.push('/auth/login')
    }
  }

  const login = async (email: string, password: string, remember: boolean = false) => {
    const config = useRuntimeConfig()
    
    const response = await fetch(`${config.public.apiBase}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Login failed')
    }

    if (process.client) {
      const storage = remember ? localStorage : sessionStorage
      storage.setItem('accessToken', data.data.tokens.accessToken)
      storage.setItem('refreshToken', data.data.tokens.refreshToken)
      storage.setItem('user', JSON.stringify(data.data.user))
    }

    return data.data
  }

  return {
    isAuthenticated,
    user,
    getToken,
    logout,
    login,
  }
}
