import { AlertTriangle, RotateCw } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { logisticsService } from '../services/logisticsService'
import { uploadService } from '../services/uploadService'
import type { AwareCategory, StockItemStatus, StockState } from '../types/api'
import { formatDate } from '../utils/labels'

const STATE_TONES: Record<StockState, string> = {
  STOCKOUT: 'bg-red-600 text-white',
  UNDERSTOCK: 'bg-orange-100 text-orange-800',
  NORMAL_STOCK: 'bg-emerald-100 text-emerald-800',
  OVERSTOCK: 'bg-sky-100 text-sky-800',
  NO_ROTATION: 'bg-slate-200 text-slate-700',
  NO_MOVEMENT: 'bg-slate-100 text-slate-500',
}
const STATE_ORDER: StockState[] = ['STOCKOUT', 'UNDERSTOCK', 'NORMAL_STOCK', 'OVERSTOCK', 'NO_ROTATION', 'NO_MOVEMENT']
const STATE_LABELS: Record<StockState, string> = {
  STOCKOUT: 'Desabastecido',
  UNDERSTOCK: 'Substock',
  NORMAL_STOCK: 'Normostock',
  OVERSTOCK: 'Sobrestock',
  NO_ROTATION: 'Sin rotación',
  NO_MOVEMENT: 'Sin movimiento',
}
const AWARE_TONES: Record<AwareCategory, string> = {
  ACCESS: 'bg-emerald-100 text-emerald-800',
  WATCH: 'bg-amber-100 text-amber-800',
  RESERVE: 'bg-red-100 text-red-800',
  NOT_RECOMMENDED: 'bg-slate-200 text-slate-700',
}
const METHOD_LABELS: Record<string, string> = { SES: 'SES', SBA: 'SBA (intermitente)', TSB: 'TSB (se apaga)', NONE: '—' }

