import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useForm } from '../hooks/useForm'
import { toApiError } from '../utils/apiError'
import { email, required } from '../utils/validators'

const VALIDATORS = { email, password: required('Ingresa tu contraseña') }

interface LocationState {
  from?: { pathname: string }
  sessionExpired?: boolean
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LocationState
  const [submitError, setSubmitError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { values, errors, handleChange, handleSubmit } = useForm({ email: '', password: '' }, VALIDATORS)

  const onSubmit = handleSubmit(async (credentials) => {
    setSubmitError(undefined)
    setIsSubmitting(true)
    try {
      await login(credentials)
      navigate(state.from?.pathname ?? '/dashboard', { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      setSubmitError(apiError.status === 401 ? 'Correo o contraseña incorrectos.' : apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
        <p className="mt-1 text-sm text-slate-500">Accede al panel de vigilancia.</p>
      </div>
      {state.sessionExpired && <Alert tone="warning">Tu sesión expiró. Vuelve a ingresar.</Alert>}
      {submitError && <Alert tone="error">{submitError}</Alert>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField
          label="Correo"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@hospital.pe"
          value={values.email}
          onChange={handleChange}
          error={errors.email}
        />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="current-password"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Ingresar
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-medium text-brand-600 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  )
}


