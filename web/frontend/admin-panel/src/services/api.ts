import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5181/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle auth errors globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      router.push('/login')
    }
    const message = error.response?.data?.message ?? error.message ?? 'Server error'
    return Promise.reject(new Error(message))
  },
)

export default api
