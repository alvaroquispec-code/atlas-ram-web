import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { setSessionExpiredHandler } from '../services/apiClient'
import { authService, type LoginCredentials, type RegisterData } from '../services/authService'
import type { Role, User } from '../types/api'

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isRestoring: boolean
  login: (credentials: LoginCredentials) => Promise<void>
  register: (payload: RegisterData) => Promise<void>
  logout: () => void
  logoutEverywhere: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  hasRole: (...roles: Role[]) => boolean
  /** Vuelve a leer /auth/me (p. ej. después de verificar el correo o recibir un rol). */
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

// Cada cuánto se verifica que la sesión siga vigente mientras la pestaña está visible. Si se cerró desde
// otro dispositivo (o se cambió la contraseña), /auth/me responde 401, el refresh falla y se vuelve al login.
const SESSION_CHECK_MS = 30_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isRestoring, setIsRestoring] = useState(true)
  const navigate = useNavigate()

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
    navigate('/login', { replace: true })
  }, [navigate])

  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null)
      navigate('/login', { replace: true, state: { sessionExpired: true } })
    })
  }, [navigate])

  useEffect(() => {
    authService
      .restoreSession()
      .then(setUser)
      .catch(() => authService.logout())
      .finally(() => setIsRestoring(false))
  }, [])

  // Verificación de sesión: al volver a la pestaña y cada 30 s mientras está visible.
  const isLoggedIn = !!user
  useEffect(() => {
    if (!isLoggedIn) return
    const check = () => {
      if (document.visibilityState === 'visible') authService.me().catch(() => {})
    }
    const timer = window.setInterval(check, SESSION_CHECK_MS)
    document.addEventListener('visibilitychange', check)
    window.addEventListener('focus', check)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', check)
      window.removeEventListener('focus', check)
    }
  }, [isLoggedIn])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setUser(await authService.login(credentials))
  }, [])

  const register = useCallback(async (payload: RegisterData) => {
    setUser(await authService.register(payload))
  }, [])

  const logoutEverywhere = useCallback(async () => {
    try {
      await authService.logoutAll()
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }, [navigate])

  const changePassword = useCallback(
    (currentPassword: string, newPassword: string) => authService.changePassword(currentPassword, newPassword),
    [],
  )

  const refreshUser = useCallback(async () => {
    setUser(await authService.me())
  }, [])

  const hasRole = useCallback((...roles: Role[]) => !!user && roles.includes(user.role), [user])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      isRestoring,
      login,
      register,
      logout,
      logoutEverywhere,
      changePassword,
      hasRole,
      refreshUser,
    }),
    [user, isRestoring, login, register, logout, logoutEverywhere, changePassword, hasRole, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
