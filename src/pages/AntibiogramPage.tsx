import { RotateCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import CiBar from '../components/CiBar'
import DataOriginNotice from '../components/DataOriginNotice'
import PetriPlate from '../components/PetriPlate'
import SelectField from '../components/SelectField'
import StandardsNote from '../components/StandardsNote'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useFetch } from '../hooks/useFetch'
import { antibiogramService } from '../services/antibiogramService'
import { catalogService, microorganismLabel } from '../services/catalogService'
import type { AntibiogramEntry, DataOrigin, Ward } from '../types/api'
import { ORIGIN_LABELS, pct, WARD_OPTIONS } from '../utils/labels'

const DEFAULTS = { microorganismId: '1', from: '2025-09-01', to: '2026-08-31', origin: '', ward: '', all: 'false' }
type FilterKey = keyof typeof DEFAULTS

// Colores del %S: verde ≥ 90 %, ámbar 70–89 %, rojo < 70 %.
const toneFor = (s: number) => (s >= 90 ? 'bg-emerald-500' : s >= 70 ? 'bg-amber-400' : 'bg-red-500')
// Muestras de la leyenda con los mismos colores que CiBar.
const SWATCH = { ok: 'var(--color-ok)', mid: 'var(--color-res-1)', bad: 'var(--color-res-3)' }

export default function AntibiogramPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const read = (key: FilterKey) => searchParams.get(key) ?? DEFAULTS[key]
  const microorganismId = read('microorganismId')
  const from = read('from')
  const to = read('to')
  const origin = read('origin') as DataOrigin | ''
  const ward = read('ward') as Ward | ''
  const includeInsufficient = read('all') === 'true'

  const update = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const catalogs = useFetch((signal) => catalogService.microorganisms(signal), [])
  // Códigos de los discos (CRO, MEM…) para dibujar la placa.
  const drugs = useFetch((signal) => catalogService.antibiotics(signal), [])
  const codeOf = (id: number) => drugs.data?.find((a) => a.id === id)?.code ?? '?'
  const result = useFetch(
    (signal) =>
      antibiogramService.cumulative(
        {
          microorganismId: microorganismId === '' ? undefined : Number(microorganismId),
          from,
          to,
          includeInsufficient,
          origin: origin === '' ? undefined : origin,
          ward: ward === '' ? undefined : ward,
        },
        signal,
      ),
    [microorganismId, from, to, origin, ward, includeInsufficient],
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
        <h1 className="text-2xl font-semibold">Antibiograma acumulado <span className="font-normal text-slate-500">(mapa microbiológico)</span></h1>
        <p className="text-sm text-slate-500">
          Cada CIM se interpreta con los puntos de corte del CLSI M100 y los resultados se acumulan según el CLSI M39: solo el primer aislamiento de cada paciente y especie en el periodo,
          con su intervalo de confianza de Wilson al 95 %.
        </p>
        <StandardsNote />
      </header>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3 lg:grid-cols-6">
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
        <SelectField label="Servicio" value={ward} onChange={(e) => update('ward', e.target.value)} options={WARD_OPTIONS} />
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
            <div key={organism} className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <h2 className="border-b border-slate-200 px-4 py-3 font-semibold italic">{organism}</h2>
              <div className="grid lg:grid-cols-[17rem_1fr]">
              {/* La placa: un disco por antibiótico (hasta 8, con datos suficientes); el halo es el % de sensibles. */}
              <figure className="flex flex-col items-center gap-2 border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
                <PetriPlate
                  className="h-60 w-60"
                  disks={rows
                    .filter((e) => e.sufficientData && !e.breakpointSite)
                    .slice(0, 8)
                    .map((e) => ({ code: codeOf(e.antibioticId), name: e.antibioticName, susceptible: e.susceptiblePercentage }))}
                  label={`Placa de antibiograma de ${organism}`}
                />
                <figcaption className="text-center text-xs text-slate-500">
                  Halo más grande, más aislamientos sensibles. Sin halo: la bacteria ya resiste.
                </figcaption>
              </figure>
              <div className="overflow-x-auto">
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
                    <tr key={`${e.antibioticId}-${e.breakpointSite ?? 'ANY'}`} className={`border-t border-slate-100 ${e.sufficientData ? '' : 'opacity-50'}`}>
                      <td className="px-4 py-2">
                        {e.antibioticName}
                        {!e.sufficientData && <span className="ml-2 text-xs text-slate-500">(n &lt; 30)</span>}
                        {e.breakpointSite && (
                          <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600" title="Mismas CIM de todos los aislamientos, leídas con el punto de corte de CLSI para ese sitio de infección">
                            {e.breakpointSite === 'MENINGITIS' ? 'CLSI meníngeo' : 'CLSI no meníngeo'}
                          </span>
                        )}
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
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: SWATCH.ok }} />≥ 90 % sensibles</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: SWATCH.mid }} />70–89 %</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded" style={{ background: SWATCH.bad }} />&lt; 70 %</span>
            <span>La línea negra es el intervalo de confianza al 95 %.</span>
          </div>
        </>
      )}
    </section>
  )
}
