import {
  BadgeCheck,
  BellRing,
  Boxes,
  FlaskConical,
  LogOut,
  Map as MapIcon,
  Menu,
  Pill,
  Ruler,
  Stethoscope,
  Table2,
  TrendingUp,
  Upload,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import ErrorBoundary from '../components/ErrorBoundary'
import ThemeToggle from '../components/ThemeToggle'
import VerifyEmailGate from '../components/VerifyEmailGate'
import { useAuth } from '../hooks/useAuth'
import type { Role } from '../types/api'

type NavItem = { to: string; label: string; icon: typeof MapIcon; roles?: Role[] }

/** Menú agrupado por para qué sirve cada pantalla; cada grupo solo muestra lo que el rol puede abrir. */
const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Vigilancia',
    items: [
      { to: '/dashboard', label: 'Mapa de resistencia', icon: MapIcon },
      { to: '/antibiogram', label: 'Antibiograma', icon: Table2 },
      { to: '/trend', label: 'Tendencia', icon: TrendingUp },
      { to: '/wisca', label: 'Tratamiento empírico', icon: Stethoscope },
      { to: '/real-data', label: 'Datos reales publicados', icon: BadgeCheck },
    ],
  },
  {
    label: 'Hospital',
    items: [
      { to: '/alerts', label: 'Alertas', icon: BellRing, roles: ['ADMIN', 'EPIDEMIOLOGIST'] },
      { to: '/inventory', label: 'Inventario', icon: Boxes, roles: ['ADMIN', 'PHARMACIST', 'EPIDEMIOLOGIST'] },
      { to: '/isolates', label: 'Aislamientos', icon: FlaskConical, roles: ['ADMIN', 'LAB_TECHNICIAN', 'EPIDEMIOLOGIST'] },
      { to: '/uploads', label: 'Cargar resultados', icon: Upload, roles: ['ADMIN', 'LAB_TECHNICIAN'] },
    ],
  },
  {
    label: 'Administración',
    items: [
      { to: '/users', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
      { to: '/antibiotics', label: 'Antibióticos', icon: Pill, roles: ['ADMIN'] },
      { to: '/breakpoints', label: 'Puntos de corte', icon: Ruler, roles: ['ADMIN'] },
    ],
  },
]

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administración',
  LAB_TECHNICIAN: 'Laboratorio',
  EPIDEMIOLOGIST: 'Epidemiología',
  PUBLIC_VIEWER: 'Consulta pública',
  PHARMACIST: 'Farmacia',
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-500 ${
    isActive
      ? 'bg-brand-50 font-semibold text-brand-700 shadow-[inset_2px_0_0_var(--color-brand-600)]'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
  }`

export default function AppLayout() {
  const { user, logout, hasRole } = useAuth()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // En el celular el menú se cierra al cambiar de pantalla.
  useEffect(() => setOpen(false), [location.pathname])

  // Cuenta sin correo confirmado: no ve secciones ni datos, solo la puerta de verificación.
  const unverified = user?.emailVerified === false

  const groups = (unverified ? [] : NAV_GROUPS).map((g) => ({
    ...g,
    items: g.items.filter((item) => !item.roles || hasRole(...item.roles)),
  })).filter((g) => g.items.length > 0)

  const sidebar = (
    <nav aria-label="Secciones" className="flex h-full flex-col gap-6 px-3 py-5">
      <NavLink to="/dashboard" className="flex items-center gap-2 px-2.5 text-[15px] font-bold tracking-tight text-slate-900">
        <BrandMark className="h-6 w-6" />
        Atlas RAM
      </NavLink>
      <div className="flex-1 space-y-5 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label} className="space-y-0.5">
            <p className="px-2.5 pb-1 text-xs font-medium text-slate-500">{g.label}</p>
            {g.items.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass}>
                <item.icon size={16} strokeWidth={1.75} aria-hidden />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </div>
      <div className="space-y-1 border-t border-slate-200 pt-4">
        <NavLink to="/account" className={linkClass} title="Mi cuenta: correo, contraseña y sesiones">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-semibold text-white">
            {(user?.fullName ?? '?').trim().charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate">{user?.fullName}</span>
            <span className="block text-xs font-normal text-slate-500">{user ? ROLE_LABELS[user.role] : ''}</span>
          </span>
        </NavLink>
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-brand-500"
          >
            <LogOut size={16} strokeWidth={1.75} aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* Escritorio: barra lateral fija */}
      <aside className="sticky top-0 hidden h-screen border-r border-slate-200 bg-white lg:block">{sidebar}</aside>

      {/* Celular y tablet: barra superior con menú desplegable */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <span className="flex items-center gap-2 font-bold tracking-tight text-slate-900">
          <BrandMark className="h-6 w-6" />
          Atlas RAM
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="rounded-md p-2 text-slate-700 hover:bg-slate-100"
        >
          <Menu size={20} aria-hidden />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <button type="button" aria-label="Cerrar menú" className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-4 rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
            >
              <X size={18} aria-hidden />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <main className="min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">
          <ErrorBoundary>{unverified ? <VerifyEmailGate /> : <Outlet />}</ErrorBoundary>
        </div>
      </main>
    </div>
  )
}