const soles = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : `S/ ${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// Urgencia: primero lo que falta o está bajo presión de brote; al final lo que sobra.
const urgency = (i: StockItemStatus) =>
  (i.outbreakPressure ? 0 : 10) + STATE_ORDER.indexOf(i.sismedState)

export default function InventoryPage() {
  const facilities = useFetch((signal) => uploadService.myFacilities(signal), [])
  const [facilityId, setFacilityId] = useState('')
  const selected = facilityId || String(facilities.data?.find((f) => f.code === 'HNHU')?.id ?? facilities.data?.[0]?.id ?? '')

  const report = useFetch(
    (signal) => (selected ? logisticsService.stock(Number(selected), signal) : Promise.resolve(null)),
    [selected],
  )
  const ddd = useFetch(
    (signal) => (selected ? logisticsService.ddd(Number(selected), '2026-05-01', '2026-10-31', signal) : Promise.resolve(null)),
    [selected],
  )

  const data = report.data
  const items = [...(data?.items ?? [])].sort((a, b) => urgency(a) - urgency(b))

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Inventario de antibióticos</h1>
        <p className="text-sm text-slate-500">
          Disponibilidad con los indicadores del SISMED, pedido sugerido por una política (R, S) con stock de seguridad
          por bootstrap (nunca menor al 10 % del consumo esperado), unidades que vencerán sin usarse y presión de brote: alertas activas que harán subir el consumo
          de un fármaco que todavía funciona.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <SelectField
          label="Establecimiento"
          value={selected}
          onChange={(e) => setFacilityId(e.target.value)}
          disabled={facilities.isLoading}
          options={(facilities.data ?? []).map((f) => ({ value: f.id, label: f.name }))}
        />
        {data && <p className="pb-2 text-sm text-slate-500">Al {formatDate(data.asOf)} · {data.itemCount} ítems</p>}
      </div>

      {report.isLoading ? (
        <div className="py-16">
          <Spinner label="Calculando inventario" />
        </div>
      ) : report.error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={report.reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {report.error.message}
        </Alert>
      ) : data && data.itemCount === 0 ? (
        <Alert tone="info">Este establecimiento aún no registra ítems de inventario.</Alert>
      ) : data ? (
        <>
          <Alert tone="warning">Inventario sintético de demostración: consumos, costos y camas son ilustrativos.</Alert>

          <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Ítems por pedir" value={`${data.itemsToOrder}`} hint={soles(data.suggestedOrderValue)} />
            <Stat label="Unidades que vencerán sin usarse" value={soles(data.valueAtRiskOfExpiry)} hint={`${data.itemsWithExpiryRisk} ítems`} />
            <Stat label="Bajo presión de brote" value={`${data.itemsUnderOutbreakPressure}`} hint={`${data.activeAlerts} alerta(s) activa(s)`} danger={data.itemsUnderOutbreakPressure > 0} />
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <dt className="text-sm text-slate-500">Estado SISMED</dt>
              <dd className="mt-2 flex flex-wrap gap-1">
                {STATE_ORDER.filter((s) => data.itemsBySismedState[s] > 0).map((s) => (
                  <span key={s} className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_TONES[s]}`}>
                    {STATE_LABELS[s]} {data.itemsBySismedState[s]}
                  </span>
                ))}
              </dd>
            </div>
          </dl>

          <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Antibiótico</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2 text-right">Disponible</th>
                  <th className="px-3 py-2 text-right">Meses (MED)</th>
                  <th className="px-3 py-2 text-right">Cobertura</th>
                  <th className="px-3 py-2">Consumo 12 meses</th>
                  <th className="px-3 py-2 text-right">Pedir</th>
                  <th className="px-3 py-2 text-right">Por vencer</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.itemId} className={`border-t border-slate-100 align-top ${i.outbreakPressure ? 'bg-red-50' : ''}`}>
                    <td className="px-3 py-2">
                      <p className="font-medium">{i.antibioticName}</p>
                      <p className="text-xs text-slate-500">{i.presentation}</p>
                      <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                        {i.awareCategory && <span className={`rounded px-1.5 ${AWARE_TONES[i.awareCategory]}`}>{i.awareCategory}</span>}
                        <span className="rounded bg-slate-100 px-1.5">{i.venClass === 'VITAL' ? 'Vital' : i.venClass === 'ESSENTIAL' ? 'Esencial' : 'No esencial'}</span>
                        {i.abcClass && <span className="rounded bg-slate-100 px-1.5">ABC {i.abcClass}</span>}
                      </div>
                      {i.outbreakPressure && (
                        <p className="mt-1 flex gap-1 text-xs text-red-700">
                          <AlertTriangle size={14} className="shrink-0" aria-hidden />
                          {i.outbreakReason}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATE_TONES[i.sismedState]}`}>{i.sismedStateLabel}</span>
                      <p className="mt-1 text-xs text-slate-500">{METHOD_LABELS[i.forecastMethod] ?? i.forecastMethod}</p>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{i.availableUnits.toLocaleString('es-PE')}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{i.monthsOfStock === null ? '—' : i.monthsOfStock.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {i.coverageDays === null ? '—' : `${Math.round(i.coverageDays)} d`}
                      <p className="text-xs text-slate-500">R + L = {i.reviewPeriodDays + i.leadTimeDays} d</p>
                    </td>
                    <td className="px-3 py-2"><Sparkline values={i.monthlyConsumption.map((m) => m.units)} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {i.suggestedOrder === null ? '—' : i.suggestedOrder > 0 ? <strong>{i.suggestedOrder.toLocaleString('es-PE')}</strong> : '0'}
                      {i.suggestedOrder !== null && i.suggestedOrder > 0 && (
                        <p className="text-xs text-slate-500">
                          servicio {(i.serviceLevel * 100).toFixed(0)} %{i.safetyFloorApplied && ' · colchón mín. 10 %'}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {i.unitsAtRiskOfExpiry > 0 ? (
                        <>
                          <span className="text-orange-700">{i.unitsAtRiskOfExpiry.toLocaleString('es-PE')}</span>
                          <p className="text-xs text-slate-500">{soles(i.valueAtRiskOfExpiry)}</p>
                        </>
                      ) : (
                        '0'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {ddd.data && (
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-semibold">Consumo en DDD por 100 camas-día (may–oct 2026)</h2>
              <p className="text-sm text-slate-500">
                Total: {ddd.data.dddPer100BedDays === null ? '—' : ddd.data.dddPer100BedDays.toFixed(1)} · Access:{' '}
                {ddd.data.accessShare === null ? '—' : `${(ddd.data.accessShare * 100).toFixed(0)} %`} (meta nacional OMS ≥{' '}
                {(ddd.data.whoAccessTarget * 100).toFixed(0)} %)
              </p>
              <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-slate-100">
                {ddd.data.byAware.map((g) => (
                  <div
                    key={g.awareCategory}
                    className={g.awareCategory === 'ACCESS' ? 'bg-emerald-500' : g.awareCategory === 'WATCH' ? 'bg-amber-400' : 'bg-red-500'}
                    style={{ width: `${g.share * 100}%` }}
                    title={`${g.awareCategory}: ${(g.share * 100).toFixed(0)} %`}
                  />
                ))}
              </div>
              {ddd.data.itemsWithoutDdd.length > 0 && (
                <p className="mt-2 text-xs text-slate-500">Sin DDD registrada (no se suman): {ddd.data.itemsWithoutDdd.join(', ')}</p>
              )}
            </div>
          )}
        </>
      ) : null}
    </section>
  )
}

function Stat({ label, value, hint, danger }: { label: string; value: string; hint?: string; danger?: boolean }) {
  return (
    <div className={`rounded-xl p-4 shadow-sm ring-1 ${danger ? 'bg-red-50 ring-red-200' : 'bg-white ring-slate-200'}`}>
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className={`mt-1 text-xl font-semibold ${danger ? 'text-red-700' : 'text-slate-800'}`}>{value}</dd>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

/** Consumo mensual en miniatura: barras de alto proporcional; los meses en cero se ven vacíos. */
function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values)
  return (
    <div className="flex h-8 items-end gap-0.5" aria-label={`Consumo mensual: ${values.join(', ')}`}>
      {values.map((v, i) => (
        <div key={i} className="w-1.5 rounded-sm bg-brand-500" style={{ height: `${Math.max(v > 0 ? 8 : 0, (v / max) * 100)}%` }} />
      ))}
    </div>
  )
}
