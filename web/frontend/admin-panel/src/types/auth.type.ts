export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  email: string
  username: string
  role: string
  expiresAt: string
}
