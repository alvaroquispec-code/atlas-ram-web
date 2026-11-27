import type { AuthResponse, ProfessionalRequest, User } from '../types/api'
import { apiClient } from './apiClient'
import { tokenStorage } from './tokenStorage'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData extends LoginCredentials {
  fullName: string
  /** Aceptación de la política de datos personales (obligatoria). */
  acceptedDataPolicy: boolean
  /** Solo si es profesional de la salud: crea una solicitud de acceso. */
  professional?: ProfessionalRequest
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

  /** Cambia la contraseña; el servidor cierra las demás sesiones y devuelve tokens nuevos para esta. */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const { data } = await apiClient.put<AuthResponse>('/auth/me/password', { currentPassword, newPassword })
    storeTokens(data)
  },

  /** Invalida todos los tokens del usuario en el servidor, incluido el de esta pestaña. */
  async logoutAll(): Promise<void> {
    try {
      await apiClient.post('/auth/me/logout-all')
    } finally {
      tokenStorage.clear()
    }
  },

  logout() {
    tokenStorage.clear()
  },
}
