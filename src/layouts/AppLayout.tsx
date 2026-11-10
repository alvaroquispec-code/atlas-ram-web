import { NavLink, Outlet } from 'react-router-dom'
import Button from '../components/Button'
import ErrorBoundary from '../components/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Panel' },
  { to: '/isolates', label: 'Aislamientos' },
  { to: '/users', label: 'Usuarios', adminOnly: true },
]

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth()
  // El link de Usuarios solo se muestra a administradores; la ruta además está protegida.
  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || hasRole('ADMIN'))
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-brand-700">Atlas RAM</span>
            <nav className="hidden gap-1 sm:flex">
              {visibleItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{user?.fullName}</span>
            <Button variant="ghost" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}