import api from './api'
import type { ApiResponse } from '@/types/api-response.type'
import type { AuthResponse, LoginRequest } from '@/types/auth.type'

export const authService = {
  async login(request: LoginRequest) {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', request)
    return res.data.data
  },
}
