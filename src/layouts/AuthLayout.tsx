import { Navigate, Outlet } from 'react-router-dom'
import FullPageLoader from '../components/FullPageLoader'
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from '../components/ThemeToggle'

export default function AuthLayout() {
  const { isAuthenticated, isRestoring } = useAuth()
  if (isRestoring) return <FullPageLoader label="Verificando sesión" />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-brand-700 p-12 text-white lg:flex">
        <span className="text-lg font-semibold tracking-tight">Atlas RAM</span>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold leading-tight">
            La resistencia antimicrobiana de tu zona, antes de recetar.
          </h1>
          <p className="max-w-md text-brand-100">
            Antibiogramas acumulados de hospitales de Lima y Callao, interpretados con CLSI y
            actualizados con cada carga de laboratorio.
          </p>
        </div>
        <span className="text-xs text-brand-100">CS 2031 · UTEC</span>
      </aside>
      <main className="relative flex items-center justify-center p-6">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
