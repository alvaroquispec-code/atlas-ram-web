import { Building2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { facilityRequestService, isWarningCheck } from '../services/verificationService'
import type { FacilitySector } from '../types/api'
import { toApiError } from '../utils/apiError'

const STATUS_LABELS = { PENDING: 'Pendiente', APPROVED: 'Aprobada', REJECTED: 'Rechazada' } as const

/** Dígito verificador de SUNAT (el servidor lo vuelve a comprobar). */
function rucIsValid(ruc: string) {
  if (!/^(10|15|16|17|20)\d{9}$/.test(ruc)) return false
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const sum = weights.reduce((acc, w, i) => acc + w * Number(ruc[i]), 0)
  const r = 11 - (sum % 11)
  return (r === 10 ? 0 : r === 11 ? 1 : r) === Number(ruc[10])
}

/**
 * Registro de un establecimiento nuevo (clínica privada u hospital que aún no está). El sector no lo decide
 * quien registra: sale del padrón RENIPRESS de SUSALUD. Un hospital público con correo verificado del Estado
 * (@….gob.pe) y nombre que coincide con RENIPRESS queda aprobado al instante y quien lo registró pasa a
 * administrarlo; lo demás lo revisa un administrador.
 */
export default function FacilityRequestPage() {
  const { user, refreshUser } = useAuth()
  const { showToast } = useToast()
  const districts = useFetch((signal) => facilityRequestService.districts(signal), [])
  const mine = useFetch((signal) => facilityRequestService.mine(signal), [])
  const [form, setForm] = useState({ name: '', ruc: '', renipressCode: '', districtId: '', claimedSector: 'PRIVATE' })
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const rucError = form.ruc.length === 11 && !rucIsValid(form.ruc) ? 'RUC inválido: no coincide el dígito verificador' : undefined

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(undefined)
    if (!form.name.trim() || form.ruc.length !== 11 || form.renipressCode.length !== 8 || !form.districtId) {
      setError('Completa nombre, RUC (11 dígitos), código IPRESS (8 dígitos) y distrito.')
      return
    }
    if (rucError) {
      setError(rucError)
      return
    }
    setBusy(true)
    try {
      const r = await facilityRequestService.create({
        name: form.name.trim(),
        ruc: form.ruc,
        renipressCode: form.renipressCode,
        districtId: Number(form.districtId),
        claimedSector: form.claimedSector as FacilitySector,
      })
      showToast(
        r.status === 'APPROVED'
          ? `${r.renipressName ?? r.name} quedó registrado y ahora lo administras`
          : 'Solicitud enviada: un administrador la revisará',
        'success',
      )
      if (r.status === 'APPROVED') refreshUser().catch(() => {})
      setForm({ name: '', ruc: '', renipressCode: '', districtId: '', claimedSector: 'PRIVATE' })
      mine.reload()
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Mi cuenta', to: '/account' }, { label: 'Registrar establecimiento' }]} />
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Building2 size={22} aria-hidden /> Registrar un establecimiento
        </h1>
        <p className="text-sm text-slate-500">
          Para clínicas y hospitales que aún no están en Atlas RAM. Quien lo registra pasa a ser su administrador y
          aprueba a su propio personal.
        </p>
      </header>

      {user && user.emailVerified === false && (
        <Alert tone="warning">
          Verifica tu correo antes de registrar un establecimiento: sin correo verificado la solicitud no se puede aprobar.
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <form onSubmit={submit} noValidate className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          {error && <Alert tone="error">{error}</Alert>}
          <TextField
            label="Nombre del establecimiento"
            name="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            hint="Tal como figura en RENIPRESS"
          />
          <TextField
            label="RUC"
            name="ruc"
            inputMode="numeric"
            value={form.ruc}
            onChange={(e) => setForm({ ...form, ruc: e.target.value.replace(/\D/g, '').slice(0, 11) })}
            error={rucError}
            hint="11 dígitos; se comprueba el dígito verificador de SUNAT"
          />
          <TextField
            label="Código IPRESS (RENIPRESS)"
            name="renipressCode"
            inputMode="numeric"
            value={form.renipressCode}
            onChange={(e) => setForm({ ...form, renipressCode: e.target.value.replace(/\D/g, '').slice(0, 8) })}
            hint="8 dígitos. Lo encuentras en el buscador de SUSALUD"
          />
          <SelectField
            label="Distrito"
            value={form.districtId}
            onChange={(e) => setForm({ ...form, districtId: e.target.value })}
            options={[
              { value: '', label: districts.isLoading ? 'Cargando…' : 'Elige…' },
              ...(districts.data ?? []).map((d) => ({ value: d.id, label: `${d.name} (${d.province})` })),
            ]}
          />
          <SelectField
            label="Sector que declaras"
            value={form.claimedSector}
            onChange={(e) => setForm({ ...form, claimedSector: e.target.value })}
            options={[
              { value: 'PRIVATE', label: 'Privado (clínica, consultorio)' },
              { value: 'PUBLIC', label: 'Público (MINSA, EsSalud, FF.AA., gobierno regional)' },
            ]}
          />
          <p className="text-xs text-slate-500">
            El sector final no depende de lo que declares: Atlas RAM lo toma del padrón RENIPRESS de SUSALUD. Una clínica
            privada que se declare pública queda registrada como privada (con licencia).
          </p>
          <a
            href="https://app20.susalud.gob.pe:8080/registro-renipress-webapp/listadoEstablecimientosRegistrados.htm"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-brand-700 underline"
          >
            Buscar el código IPRESS en SUSALUD <ExternalLink size={12} aria-hidden />
          </a>
          <Button type="submit" isLoading={busy} className="w-full">
            Enviar solicitud
          </Button>
        </form>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Mis solicitudes</h2>
          {(mine.data ?? []).length === 0 && (
            <p className="text-sm text-slate-500">{mine.isLoading ? 'Cargando…' : 'Aún no registraste establecimientos.'}</p>
          )}
          {(mine.data ?? []).map((r) => (
            <article key={r.id} className="rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
              <p className="font-semibold">
                {r.renipressName ?? r.name}{' '}
                <span className="font-normal text-slate-500">
                  · IPRESS {r.renipressCode} · {STATUS_LABELS[r.status]}
                </span>
              </p>
              {r.note && <p className="text-slate-600">{r.note}</p>}
              <ul className="mt-2 space-y-0.5 text-xs">
                {r.checks.map((c) => (
                  <li key={c} className={isWarningCheck(c) ? 'text-amber-700' : 'text-emerald-700'}>
                    {isWarningCheck(c) ? '⚠' : '✓'} {c}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
