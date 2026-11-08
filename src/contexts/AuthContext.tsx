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
  hasRole: (...roles: Role[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

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

  const login = useCallback(async (credentials: LoginCredentials) => {
    setUser(await authService.login(credentials))
  }, [])

  const register = useCallback(async (payload: RegisterData) => {
    setUser(await authService.register(payload))
  }, [])

  const hasRole = useCallback((...roles: Role[]) => !!user && roles.includes(user.role), [user])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isRestoring, login, register, logout, hasRole }),
    [user, isRestoring, login, register, logout, hasRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
