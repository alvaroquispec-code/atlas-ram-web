import { Navigate, Outlet } from 'react-router-dom'
import FullPageLoader from '../components/FullPageLoader'
import { useAuth } from '../hooks/useAuth'
import ThemeToggle from '../components/ThemeToggle'
import BrandMark from '../components/BrandMark'
import PetriPlate from '../components/PetriPlate'

export default function AuthLayout() {
  const { isAuthenticated, isRestoring } = useAuth()
  if (isRestoring) return <FullPageLoader label="Verificando sesión" />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <span className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <BrandMark className="h-7 w-7" />
          Atlas RAM
        </span>
        {/* Placa de antibiograma ilustrativa: discos de antibióticos de uso común con halos de distinto tamaño. */}
        <PetriPlate
          className="pointer-events-none absolute -bottom-36 -right-36 h-[32rem] w-[32rem] drop-shadow-2xl"
          label="Ilustración de una placa de antibiograma"
          disks={[
            { code: 'AMK', name: 'Amikacina', susceptible: 92 },
            { code: 'CRO', name: 'Ceftriaxona', susceptible: 55 },
            { code: 'MEM', name: 'Meropenem', susceptible: 96 },
            { code: 'CIP', name: 'Ciprofloxacino', susceptible: 38 },
            { code: 'AMP', name: 'Ampicilina', susceptible: 8 },
            { code: 'GEN', name: 'Gentamicina', susceptible: 72 },
          ]}
        />
        <div className="relative max-w-sm space-y-4">
          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            La resistencia antimicrobiana de tu zona, antes de recetar.
          </h1>
          <p className="text-brand-100">
            Antibiogramas acumulados de hospitales de Lima y Callao, interpretados con CLSI y actualizados con cada
            carga de laboratorio.
          </p>
        </div>
        <span className="relative text-xs text-brand-100">CS 2031 · UTEC</span>
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
