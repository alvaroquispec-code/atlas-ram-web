import { Eye, RefreshCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { breakpointService } from '../services/breakpointService'
import type { ReinterpretationReport } from '../types/api'
import { INTERPRETATION_LABELS } from '../utils/labels'
import { toApiError } from '../utils/apiError'

const label = (value: string) => INTERPRETATION_LABELS[value as keyof typeof INTERPRETATION_LABELS] ?? value

export default function BreakpointsPage() {
  const { showToast } = useToast()
  const { data: editions, error, isLoading, reload } = useFetch((signal) => breakpointService.editions(signal), [])
  const [version, setVersion] = useState('')
  const [report, setReport] = useState<ReinterpretationReport | null>(null)
  const [running, setRunning] = useState<'preview' | 'apply' | null>(null)

  // Por defecto se elige una edición distinta de la activa: es la comparación más útil.
  useEffect(() => {
    if (editions && !version) setVersion((editions.find((e) => !e.active) ?? editions[0])?.version ?? '')
  }, [editions, version])

  const selected = editions?.find((e) => e.version === version)

  async function run(apply: boolean) {
    if (apply && !window.confirm(`¿Reinterpretar todo el histórico con ${selected?.standard} ${version}? Cambia las categorías guardadas.`)) return
    setRunning(apply ? 'apply' : 'preview')
    try {
      const result = await breakpointService.reinterpret(version, apply)
      setReport(result)
      if (apply) {
        showToast(`Histórico reinterpretado: ${result.changed.toLocaleString('es-PE')} resultados cambiaron`, 'success')
        reload()
      }
    } catch (err) {
      showToast(toApiError(err).message, 'error')
    } finally {
      setRunning(null)
    }
  }

  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Panel', to: '/dashboard' }, { label: 'Puntos de corte' }]} />
      <header>
        <h1 className="text-2xl font-semibold">Puntos de corte</h1>
        <p className="text-sm text-slate-500">
          CLSI publica una edición nueva de M100 cada año y a veces cambia puntos de corte. Como el sistema guarda la CIM o
          el halo medidos, el histórico se puede reinterpretar con otra edición sin repetir ninguna prueba. La vista previa
          no modifica nada; aplicar solo se permite con la edición activa del servidor.
        </p>
      </header>

      {error && <Alert tone="error">{error.message}</Alert>}
      {isLoading && <Spinner label="Cargando ediciones" />}

      {editions && (
        <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <ul className="flex flex-wrap gap-2 text-sm">
            {editions.map((e) => (
              <li key={`${e.standard}-${e.version}`} className="rounded-full bg-slate-100 px-3 py-1">
                {e.standard} {e.version} · {e.breakpoints} pares{e.active && <span className="font-semibold text-emerald-700"> · activa</span>}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <SelectField
              label="Edición"
              value={version}
              onChange={(e) => {
                setVersion(e.target.value)
                setReport(null)
              }}
              options={editions.map((e) => ({ value: e.version, label: `${e.standard} ${e.version}${e.active ? ' (activa)' : ''}` }))}
              className="w-56"
            />
            <Button variant="secondary" onClick={() => run(false)} isLoading={running === 'preview'} disabled={!version || running !== null}>
              <Eye size={16} aria-hidden />
              Vista previa
            </Button>
            {selected?.active && (
              <Button variant="danger" onClick={() => run(true)} isLoading={running === 'apply'} disabled={running !== null}>
                <RefreshCcw size={16} aria-hidden />
                Aplicar al histórico
              </Button>
            )}
          </div>
        </div>
      )}

      {report && (
        <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold">
            {report.applied ? 'Aplicado' : 'Vista previa'}: {report.standard} {report.version}
          </h2>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs text-slate-500">Resultados con CIM o halo revisados</p>
              <p className="text-lg font-semibold">{report.evaluated.toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{report.applied ? 'Cambiaron de categoría' : 'Cambiarían de categoría'}</p>
              <p className="text-lg font-semibold text-amber-700">{report.changed.toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Sin punto de corte en esa edición (sin cambios)</p>
              <p className="text-lg font-semibold">{report.withoutBreakpoint.toLocaleString('es-PE')}</p>
            </div>
          </div>
          {report.changes.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Germen</th>
                    <th className="px-3 py-2">Antibiótico</th>
                    <th className="px-3 py-2">Cambio</th>
                    <th className="px-3 py-2 text-right">Resultados</th>
                  </tr>
                </thead>
                <tbody>
                  {report.changes.map((c) => (
                    <tr key={`${c.microorganism}-${c.antibiotic}-${c.from}-${c.to}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 italic">{c.microorganism}</td>
                      <td className="px-3 py-2">{c.antibiotic}</td>
                      <td className="px-3 py-2">
                        {label(c.from)} → {label(c.to)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{c.count.toLocaleString('es-PE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Alert tone="success">Ningún resultado cambia de categoría con esta edición.</Alert>
          )}
        </div>
      )}
    </section>
  )
}
