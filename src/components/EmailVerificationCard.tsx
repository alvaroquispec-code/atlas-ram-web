import { MailCheck, MailWarning } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../hooks/useToast'
import { verificationService } from '../services/verificationService'
import { toApiError } from '../utils/apiError'
import Button from './Button'

/** Estado del correo y botón para reenviar el enlace. */
export default function EmailVerificationCard() {
  const { user, refreshUser } = useAuth()
  const { showToast } = useToast()
  const [busy, setBusy] = useState(false)
  if (!user) return null

  // Cuentas anteriores al campo (servidor sin V20): no se muestra nada.
  if (user.emailVerified === undefined) return null

  if (user.emailVerified) {
    return (
      <p className="flex items-center gap-2 text-sm text-emerald-700">
        <MailCheck size={16} aria-hidden /> Correo verificado ({user.email})
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
      <p className="flex items-start gap-2">
        <MailWarning size={18} className="mt-0.5 shrink-0" aria-hidden />
        <span>
          Tu correo aún no está verificado. Abre el enlace que te enviamos a <strong>{user.email}</strong>. Si es el
          correo institucional de tu hospital, tu acceso profesional se aprueba solo al verificarlo.
        </span>
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => refreshUser().catch(() => {})}>
          Ya lo verifiqué
        </Button>
        <Button
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
          Reenviar enlace
        </Button>
      </div>
    </div>
  )
}
