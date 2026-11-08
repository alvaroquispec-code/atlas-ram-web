import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { AuthResponse } from '../types/api'
import { toApiError } from '../utils/apiError'
import { tokenStorage } from './tokenStorage'

const baseURL = import.meta.env.VITE_API_URL

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh']

let onSessionExpired: () => void = () => {}
export const setSessionExpiredHandler = (handler: () => void) => {
  onSessionExpired = handler
}

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) throw new Error('Sin refresh token')
  const { data } = await axios.post<AuthResponse>(`${baseURL}/auth/refresh`, { refreshToken })
  tokenStorage.setAccessToken(data.accessToken)
  tokenStorage.setRefreshToken(data.refreshToken)
  return data.accessToken
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthCall = AUTH_PATHS.some((path) => original?.url?.startsWith(path))

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        refreshPromise ??= refreshAccessToken().finally(() => {
          refreshPromise = null
        })
        const newToken = await refreshPromise
        original.headers.Authorization = `Bearer ${newToken}`
        return apiClient(original)
      } catch {
        tokenStorage.clear()
        onSessionExpired()
      }
    }
    return Promise.reject(toApiError(error))
  },
)
