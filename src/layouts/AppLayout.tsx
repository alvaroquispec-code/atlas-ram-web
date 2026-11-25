import { BellRing, Boxes, FlaskConical, LayoutDashboard, LogOut, Pill, Stethoscope, Table2, TrendingUp, Upload, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import Button from '../components/Button'
import ThemeToggle from '../components/ThemeToggle'
import ErrorBoundary from '../components/ErrorBoundary'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types/api'

const NAV_ITEMS: { to: string; label: string; icon: typeof LayoutDashboard; roles?: Role[] }[] = [
  { to: '/dashboard', label: 'Mapa', icon: LayoutDashboard },
  { to: '/antibiogram', label: 'Antibiograma', icon: Table2 },
  { to: '/trend', label: 'Tendencia', icon: TrendingUp },
  { to: '/wisca', label: 'Tratamiento', icon: Stethoscope },
  { to: '/alerts', label: 'Alertas', icon: BellRing, roles: ['ADMIN', 'EPIDEMIOLOGIST'] },
  { to: '/inventory', label: 'Inventario', icon: Boxes, roles: ['ADMIN', 'PHARMACIST', 'EPIDEMIOLOGIST'] },
  { to: '/isolates', label: 'Aislamientos', icon: FlaskConical, roles: ['ADMIN', 'LAB_TECHNICIAN', 'EPIDEMIOLOGIST'] },
  { to: '/uploads', label: 'Cargar', icon: Upload, roles: ['ADMIN', 'LAB_TECHNICIAN'] },
  { to: '/antibiotics', label: 'Antibióticos', icon: Pill, roles: ['ADMIN'] },
  { to: '/users', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth()
  // Cada link se muestra solo a los roles que pueden usarlo; las rutas además están protegidas.
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || hasRole(...item.roles))
  const links = visibleItems.map((item) => (
    <NavLink key={item.to} to={item.to} className={linkClass}>
      <item.icon size={16} aria-hidden />
      {item.label}
    </NavLink>
  ))
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="shrink-0 whitespace-nowrap font-semibold text-brand-700">Atlas RAM</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <span className="hidden whitespace-nowrap text-sm text-slate-600 sm:inline">{user?.fullName}</span>
            <Button variant="ghost" onClick={logout} className="whitespace-nowrap" aria-label="Cerrar sesión" title="Cerrar sesión">
              <LogOut size={16} aria-hidden />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </Button>
          </div>
        </div>
        {/* Menú en su propia fila: con 10 secciones (admin) no entra junto al logo; en pantallas angostas se desliza */}
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2">{links}</nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  )
}
