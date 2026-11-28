import { Building2, CheckCircle2, UserPlus, XCircle } from 'lucide-react'
import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { catalogService } from '../services/catalogService'
import { facilityRequestService, isWarningCheck } from '../services/verificationService'
import type { FacilityRequest } from '../types/api'
import { toApiError } from '../utils/apiError'
import Button from './Button'
import SelectField from './SelectField'
import TextField from './TextField'

const SECTOR = { PUBLIC: 'público', PRIVATE: 'privado' } as const

/** Solicitudes de establecimientos nuevos que no se aprobaron solas, y asignación de administradores. */
export default function FacilityRequestsPanel() {
  const { showToast } = useToast()
  const { data, reload } = useFetch((signal) => facilityRequestService.pending(signal), [])
  const facilities = useFetch((signal) => catalogService.facilities(signal), [])
  const [busy, setBusy] = useState<number | null>(null)
  const [manager, setManager] = useState({ facilityId: '', email: '' })

  async function decide(r: FacilityRequest, approve: boolean) {
    setBusy(r.id)
    try {
      if (approve) await facilityRequestService.approve(r.id)
      else await facilityRequestService.reject(r.id)
      showToast(approve ? `${r.renipressName ?? r.name} registrado` : 'Solicitud rechazada', 'success')
      reload()
      facilities.reload()
    } catch (err) {
      showToast(toApiError(err).message, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Building2 size={18} aria-hidden /> Establecimientos por registrar ({data?.length ?? 0})
      </h2>
      {(data ?? []).length === 0 && (
        <p className="text-sm text-slate-500">
          No hay solicitudes pendientes. Los hospitales públicos con correo verificado del Estado se aprueban solos.
        </p>
      )}
      {(data ?? []).map((r) => (
        <article key={r.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1 text-sm">
              <p className="font-semibold">
                {r.name} <span className="font-normal text-slate-500">· {r.requesterEmail}</span>
              </p>
              <p className="text-slate-600">
                RUC <span className="font-mono">{r.ruc}</span> · IPRESS <span className="font-mono">{r.renipressCode}</span> ·{' '}
                {r.districtName} · declaró {SECTOR[r.claimedSector]}
                {r.sectorByRenipress && <> · RENIPRESS: <b>{SECTOR[r.sectorByRenipress]}</b></>}
              </p>
              <ul className="mt-2 space-y-0.5 text-xs">
                {r.checks.map((c) => (
                  <li key={c} className={isWarningCheck(c) ? 'text-amber-700' : 'text-emerald-700'}>
                    {isWarningCheck(c) ? '⚠' : '✓'} {c}
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

      <form
        className="grid grid-cols-1 items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-[1fr_1fr_auto]"
        onSubmit={async (e) => {
          e.preventDefault()
          if (!manager.facilityId || !manager.email) return
          try {
            await facilityRequestService.addManager(Number(manager.facilityId), manager.email.trim())
            showToast(`${manager.email} ahora administra ese establecimiento`, 'success')
            setManager({ facilityId: '', email: '' })
          } catch (err) {
            showToast(toApiError(err).message, 'error')
          }
        }}
      >
        <SelectField
          label="Establecimiento"
          value={manager.facilityId}
          onChange={(e) => setManager({ ...manager, facilityId: e.target.value })}
          options={[{ value: '', label: 'Elige…' }, ...(facilities.data ?? []).map((f) => ({ value: f.id, label: f.name }))]}
        />
        <TextField
          label="Correo del jefe del establecimiento"
          name="managerEmail"
          type="email"
          value={manager.email}
          onChange={(e) => setManager({ ...manager, email: e.target.value })}
        />
        <Button type="submit">
          <UserPlus size={16} aria-hidden /> Nombrar administrador
        </Button>
      </form>
    </div>
  )
}
