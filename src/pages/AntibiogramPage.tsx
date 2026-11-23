import { RotateCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import CiBar from '../components/CiBar'
import DataOriginNotice from '../components/DataOriginNotice'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useFetch } from '../hooks/useFetch'
import { antibiogramService } from '../services/antibiogramService'
import { catalogService, microorganismLabel } from '../services/catalogService'
import type { AntibiogramEntry, DataOrigin } from '../types/api'
import { ORIGIN_LABELS, pct } from '../utils/labels'

const DEFAULTS = { microorganismId: '1', from: '2025-09-01', to: '2026-08-31', origin: '', all: 'false' }
type FilterKey = keyof typeof DEFAULTS

// Colores del %S: verde ≥ 90 %, ámbar 70–89 %, rojo < 70 %.
const toneFor = (s: number) => (s >= 90 ? 'bg-emerald-500' : s >= 70 ? 'bg-amber-400' : 'bg-red-500')

export default function AntibiogramPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const read = (key: FilterKey) => searchParams.get(key) ?? DEFAULTS[key]
  const microorganismId = read('microorganismId')
  const from = read('from')
  const to = read('to')
  const origin = read('origin') as DataOrigin | ''
  const includeInsufficient = read('all') === 'true'

  const update = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const catalogs = useFetch((signal) => catalogService.microorganisms(signal), [])
  const result = useFetch(
    (signal) =>
      antibiogramService.cumulative(
        {
          microorganismId: microorganismId === '' ? undefined : Number(microorganismId),
          from,
          to,
          includeInsufficient,
          origin: origin === '' ? undefined : origin,
        },
        signal,
      ),
    [microorganismId, from, to, origin, includeInsufficient],
  )

  const entries = result.data ?? []
  const totalFirst = entries.reduce((sum, e) => sum + e.totalTested, 0)
  const totalReal = entries.reduce((sum, e) => sum + (e.realDataPercentage * e.totalTested) / 100, 0)
  const realPercentage = totalFirst > 0 ? (totalReal * 100) / totalFirst : null
  const repeats = entries.reduce((sum, e) => sum + e.repeatIsolatesExcluded, 0)

  // Agrupado por microorganismo, como un antibiograma impreso.
  const groups = entries.reduce<Record<string, AntibiogramEntry[]>>((acc, e) => {
    ;(acc[e.microorganismName] ??= []).push(e)
    return acc
  }, {})

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Antibiograma acumulado</h1>
        <p className="text-sm text-slate-500">
          Porcentaje de sensibles según CLSI M39: solo el primer aislamiento de cada paciente y especie en el periodo,
          con su intervalo de confianza de Wilson al 95 %.
        </p>
      </header>

      <div className="grid gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-5">
        <SelectField
          label="Microorganismo"
          value={microorganismId}
          onChange={(e) => update('microorganismId', e.target.value)}
          disabled={catalogs.isLoading}
          options={[
            { value: '', label: 'Todos' },
            ...(catalogs.data ?? []).map((m) => ({ value: m.id, label: microorganismLabel(m) })),
          ]}
        />
        <TextField label="Desde" type="date" value={from} onChange={(e) => update('from', e.target.value)} />
        <TextField label="Hasta" type="date" value={to} onChange={(e) => update('to', e.target.value)} />
        <SelectField
          label="Procedencia"
          value={origin}
          onChange={(e) => update('origin', e.target.value)}
          options={[
            { value: '', label: 'Todas' },
            { value: 'REAL', label: ORIGIN_LABELS.REAL },
            { value: 'SYNTHETIC', label: ORIGIN_LABELS.SYNTHETIC },
          ]}
        />
        <label className="flex items-end gap-2 pb-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={includeInsufficient}
            onChange={(e) => update('all', String(e.target.checked))}
            className="h-4 w-4"
          />
          Incluir combinaciones con menos de 30
        </label>
      </div>

      {result.isLoading ? (
        <div className="py-16">
          <Spinner label="Calculando antibiograma" />
        </div>
      ) : result.error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={result.reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {result.error.message}
        </Alert>
      ) : entries.length === 0 ? (
        <Alert tone="warning">
          No hay combinaciones con al menos 30 aislamientos{origin === 'REAL' ? ' de procedencia real' : ''} en este
          periodo. Amplía las fechas o marca «Incluir combinaciones con menos de 30».
        </Alert>
      ) : (
        <>
          <DataOriginNotice realPercentage={realPercentage} />
          {repeats > 0 && (
            <p className="text-sm text-slate-500">
              Se excluyeron {repeats.toLocaleString('es-PE')} aislamientos repetidos del mismo paciente: contarlos
              inflaría la resistencia.
            </p>
          )}
          {Object.entries(groups).map(([organism, rows]) => (
            <div key={organism} className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <h2 className="border-b border-slate-200 px-4 py-3 font-semibold italic">{organism}</h2>
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-2">Antibiótico</th>
                    <th className="px-4 py-2 text-right">n</th>
                    <th className="px-4 py-2">% sensibles (IC 95 %)</th>
                    <th className="px-4 py-2 text-right">% resistentes</th>
                    <th className="px-4 py-2 text-right">Repetidos excluidos</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((e) => (
                    <tr key={e.antibioticId} className={`border-t border-slate-100 ${e.sufficientData ? '' : 'opacity-50'}`}>
                      <td className="px-4 py-2">
                        {e.antibioticName}
                        {!e.sufficientData && <span className="ml-2 text-xs text-slate-500">(n &lt; 30)</span>}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{e.totalTested}</td>
                      <td className="px-4 py-2">
                        <CiBar
                          value={e.susceptiblePercentage}
                          low={e.susceptibleCiLow}
                          high={e.susceptibleCiHigh}
                          tone={toneFor(e.susceptiblePercentage)}
                        />
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{pct(e.resistancePercentage)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{e.repeatIsolatesExcluded}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500" />≥ 90 % sensibles</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-400" />70–89 %</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-500" />&lt; 70 %</span>
            <span>La línea negra es el intervalo de confianza al 95 %.</span>
          </div>
        </>
      )}
    </section>
  )
}
