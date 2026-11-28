import { LogOut, MailCheck, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { verificationService } from '../services/verificationService'
import { toApiError } from '../utils/apiError'
import BrandMark from './BrandMark'
import Button from './Button'

/**
 * Puerta de verificación: una cuenta nueva no ve ningún dato hasta confirmar su correo. Así cada cuenta tiene
 * detrás un buzón real (no se crean cuentas en masa para copiar datos) y, si el correo es del dominio de su
 * hospital, el rol profesional se asigna en el mismo paso. Las cuentas creadas por un administrador ya vienen
 * verificadas.
 */
export default function VerifyEmailGate() {
  const { user, refreshUser, logout } = useAuth()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)
  const [checking, setChecking] = useState(false)
  if (!user) return null

  return (
    <div className="mx-auto mt-6 max-w-xl space-y-6 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3">
        <BrandMark className="h-9 w-9" />
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Confirma tu correo para entrar</h1>
      </div>
      <p className="text-slate-700">
        Te enviamos un enlace a <strong>{user.email}</strong>. Ábrelo para activar tu cuenta. Hasta entonces no se
        muestran datos.
      </p>
      <ul className="space-y-2 text-sm text-slate-600">
        <li>
          <b className="text-slate-800">Si es el correo institucional de tu hospital</b> (por ejemplo
          @hospitalloayza.gob.pe), al confirmarlo recibes tu rol profesional sin esperar a nadie.
        </li>
        <li>
          <b className="text-slate-800">Si es un correo personal</b>, entras con acceso de consulta y el jefe de tu
          establecimiento revisa tu colegiatura antes de darte el rol.
        </li>
        <li>El enlace vence a las 24 horas y sirve una sola vez. Revisa también spam y Promociones.</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button
          isLoading={checking}
          onClick={async () => {
            setChecking(true)
            try {
              await refreshUser()
            } finally {
              setChecking(false)
            }
          }}
        >
          <MailCheck size={16} aria-hidden /> Ya lo confirmé
        </Button>
        <Button
          variant="secondary"
          isLoading={busy}
          onClick={async () => {
            setBusy(true)
            try {
              const r = await verificationService.resend()
              showToast(r.message, r.sent ? 'success' : 'error')
            } catch (err) {
              showToast(toApiError(err).message, 'error')
            } finally {
              setBusy(false)
            }
          }}
        >
          <RotateCw size={16} aria-hidden /> Reenviar enlace
        </Button>
        <Button variant="ghost" onClick={logout}>
          <LogOut size={16} aria-hidden /> Salir
        </Button>
      </div>
    </div>
  )
}
