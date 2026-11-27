import { Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { accessRequestService } from '../services/accessRequestService'
import { catalogService } from '../services/catalogService'
import type { AccessRequestStatus, ProfessionalBody, Role } from '../types/api'
import { toApiError } from '../utils/apiError'
import Button from './Button'
import SelectField from './SelectField'
import TextField from './TextField'

const STATUS: Record<AccessRequestStatus, { label: string; tone: string }> = {
  PENDING: { label: 'Pendiente de aprobación', tone: 'bg-amber-50 text-amber-700' },
  APPROVED: { label: 'Aprobada: vuelve a iniciar sesión para usar tu nuevo rol', tone: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Rechazada', tone: 'bg-red-50 text-red-600' },
}

/**
 * En "Mi cuenta": el estado de mis solicitudes de acceso profesional y, si tengo acceso de consulta y no
 * tengo ninguna pendiente, el formulario para pedirlo (por ejemplo, si me registré desde la app).
 */
export default function MyAccessRequests({ role }: { role: Role }) {
  const { showToast } = useToast()
  const mine = useFetch((signal) => accessRequestService.mine(signal), [])
  const facilities = useFetch((signal) => catalogService.facilities(signal), [])
  const [facilityId, setFacilityId] = useState('')
  const [requestedRole, setRequestedRole] = useState<Role>('LAB_TECHNICIAN')
  const [body, setBody] = useState<ProfessionalBody>('CTMP')
  const [number, setNumber] = useState('')
  const [sending, setSending] = useState(false)

  const pending = (mine.data ?? []).some((r) => r.status === 'PENDING')
  const canRequest = role === 'PUBLIC_VIEWER' && !pending

  async function send() {
    if (!facilityId || !/^\d{4,6}$/.test(number)) {
      showToast(!facilityId ? 'Elige tu establecimiento' : 'La colegiatura tiene de 4 a 6 dígitos', 'error')
      return
    }
    setSending(true)
    try {
      await accessRequestService.request({
        facilityId: Number(facilityId),
        requestedRole,
        professionalBody: body,
        registrationNumber: number,
      })
      showToast('Solicitud enviada. Un administrador la revisará.', 'success')
      mine.reload()
    } catch (err) {
      showToast(toApiError(err).message, 'error')
    } finally {
      setSending(false)
    }
  }

  if (!canRequest && (mine.data ?? []).length === 0) return null

  return (
    <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <Stethoscope size={18} aria-hidden /> Acceso profesional
      </h2>
      {(mine.data ?? []).map((r) => (
        <p key={r.id} className="text-sm">
          {r.facilityName} · {r.professionalBody} {r.registrationNumber}{' '}
          <span className={`ml-1 rounded px-2 py-0.5 text-xs ${STATUS[r.status].tone}`}>{STATUS[r.status].label}</span>
          {r.note && <span className="block text-xs text-slate-500">Motivo: {r.note}</span>}
        </p>
      ))}
      {canRequest && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Establecimiento"
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            options={[{ value: '', label: 'Elige…' }, ...(facilities.data ?? []).map((f) => ({ value: f.id, label: f.name }))]}
          />
          <SelectField
            label="Rol que necesitas"
            value={requestedRole}
            onChange={(e) => setRequestedRole(e.target.value as Role)}
            options={[
              { value: 'LAB_TECHNICIAN', label: 'Laboratorio de microbiología' },
              { value: 'EPIDEMIOLOGIST', label: 'Epidemiología / comité PROA o IAAS' },
              { value: 'PHARMACIST', label: 'Farmacia' },
            ]}
          />
          <SelectField
            label="Colegio profesional"
            value={body}
            onChange={(e) => setBody(e.target.value as ProfessionalBody)}
            options={[
              { value: 'CMP', label: 'Colegio Médico (CMP)' },
              { value: 'CTMP', label: 'Colegio Tecnólogo Médico (CTMP)' },
              { value: 'CBP', label: 'Colegio de Biólogos (CBP)' },
              { value: 'CQFP', label: 'Colegio Químico Farmacéutico (CQFP)' },
            ]}
          />
          <TextField
            label="Número de colegiatura"
            inputMode="numeric"
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
          />
          <div className="sm:col-span-2">
            <Button onClick={send} isLoading={sending}>
              Solicitar acceso profesional
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
