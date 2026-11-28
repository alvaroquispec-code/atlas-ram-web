import { LayoutGrid, Map as MapIcon, RotateCw } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import LimaMap from '../components/LimaMap'
import PetriPlate from '../components/PetriPlate'
import ResistanceGrid, { resColor } from '../components/ResistanceGrid'
import SelectField from '../components/SelectField'
import SiteToggle from '../components/SiteToggle'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { antibiogramService } from '../services/antibiogramService'
import { catalogService, microorganismLabel } from '../services/catalogService'
import type { BreakpointSite } from '../types/api'

// Valores por defecto: E. coli frente a ceftriaxona, en el periodo que cubren los datos.
const DEFAULTS = { microorganismId: '1', antibioticId: '6', from: '2024-09-01', to: '2026-08-31' }
type FilterKey = keyof typeof DEFAULTS

export default function DashboardPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  // Los filtros viven en la URL: si recargas o compartes el link, se conserva la consulta.
  const read = (key: FilterKey) => searchParams.get(key) ?? DEFAULTS[key]
  const filters = {
    microorganismId: Number(read('microorganismId')),
    antibioticId: Number(read('antibioticId')),
    from: read('from'),
    to: read('to'),
    // Solo cuenta en pares con punto de corte por sitio; el servidor usa "no meníngeo" por defecto.
    site: (searchParams.get('site') ?? undefined) as BreakpointSite | undefined,
  }

  // Vista de datos (cuadros, por defecto) o vista de mapa; también vive en la URL.
  const view = searchParams.get('view') === 'map' ? 'map' : 'data'
  const setView = (next: 'map' | 'data') => {
    const params = new URLSearchParams(searchParams)
    if (next === 'map') params.set('view', 'map')
    else params.delete('view')
    setSearchParams(params, { replace: true })
  }

  const updateFilter = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const catalogs = useFetch(
    (signal) => Promise.all([catalogService.microorganisms(signal), catalogService.antibiotics(signal)]),
    [],
  )
  const resistance = useFetch(
    (signal) => antibiogramService.byDistrict(filters, signal),
    [filters.microorganismId, filters.antibioticId, filters.from, filters.to, filters.site],
  )

  const [microorganisms, antibiotics] = catalogs.data ?? [[], []]
  const districts = resistance.data ?? []
  const siteUsed = districts.find((d) => d.breakpointSite)?.breakpointSite ?? null
  const withData = districts.filter((d) => d.sufficientData)
  const totalTested = withData.reduce((sum, d) => sum + d.totalTested, 0)
  const totalResistant = withData.reduce((sum, d) => sum + d.resistantCount, 0)
  const overall = totalTested > 0 ? (totalResistant * 100) / totalTested : null
  const worst = withData.reduce<(typeof withData)[number] | null>(
    (max, d) => (max === null || (d.resistancePercentage ?? 0) > (max.resistancePercentage ?? 0) ? d : max),
    null,
  )

  const micro = microorganisms.find((m) => m.id === filters.microorganismId)
  const drug = antibiotics.find((a) => a.id === filters.antibioticId)

  return (
    <section className="space-y-8">
      <header className="space-y-1">
        <p className="text-sm text-slate-500">Hola, {user?.fullName}</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resistencia por distrito</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Porcentaje de aislamientos resistentes en cada distrito de Lima y Callao, con el primer aislamiento por paciente
          (CLSI M39).
        </p>
      </header>

      {/* Lo que se ve aquí sale de la base de demostración; las cifras publicadas por hospitales están aparte. */}
      <p className="border-l-4 border-res-1 bg-amber-50 px-4 py-2 text-sm text-slate-700">
        <b>Datos de demostración:</b> los aislamientos de este tablero son simulados (calibrados con estudios peruanos
        publicados), no de pacientes reales. Las cifras publicadas por hospitales peruanos están en{' '}
        <Link to="/real-data" className="font-medium underline">
          Datos reales
        </Link>
        .
      </p>

      <div className="grid grid-cols-2 gap-4 border-y border-slate-200 py-4 lg:grid-cols-[1.4fr_1.4fr_1fr_1fr] [&>*:nth-child(-n+2)]:col-span-2 lg:[&>*:nth-child(-n+2)]:col-span-1">
        <SelectField
          label="Microorganismo"
          value={filters.microorganismId}
          onChange={(e) => updateFilter('microorganismId', e.target.value)}
          disabled={catalogs.isLoading}
          options={microorganisms.map((m) => ({ value: m.id, label: microorganismLabel(m) }))}
        />
        <SelectField
          label="Antibiótico"
          value={filters.antibioticId}
          onChange={(e) => updateFilter('antibioticId', e.target.value)}
          disabled={catalogs.isLoading}
          options={antibiotics.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` }))}
        />
        <TextField label="Desde" type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
        <TextField label="Hasta" type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
      </div>

      {siteUsed && (
        <SiteToggle
          value={siteUsed}
          onChange={(site) => {
            const next = new URLSearchParams(searchParams)
            next.set('site', site)
            setSearchParams(next, { replace: true })
          }}
        />
      )}

      {catalogs.error && (
        <Alert tone="error" action={<Button variant="ghost" onClick={catalogs.reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          No pudimos cargar los catálogos. {catalogs.error.message}
        </Alert>
      )}

      {resistance.isLoading ? (
        <div className="py-16">
          <Spinner label="Calculando resistencia" />
        </div>
      ) : resistance.error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={resistance.reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {resistance.error.message}
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-y-3 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-x-8 sm:gap-y-2">
            <div className="flex items-center gap-4 sm:row-span-2">
              <PetriPlate
                className="h-28 w-28 shrink-0 sm:h-36 sm:w-36"
                disks={drug && overall !== null ? [{ code: drug.code, name: drug.name, susceptible: 100 - overall }] : []}
                label={
                  overall === null
                    ? 'Sin datos suficientes'
                    : `Disco de ${drug?.name ?? 'antibiótico'}: halo proporcional al ${(100 - overall).toFixed(0)} % de aislamientos no resistentes`
                }
              />
              <div>
                <p className="text-6xl font-bold leading-none tracking-tight text-slate-900 tabular-nums sm:text-7xl">
                  {overall === null ? '—' : `${overall.toFixed(0)} %`}
                </p>
                <span className="mt-3 block h-1.5 rounded-full" style={{ background: resColor(overall) }} aria-hidden />
              </div>
            </div>
            <p className="max-w-xl text-lg leading-snug text-slate-700 sm:text-xl">
              de los aislamientos de <em className="font-semibold text-slate-900">{micro ? microorganismLabel(micro) : 'este microorganismo'}</em>{' '}
              en Lima y Callao son resistentes a{' '}
              <span className="font-semibold text-slate-900">{drug ? drug.name.toLowerCase() : 'este antibiótico'}</span>.
            </p>
            <p className="text-sm text-slate-600">
              {worst ? (
                <>
                  El distrito más alto es <b className="font-semibold text-slate-900">{worst.name}</b> ({worst.resistancePercentage?.toFixed(0)} %).{' '}
                </>
              ) : null}
              {withData.length} de {districts.length} distritos tienen al menos 30 resultados. El halo alrededor del disco
              crece con los aislamientos que todavía responden al antibiótico.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
            <h2 className="text-base font-semibold text-slate-900">Por distrito</h2>
            <div role="radiogroup" aria-label="Vista" className="inline-flex rounded-md bg-slate-100 p-0.5">
              {([
                { value: 'data', label: 'Lista', icon: LayoutGrid },
                { value: 'map', label: 'Mapa', icon: MapIcon },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={view === option.value}
                  onClick={() => setView(option.value)}
                  className={`inline-flex items-center gap-1.5 rounded px-3 py-1 text-sm transition-colors ${
                    view === option.value ? 'bg-white font-medium text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <option.icon size={14} aria-hidden />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          {withData.length === 0 && (
            <Alert tone="warning">Ningún distrito llega a 30 resultados en este periodo. Amplía el rango de fechas.</Alert>
          )}
          {view === 'map' ? <LimaMap districts={districts} /> : <ResistanceGrid districts={districts} />}
        </>
      )}
    </section>
  )
}
