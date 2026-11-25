import { RotateCw, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import SiteToggle from '../components/SiteToggle'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import TrendChart from '../components/TrendChart'
import { useFetch } from '../hooks/useFetch'
import { antibiogramService } from '../services/antibiogramService'
import { catalogService, microorganismLabel } from '../services/catalogService'
import type { BreakpointSite, DataOrigin } from '../types/api'
import { ORIGIN_LABELS } from '../utils/labels'

// K. pneumoniae frente a meropenem en el Hospital Hipólito Unanue: el ejemplo de tendencia de la demo.
const DEFAULTS = {
  microorganismId: '2',
  antibioticId: '11',
  facilityId: '6',
  from: '2024-09-01',
  to: '2026-08-31',
  interval: 'MONTH',
  origin: '',
}
type FilterKey = keyof typeof DEFAULTS

const formatP = (p: number) => (p < 0.001 ? 'p < 0,001' : `p = ${p.toFixed(3).replace('.', ',')}`)

export default function TrendPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const read = (key: FilterKey) => searchParams.get(key) ?? DEFAULTS[key]
  const f = {
    microorganismId: read('microorganismId'),
    antibioticId: read('antibioticId'),
    facilityId: read('facilityId'),
    from: read('from'),
    to: read('to'),
    interval: read('interval') as 'MONTH' | 'QUARTER',
    origin: read('origin') as DataOrigin | '',
    site: (searchParams.get('site') ?? undefined) as BreakpointSite | undefined,
  }
  const update = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const catalogs = useFetch(
    (signal) =>
      Promise.all([
        catalogService.microorganisms(signal),
        catalogService.antibiotics(signal),
        catalogService.facilities(signal),
      ]),
    [],
  )
  const result = useFetch(
    (signal) =>
      antibiogramService.trend(
        {
          microorganismId: Number(f.microorganismId),
          antibioticId: Number(f.antibioticId),
          facilityId: f.facilityId === '' ? undefined : Number(f.facilityId),
          from: f.from,
          to: f.to,
          interval: f.interval,
          origin: f.origin === '' ? undefined : f.origin,
          site: f.site,
        },
        signal,
      ),
    [f.microorganismId, f.antibioticId, f.facilityId, f.from, f.to, f.interval, f.origin, f.site],
  )

  const [microorganisms, antibiotics, facilities] = catalogs.data ?? [[], [], []]
  const data = result.data
  const trend = data?.trend
  const tested = data?.points.reduce((sum, p) => sum + p.totalTested, 0) ?? 0

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Tendencia de la resistencia</h1>
        <p className="text-sm text-slate-500">
          % de resistentes por periodo (primer aislamiento por paciente en cada periodo), con la prueba de tendencia de
          Cochran-Armitage: dice si el aumento o la disminución es real o puede ser azar.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Microorganismo"
          value={f.microorganismId}
          onChange={(e) => update('microorganismId', e.target.value)}
          options={microorganisms.map((m) => ({ value: m.id, label: microorganismLabel(m) }))}
        />
        <SelectField
          label="Antibiótico"
          value={f.antibioticId}
          onChange={(e) => update('antibioticId', e.target.value)}
          options={antibiotics.map((a) => ({ value: a.id, label: `${a.name} (${a.code})` }))}
        />
        <SelectField
          label="Establecimiento"
          value={f.facilityId}
          onChange={(e) => update('facilityId', e.target.value)}
          options={[{ value: '', label: 'Toda la red' }, ...facilities.map((x) => ({ value: x.id, label: x.name }))]}
        />
        <SelectField
          label="Agrupar por"
          value={f.interval}
          onChange={(e) => update('interval', e.target.value)}
          options={[
            { value: 'MONTH', label: 'Mes' },
            { value: 'QUARTER', label: 'Trimestre' },
          ]}
        />
        <TextField label="Desde" type="date" value={f.from} onChange={(e) => update('from', e.target.value)} />
        <TextField label="Hasta" type="date" value={f.to} onChange={(e) => update('to', e.target.value)} />
        <SelectField
          label="Procedencia"
          value={f.origin}
          onChange={(e) => update('origin', e.target.value)}
          options={[
            { value: '', label: 'Todas' },
            { value: 'REAL', label: ORIGIN_LABELS.REAL },
            { value: 'SYNTHETIC', label: ORIGIN_LABELS.SYNTHETIC },
          ]}
        />
      </div>

      {data?.breakpointSite && (
        <SiteToggle
          value={data.breakpointSite}
          onChange={(site) => {
            const next = new URLSearchParams(searchParams)
            next.set('site', site)
            setSearchParams(next, { replace: true })
          }}
        />
      )}

      {result.isLoading ? (
        <div className="py-16">
          <Spinner label="Calculando tendencia" />
        </div>
      ) : result.error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={result.reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {result.error.message}
        </Alert>
      ) : data ? (
        <>
          {f.origin !== 'REAL' && (
            <Alert tone="warning">
              {f.origin === 'SYNTHETIC' ? 'Solo datos sintéticos de demostración.' : 'Incluye datos sintéticos de demostración.'}{' '}
              Con «Procedencia: reales» se calcula solo con datos de laboratorio.
            </Alert>
          )}
          {trend ? (
            <div
              className={`flex items-center gap-4 rounded-xl p-4 ring-1 ${
                trend.direction === 'INCREASING'
                  ? 'bg-red-50 text-red-800 ring-red-200'
                  : trend.direction === 'DECREASING'
                    ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                    : 'bg-white text-slate-700 ring-slate-200'
              }`}
            >
              {trend.direction === 'INCREASING' ? (
                <TrendingUp size={32} aria-hidden />
              ) : trend.direction === 'DECREASING' ? (
                <TrendingDown size={32} aria-hidden />
              ) : (
                <Minus size={32} aria-hidden />
              )}
              <div>
                <p className="text-lg font-semibold">
                  {trend.direction === 'INCREASING'
                    ? `La resistencia sube ${trend.changePerYear.toFixed(1)} puntos por año`
                    : trend.direction === 'DECREASING'
                      ? `La resistencia baja ${Math.abs(trend.changePerYear).toFixed(1)} puntos por año`
                      : 'Sin tendencia significativa'}
                </p>
                <p className="text-sm">
                  {data.microorganismName} · {data.antibioticName} · Cochran-Armitage z ={' '}
                  {trend.z.toFixed(2).replace('.', ',')}, {formatP(trend.pValue)} · {trend.periodsWithData} periodos,{' '}
                  {trend.totalTested.toLocaleString('es-PE')} aislamientos
                </p>
              </div>
            </div>
          ) : (
            <Alert tone="warning">No hay datos suficientes para la prueba de tendencia ({tested} aislamientos).</Alert>
          )}
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <TrendChart points={data.points} />
            <p className="mt-2 text-xs text-slate-500">
              Cada punto es el % de resistentes del periodo; la barra vertical es su intervalo de confianza al 95 %.
            </p>
          </div>
        </>
      ) : null}
    </section>
  )
}
