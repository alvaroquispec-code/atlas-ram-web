import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types/api'
import FullPageLoader from './FullPageLoader'

interface PrivateRouteProps {
  children: ReactNode
  roles?: Role[]
}

export default function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { isAuthenticated, isRestoring, hasRole } = useAuth()
  const location = useLocation()

  if (isRestoring) return <FullPageLoader label="Verificando sesión" />
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !hasRole(...roles)) return <Navigate to="/forbidden" replace />
  return <>{children}</>
} 
