import { KeyRound, RotateCw } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AccessRequestsPanel from '../components/AccessRequestsPanel'
import Alert from '../components/Alert'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useForm } from '../hooks/useForm'
import { useToast } from '../hooks/useToast'
import { userService } from '../services/userService'
import type { Role, User } from '../types/api'
import { toApiError } from '../utils/apiError'
import { strongPassword } from '../utils/validators'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  LAB_TECHNICIAN: 'Técnico de laboratorio',
  EPIDEMIOLOGIST: 'Epidemiólogo',
  PUBLIC_VIEWER: 'Consulta pública',
  PHARMACIST: 'Farmacéutico',
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(0, Number(searchParams.get('page') ?? 0))
  const size = Number(searchParams.get('size') ?? 10)

  const { data, error, isLoading, reload } = useFetch((signal) => userService.list({ page, size }, signal), [page, size])

  const goTo = (nextPage: number, nextSize = size) =>
    setSearchParams({ page: String(nextPage), size: String(nextSize) })

  // Después de cada cambio se avisa con un toast y se recarga la página actual.
  async function run(action: Promise<User>, successMessage: string) {
    try {
      await action
      showToast(successMessage, 'success')
      reload()
    } catch (err) {
      showToast(toApiError(err).message, 'error')
    }
  }

  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Panel', to: '/dashboard' }, { label: 'Usuarios' }]} />
      <header>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-slate-500">
          Solo los administradores ven esta página. Cambia el rol, restablece la contraseña o desactiva cuentas.
        </p>
      </header>

      <AccessRequestsPanel onDecided={reload} />

      {error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {error.message}
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <Spinner label="Cargando usuarios" />
                  </td>
                </tr>
              ) : (
                data?.content.map((user) => {
                  const isMe = user.email === currentUser?.email
                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-3">{user.fullName}</td>
                      <td className="px-4 py-3 text-slate-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          disabled={isMe}
                          onChange={(e) =>
                            run(userService.changeRole(user.id, e.target.value as Role), `Rol de ${user.fullName} actualizado`)
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1"
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={user.active ? 'text-emerald-700' : 'text-slate-400'}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="flex justify-end gap-2 px-4 py-3">
                        {!isMe && (
                          <Button variant="secondary" onClick={() => setResetTarget(user)} title="Restablecer contraseña">
                            <KeyRound size={16} aria-hidden />
                            <span className="hidden md:inline">Contraseña</span>
                          </Button>
                        )}
                        {!isMe && (
                          <Button
                            variant={user.active ? 'danger' : 'secondary'}
                            onClick={() => {
                              // Desactivar deja a la persona sin acceso: pedimos confirmación antes.
                              if (user.active && !window.confirm(`¿Desactivar a ${user.fullName}? Ya no podrá iniciar sesión.`)) return
                              run(
                                userService.setActive(user.id, !user.active),
                                user.active ? `${user.fullName} fue desactivado` : `${user.fullName} fue activado`,
                              )
                            }}
                          >
                            {user.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {resetTarget && (
        <ResetPasswordDialog
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => {
            showToast(`Contraseña de ${resetTarget.fullName} restablecida. Se cerraron sus sesiones.`, 'success')
            setResetTarget(null)
          }}
        />
      )}

      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          size={size}
          onPageChange={(next) => goTo(next)}
          onSizeChange={(nextSize) => goTo(0, nextSize)}
        />
      )}
    </section>
  )
}

const RESET_EMPTY = { newPassword: '', confirmPassword: '' }
const RESET_VALIDATORS = {
  newPassword: strongPassword,
  confirmPassword: (value: string, values: typeof RESET_EMPTY) =>
    value === values.newPassword ? undefined : 'Las contraseñas no coinciden',
}

/**
 * El administrador asigna una contraseña nueva (por ejemplo, si la persona la olvidó) y se la comunica por un
 * canal seguro. El servidor cierra todas las sesiones abiertas de ese usuario.
 */
function ResetPasswordDialog({ user, onClose, onDone }: { user: User; onClose: () => void; onDone: () => void }) {
  const [submitError, setSubmitError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { values, errors, handleChange, handleSubmit, setServerErrors } = useForm(RESET_EMPTY, RESET_VALIDATORS)

  const submit = handleSubmit(async ({ newPassword }) => {
    setSubmitError(undefined)
    setIsSubmitting(true)
    try {
      await userService.resetPassword(user.id, newPassword)
      onDone()
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.fieldErrors) setServerErrors(apiError.fieldErrors)
      setSubmitError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-title"
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      >
        <h2 id="reset-title" className="text-lg font-semibold">
          Restablecer contraseña
        </h2>
        <p className="text-sm text-slate-500">
          {user.fullName} ({user.email}). Se cerrarán todas sus sesiones abiertas. Comunícale la contraseña por un canal
          seguro y pídele que la cambie desde «Mi cuenta».
        </p>
        <form onSubmit={submit} noValidate className="space-y-4">
          {submitError && <Alert tone="error">{submitError}</Alert>}
          <TextField
            label="Nueva contraseña"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            autoFocus
            hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
            value={values.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
          />
          <TextField
            label="Confirmar contraseña"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Restablecer
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
