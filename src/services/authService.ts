import type { AuthResponse, User } from '../types/api'
import { apiClient } from './apiClient'
import { tokenStorage } from './tokenStorage'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  fullName: string
}

function storeTokens(auth: AuthResponse) {
  tokenStorage.setAccessToken(auth.accessToken)
  tokenStorage.setRefreshToken(auth.refreshToken)
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<User> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials)
    storeTokens(data)
    return authService.me()
  },

  async register(payload: RegisterData): Promise<User> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload)
    storeTokens(data)
    return authService.me()
  },

  async restoreSession(): Promise<User | null> {
    const refreshToken = tokenStorage.getRefreshToken()
    if (!refreshToken) return null
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken })
    storeTokens(data)
    return authService.me()
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<User>('/auth/me')
    return data
  },

  logout() {
    tokenStorage.clear()
  },
}
