import { useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import ResistanceGrid from '../components/ResistanceGrid'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { antibiogramService } from '../services/antibiogramService'
import { catalogService, microorganismLabel } from '../services/catalogService'

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
    [filters.microorganismId, filters.antibioticId, filters.from, filters.to],
  )

  const [microorganisms, antibiotics] = catalogs.data ?? [[], []]
  const districts = resistance.data ?? []
  const withData = districts.filter((d) => d.sufficientData)
  const totalTested = withData.reduce((sum, d) => sum + d.totalTested, 0)
  const totalResistant = withData.reduce((sum, d) => sum + d.resistantCount, 0)
  const overall = totalTested > 0 ? (totalResistant * 100) / totalTested : null
  const worst = withData.reduce<(typeof withData)[number] | null>(
    (max, d) => (max === null || (d.resistancePercentage ?? 0) > (max.resistancePercentage ?? 0) ? d : max),
    null,
  )

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Resistencia por distrito</h1>
        <p className="text-sm text-slate-500">
          Hola, {user?.fullName}. Elige un microorganismo y un antibiótico para ver el porcentaje de aislamientos
          resistentes en cada distrito de Lima y Callao.
        </p>
      </header>

      <div className="grid gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
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

      {catalogs.error && (
        <Alert tone="error" action={<Button variant="ghost" onClick={catalogs.reload}>Reintentar</Button>}>
          No pudimos cargar los catálogos. {catalogs.error.message}
        </Alert>
      )}

      {resistance.isLoading ? (
        <div className="py-16">
          <Spinner label="Calculando resistencia" />
        </div>
      ) : resistance.error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={resistance.reload}>Reintentar</Button>}>
          {resistance.error.message}
        </Alert>
      ) : (
        <>
          <dl className="grid gap-4 sm:grid-cols-3">
            <Stat label="Resistencia global" value={overall === null ? '—' : `${overall.toFixed(1)} %`} />
            <Stat label="Distritos con datos suficientes" value={`${withData.length} de ${districts.length}`} />
            <Stat
              label="Distrito con más resistencia"
              value={worst ? `${worst.name} (${worst.resistancePercentage?.toFixed(0)} %)` : '—'}
            />
          </dl>
          {withData.length === 0 && (
            <Alert tone="warning">Ningún distrito llega a 30 resultados en este periodo. Amplía el rango de fechas.</Alert>
          )}
          <ResistanceGrid districts={districts} />
        </>
      )}
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 text-xl font-semibold text-slate-800">{value}</dd>
    </div>
  )
}