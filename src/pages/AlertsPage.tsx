import { BellRing, RotateCw } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { alertService } from '../services/alertService'
import { catalogService } from '../services/catalogService'
import type { AlertStatus, ResistanceAlert } from '../types/api'
import { toApiError } from '../utils/apiError'
import { formatDate } from '../utils/labels'

const STATUS_LABELS: Record<AlertStatus, string> = { OPEN: 'Abierta', ACKNOWLEDGED: 'Reconocida', CLOSED: 'Cerrada' }
const STATUS_TONES: Record<AlertStatus, string> = {
  OPEN: 'bg-red-100 text-red-800',
  ACKNOWLEDGED: 'bg-amber-100 text-amber-800',
  CLOSED: 'bg-slate-100 text-slate-600',
}

const formatP = (p: number) => (p < 0.0001 ? 'p < 0.0001' : `p = ${p.toFixed(4)}`)

export default function AlertsPage() {
  const { hasRole } = useAuth()
  const { showToast } = useToast()
  const canManage = hasRole('ADMIN', 'EPIDEMIOLOGIST')
  const [status, setStatus] = useState<AlertStatus | ''>('')
  const alerts = useFetch((signal) => alertService.list(status || undefined, signal), [status])

  // Reevaluación de un periodo pasado (para la demo y para validar el detector).
  const facilities = useFetch((signal) => catalogService.facilities(signal), [])
  const [replayFacility, setReplayFacility] = useState('6')
  const [replayFrom, setReplayFrom] = useState('2026-03-02')
  const [replayTo, setReplayTo] = useState('2026-06-29')
  const [isReplaying, setIsReplaying] = useState(false)

  const replay = async () => {
    setIsReplaying(true)
    try {
      const detected = await alertService.replay(Number(replayFacility), replayFrom, replayTo)
      showToast(detected.length > 0 ? `${detected.length} alerta(s) nueva(s)` : 'No hay alertas nuevas en ese periodo; las ya abiertas siguen en la lista', 'success')
      alerts.reload()
    } catch (e) {
      showToast(toApiError(e).message, 'error')
    } finally {
      setIsReplaying(false)
    }
  }

  const change = async (alert: ResistanceAlert, next: AlertStatus) => {
    try {
      await alertService.updateStatus(alert.id, next)
      showToast(next === 'CLOSED' ? 'Alerta cerrada' : 'Alerta reconocida', 'success')
      alerts.reload()
    } catch (e) {
      showToast(toApiError(e).message, 'error')
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Alertas de brote</h1>
        <p className="text-sm text-slate-500">
          Tras cada carga, el sistema compara las últimas 4 semanas de cada establecimiento con su propia línea base de 12
          meses (prueba binomial exacta). Una alerta queda abierta hasta que el comité de infecciones la cierra.
        </p>
      </header>

      <div className="flex flex-wrap items-end gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <SelectField
          label="Estado"
          value={status}
          onChange={(e) => setStatus(e.target.value as AlertStatus | '')}
          options={[
            { value: '', label: 'Todas' },
            { value: 'OPEN', label: 'Abiertas' },
            { value: 'ACKNOWLEDGED', label: 'Reconocidas' },
            { value: 'CLOSED', label: 'Cerradas' },
          ]}
        />
        {canManage && (
          <>
            <SelectField
              label="Reevaluar establecimiento"
              value={replayFacility}
              onChange={(e) => setReplayFacility(e.target.value)}
              options={(facilities.data ?? []).map((f) => ({ value: f.id, label: f.name }))}
            />
            <TextField label="Desde" type="date" value={replayFrom} onChange={(e) => setReplayFrom(e.target.value)} />
            <TextField label="Hasta" type="date" value={replayTo} onChange={(e) => setReplayTo(e.target.value)} />
            <Button variant="secondary" onClick={replay} isLoading={isReplaying}>
              <BellRing size={16} aria-hidden />
              Reevaluar semana a semana
            </Button>
          </>
        )}
      </div>

      {alerts.isLoading ? (
        <div className="py-16">
          <Spinner label="Cargando alertas" />
        </div>
      ) : alerts.error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={alerts.reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {alerts.error.message}
        </Alert>
      ) : (alerts.data ?? []).length === 0 ? (
        <Alert tone="info">No hay alertas{status ? ' en este estado' : ''}.</Alert>
      ) : (
        <ul className="space-y-3">
          {(alerts.data ?? []).map((a) => (
            <li key={a.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    <span className="italic">{a.microorganismName}</span> resistente a {a.antibioticClass.toLowerCase()}
                  </p>
                  <p className="text-sm text-slate-500">
                    {a.facilityName} · detectada el {formatDate(a.detectedOn)} · ventana {formatDate(a.windowStart)} –{' '}
                    {formatDate(a.windowEnd)}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_TONES[a.status]}`}>
                  {STATUS_LABELS[a.status]}
                </span>
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-xs text-slate-500">Ventana de 4 semanas</p>
                  <p className="text-lg font-semibold text-red-700">
                    {a.observedPercentage.toFixed(0)} % <span className="text-sm font-normal text-slate-500">({a.resistantCount} de {a.testedCount})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Línea base (12 meses antes de la ventana)</p>
                  <p className="text-lg font-semibold">
                    {a.baselinePercentage.toFixed(0)} % <span className="text-sm font-normal text-slate-500">({a.baselineResistant} de {a.baselineTested})</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Prueba binomial exacta</p>
                  <p className="text-lg font-semibold">{formatP(a.pValue)}</p>
                  <p className="text-xs text-slate-500">Marcador: {a.antibioticName}</p>
                </div>
              </div>
              {a.closeReason && <p className="mt-2 text-xs text-slate-500">Motivo de cierre: {a.closeReason}</p>}
              {canManage && a.status !== 'CLOSED' && (
                <div className="mt-3 flex gap-2">
                  {a.status === 'OPEN' && (
                    <Button variant="secondary" onClick={() => change(a, 'ACKNOWLEDGED')}>Reconocer</Button>
                  )}
                  <Button variant="ghost" onClick={() => change(a, 'CLOSED')}>Cerrar</Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
