import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/auth.service'
import type { AuthResponse, LoginRequest } from '@/types/auth.type'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('auth_token'))
  const user = ref<Omit<AuthResponse, 'token'> | null>(
    JSON.parse(localStorage.getItem('auth_user') ?? 'null'),
  )

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'Admin')

  async function login(request: LoginRequest) {
    const data = await authService.login(request)
    token.value = data.token
    user.value = { email: data.email, username: data.username, role: data.role, expiresAt: data.expiresAt }
    localStorage.setItem('auth_token', data.token)
    localStorage.setItem('auth_user', JSON.stringify(user.value))
    router.push('/dashboard')
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    router.push('/login')
  }

  return { token, user, isAuthenticated, isAdmin, login, logout }
})
