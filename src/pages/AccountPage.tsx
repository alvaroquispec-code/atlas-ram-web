import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import Alert from '../components/Alert'
import MyAccessRequests from '../components/MyAccessRequests'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useForm } from '../hooks/useForm'
import { useToast } from '../hooks/useToast'
import type { Role } from '../types/api'
import { toApiError } from '../utils/apiError'
import { required, strongPassword } from '../utils/validators'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  LAB_TECHNICIAN: 'Técnico de laboratorio',
  EPIDEMIOLOGIST: 'Epidemiólogo',
  PUBLIC_VIEWER: 'Consulta pública',
  PHARMACIST: 'Farmacéutico',
}

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' }

const VALIDATORS = {
  currentPassword: required('Ingresa tu contraseña actual'),
  newPassword: (value: string, values: typeof EMPTY) =>
    strongPassword(value) ?? (value === values.currentPassword ? 'Debe ser distinta de la actual' : undefined),
  confirmPassword: (value: string, values: typeof EMPTY) =>
    value === values.newPassword ? undefined : 'Las contraseñas no coinciden',
}

export default function AccountPage() {
  const { user, changePassword, logoutEverywhere } = useAuth()
  const { showToast } = useToast()
  const [formKey, setFormKey] = useState(0)

  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Panel', to: '/dashboard' }, { label: 'Mi cuenta' }]} />
      <header>
        <h1 className="text-2xl font-semibold">Mi cuenta</h1>
        <p className="text-sm text-slate-500">
          {user?.fullName} · {user?.email} · {user ? ROLE_LABELS[user.role] : ''}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <KeyRound size={18} aria-hidden />
            Cambiar contraseña
          </h2>
          <p className="text-sm text-slate-500">
            Al cambiarla se cierran tus sesiones en los demás dispositivos; en este sigues conectado.
          </p>
          {/* La clave remonta el formulario y lo deja vacío después de un cambio exitoso. */}
          <ChangePasswordForm
            key={formKey}
            onSubmit={async (currentPassword, newPassword) => {
              await changePassword(currentPassword, newPassword)
              showToast('Contraseña actualizada. Se cerraron tus otras sesiones.', 'success')
              setFormKey((k) => k + 1)
            }}
          />
        </div>

        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck size={18} aria-hidden />
            Sesiones
          </h2>
          <p className="text-sm text-slate-500">
            Si usaste Atlas RAM en una computadora compartida o perdiste un celular con la app abierta, cierra la
            sesión en todos los dispositivos. Tendrás que volver a ingresar también aquí.
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (!window.confirm('¿Cerrar la sesión en todos los dispositivos, incluido este?')) return
              logoutEverywhere().catch((err) => showToast(toApiError(err).message, 'error'))
            }}
          >
            <LogOut size={16} aria-hidden />
            Cerrar sesión en todos los dispositivos
          </Button>
        </div>
      </div>
      {user && <MyAccessRequests role={user.role} />}
    </section>
  )
}

function ChangePasswordForm({ onSubmit }: { onSubmit: (current: string, next: string) => Promise<void> }) {
  const [submitError, setSubmitError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { values, errors, handleChange, handleSubmit, setServerErrors } = useForm(EMPTY, VALIDATORS)

  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    setSubmitError(undefined)
    setIsSubmitting(true)
    try {
      await onSubmit(currentPassword, newPassword)
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.fieldErrors) setServerErrors(apiError.fieldErrors)
      // 422: contraseña actual incorrecta o nueva igual a la actual (mensaje del servidor).
      setSubmitError(apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {submitError && <Alert tone="error">{submitError}</Alert>}
      <TextField
        label="Contraseña actual"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={values.currentPassword}
        onChange={handleChange}
        error={errors.currentPassword}
      />
      <TextField
        label="Nueva contraseña"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
        value={values.newPassword}
        onChange={handleChange}
        error={errors.newPassword}
      />
      <TextField
        label="Confirmar nueva contraseña"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={values.confirmPassword}
        onChange={handleChange}
        error={errors.confirmPassword}
      />
      <Button type="submit" isLoading={isSubmitting}>
        Guardar contraseña
      </Button>
    </form>
  )
}
