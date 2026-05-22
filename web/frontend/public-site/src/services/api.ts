import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5181/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// Response interceptor: unwrap or surface error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred'
    console.error(`[API Error] ${error.config?.url}:`, message)
    return Promise.reject(new Error(message))
  },
)

export default api
