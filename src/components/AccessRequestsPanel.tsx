import { CheckCircle2, ExternalLink, UserCheck, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { accessRequestService } from '../services/accessRequestService'
import type { AccessRequest, Role } from '../types/api'
import { toApiError } from '../utils/apiError'
import Button from './Button'

const ROLE_LABELS: Partial<Record<Role, string>> = {
  LAB_TECHNICIAN: 'Técnico de laboratorio',
  EPIDEMIOLOGIST: 'Epidemiólogo',
  PHARMACIST: 'Farmacéutico',
}

/**
 * Solicitudes de acceso profesional pendientes. El sistema ya comprobó lo que puede comprobar solo; el
 * administrador confirma la colegiatura en el buscador del colegio y aprueba o rechaza con un clic.
 */
export default function AccessRequestsPanel({ onDecided }: { onDecided: () => void }) {
  const { showToast } = useToast()
  const { data, isLoading, error, reload } = useFetch((signal) => accessRequestService.pending(signal), [])
  const [busy, setBusy] = useState<number | null>(null)

  async function decide(request: AccessRequest, approve: boolean) {
    setBusy(request.id)
    try {
      if (approve) await accessRequestService.approve(request.id)
      else await accessRequestService.reject(request.id)
      showToast(
        approve
          ? `${request.userFullName} ahora es ${ROLE_LABELS[request.requestedRole] ?? request.requestedRole} en ${request.facilityName}`
          : 'Solicitud rechazada',
        'success',
      )
      reload()
      onDecided()
    } catch (err) {
      showToast(toApiError(err).message, 'error')
    } finally {
      setBusy(null)
    }
  }

  if (isLoading || error || !data || data.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-slate-500">
        <UserCheck size={16} aria-hidden />
        {isLoading ? 'Revisando solicitudes de acceso…' : error ? 'No se pudieron cargar las solicitudes de acceso.' : 'No hay solicitudes de acceso pendientes.'}
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <UserCheck size={18} aria-hidden /> Solicitudes de acceso profesional ({data.length})
      </h2>
      {data.map((r) => (
        <article key={r.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="font-semibold">
                {r.userFullName} <span className="font-normal text-slate-500">· {r.userEmail}</span>
              </p>
              <p className="text-sm text-slate-600">
                Pide <b>{ROLE_LABELS[r.requestedRole] ?? r.requestedRole}</b> en <b>{r.facilityName}</b>
              </p>
              <p className="text-sm text-slate-600">
                {r.professionalBodyLabel}, colegiatura <span className="font-mono">{r.registrationNumber}</span>
                {r.lookupUrl && (
                  <a
                    href={r.lookupUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-brand-700 underline"
                  >
                    Verificar en el buscador del colegio <ExternalLink size={12} aria-hidden />
                  </a>
                )}
              </p>
              <ul className="mt-2 space-y-0.5 text-xs">
                {r.checks.map((c) => (
                  <li key={c} className={c.startsWith('Atención') ? 'text-amber-700' : 'text-emerald-700'}>
                    {c.startsWith('Atención') ? '⚠' : '✓'} {c}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => decide(r, true)} isLoading={busy === r.id} disabled={busy !== null}>
                <CheckCircle2 size={16} aria-hidden /> Aprobar
              </Button>
              <Button variant="secondary" onClick={() => decide(r, false)} disabled={busy !== null}>
                <XCircle size={16} aria-hidden /> Rechazar
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
