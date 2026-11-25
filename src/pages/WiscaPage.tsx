import { RotateCw } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import CiBar from '../components/CiBar'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useFetch } from '../hooks/useFetch'
import { antibiogramService } from '../services/antibiogramService'
import { catalogService } from '../services/catalogService'
import type { DataOrigin, Syndrome } from '../types/api'
import { ORIGIN_LABELS, SYNDROME_LABELS } from '../utils/labels'

const DEFAULTS = { syndrome: 'BACTEREMIA', from: '2025-09-01', to: '2026-08-31', facilityId: '', target: '90', origin: '' }
type FilterKey = keyof typeof DEFAULTS

const toneFor = (coverage: number, target: number) =>
  coverage >= target ? 'bg-emerald-500' : coverage >= target - 10 ? 'bg-amber-400' : 'bg-red-500'

export default function WiscaPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const read = (key: FilterKey) => searchParams.get(key) ?? DEFAULTS[key]
  const f = {
    syndrome: read('syndrome') as Syndrome,
    from: read('from'),
    to: read('to'),
    facilityId: read('facilityId'),
    target: Number(read('target')),
    origin: read('origin') as DataOrigin | '',
  }
  const update = (key: FilterKey, value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set(key, value)
    setSearchParams(next, { replace: true })
  }

  const facilities = useFetch((signal) => catalogService.facilities(signal), [])
  const result = useFetch(
    (signal) =>
      antibiogramService.wisca(
        {
          syndrome: f.syndrome,
          from: f.from,
          to: f.to,
          facilityId: f.facilityId === '' ? undefined : Number(f.facilityId),
          target: f.target,
          origin: f.origin === '' ? undefined : f.origin,
        },
        signal,
      ),
    [f.syndrome, f.from, f.to, f.facilityId, f.target, f.origin],
  )
  const data = result.data

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Tratamiento empírico (WISCA)</h1>
        <p className="text-sm text-slate-500">
          Probabilidad de que cada régimen cubra al germen que causa el síndrome, ponderando cada germen por su
          frecuencia local. Modelo bayesiano con 10 000 simulaciones. Orienta la elección; no reemplaza el criterio
          clínico ni el cultivo del paciente.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="Síndrome"
          value={f.syndrome}
          onChange={(e) => update('syndrome', e.target.value)}
          options={(Object.keys(SYNDROME_LABELS) as Syndrome[]).map((s) => ({ value: s, label: SYNDROME_LABELS[s] }))}
        />
        <SelectField
          label="Establecimiento"
          value={f.facilityId}
          onChange={(e) => update('facilityId', e.target.value)}
          options={[{ value: '', label: 'Toda la red' }, ...(facilities.data ?? []).map((x) => ({ value: x.id, label: x.name }))]}
        />
        <SelectField
          label="Cobertura objetivo"
          value={String(f.target)}
          onChange={(e) => update('target', e.target.value)}
          options={[80, 85, 90, 95].map((t) => ({ value: t, label: `${t} %` }))}
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

      {result.isLoading ? (
        <div className="py-16">
          <Spinner label="Simulando cobertura" />
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
          {!data.sufficientData && (
            <Alert tone="warning">Solo {data.isolates} aislamientos: con menos de 30 las estimaciones son muy inciertas.</Alert>
          )}
          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <h2 className="border-b border-slate-200 px-4 py-3 font-semibold">
              {data.syndromeLabel} · {data.isolates.toLocaleString('es-PE')} primeros aislamientos
            </h2>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2">Régimen</th>
                  <th className="px-4 py-2">Cobertura (IC creíble 95 %)</th>
                  <th className="px-4 py-2 text-right">P(≥ {data.targetCoverage} %)</th>
                  <th className="px-4 py-2 text-right">P(el mejor)</th>
                </tr>
              </thead>
              <tbody>
                {data.regimens.map((r) => (
                  <tr key={r.code} className="border-t border-slate-100 align-top">
                    <td className="px-4 py-2">
                      <p className="font-medium">{r.antibioticNames.join(' + ')}</p>
                      {r.untestedPathogens.length > 0 && (
                        <p className="text-xs text-amber-700">
                          Sin pruebas para {r.untestedPathogens.join(', ')} ({r.untestedFrequency.toFixed(0)} % de los
                          casos): se cuentan como no cubiertos.
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <CiBar
                        value={r.coverageMedian}
                        low={r.credibleLow}
                        high={r.credibleHigh}
                        tone={toneFor(r.coverageMedian, data.targetCoverage)}
                      />
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{(r.probabilityAboveTarget * 100).toFixed(0)} %</td>
                    <td className="px-4 py-2 text-right tabular-nums">{(r.probabilityBest * 100).toFixed(0)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h3 className="mb-2 text-sm font-semibold">Gérmenes que causan este síndrome aquí</h3>
            <ul className="flex flex-wrap gap-2 text-sm">
              {data.pathogens.map((p) => (
                <li key={p.name} className="rounded-full bg-slate-100 px-3 py-1">
                  <span className="italic">{p.name}</span> · {p.frequency.toFixed(0)} %
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </section>
  )
}
