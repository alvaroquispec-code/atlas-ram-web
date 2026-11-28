import { CheckCircle2, MailWarning } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { verificationService } from '../services/verificationService'
import { toApiError } from '../utils/apiError'

/**
 * Destino del enlace del correo de verificación. Es pública: funciona aunque se abra en otro navegador.
 * Si el correo es del dominio institucional del establecimiento, el servidor aprueba la solicitud de acceso
 * pendiente en el mismo paso.
 */
export default function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [state, setState] = useState<{ ok: boolean; message: string } | null>(null)
  const started = useRef(false)
  const { isAuthenticated, refreshUser } = useAuth()

  useEffect(() => {
    // StrictMode monta dos veces en desarrollo; el token es de un solo uso.
    if (started.current) return
    started.current = true
    if (!token) {
      setState({ ok: false, message: 'El enlace no tiene token. Ábrelo tal como llegó al correo.' })
      return
    }
    verificationService
      .verify(token)
      .then((r) => {
        setState({ ok: true, message: r.message })
        // Si en este navegador ya había sesión, se actualiza para que la puerta de verificación se abra.
        if (isAuthenticated) refreshUser().catch(() => {})
      })
      .catch((err) => setState({ ok: false, message: toApiError(err).message }))
  }, [token])

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      {!state ? (
        <>
          <Spinner />
          <p className="text-sm text-slate-500">Verificando tu correo…</p>
        </>
      ) : (
        <>
          {state.ok ? (
            <CheckCircle2 size={40} className="text-emerald-600" aria-hidden />
          ) : (
            <MailWarning size={40} className="text-amber-600" aria-hidden />
          )}
          <h1 className="text-xl font-semibold text-slate-900">
            {state.ok ? 'Correo verificado' : 'No se pudo verificar'}
          </h1>
          <p className="text-sm text-slate-600">{state.message}</p>
          {!state.ok && (
            <p className="text-xs text-slate-500">
              Puedes pedir un enlace nuevo desde Mi cuenta. Los enlaces vencen a las 24 horas y sirven una sola vez.
            </p>
          )}
          <Link to="/dashboard" className="text-sm font-medium text-brand-600 hover:underline">
            Entrar a Atlas RAM
          </Link>
        </>
      )}
    </main>
  )
}
