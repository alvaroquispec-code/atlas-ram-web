import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useForm } from '../hooks/useForm'
import { toApiError } from '../utils/apiError'
import { email, required, strongPassword } from '../utils/validators'

const VALIDATORS = {
  fullName: required('Ingresa tu nombre completo'),
  email,
  password: strongPassword,
  confirmPassword: (value: string, values: { password: string }) =>
    value === values.password ? undefined : 'Las contraseñas no coinciden',
}

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { values, errors, handleChange, handleSubmit, setServerErrors } = useForm(
    { fullName: '', email: '', password: '', confirmPassword: '' },
    VALIDATORS,
  )

  const onSubmit = handleSubmit(async ({ fullName, email: mail, password }) => {
    setSubmitError(undefined)
    setIsSubmitting(true)
    try {
      await register({ fullName, email: mail, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.fieldErrors) setServerErrors(apiError.fieldErrors)
      setSubmitError(apiError.status === 409 ? 'Ya existe una cuenta con ese correo.' : apiError.message)
    } finally {
      setIsSubmitting(false)
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Crear cuenta</h2>
        <p className="mt-1 text-sm text-slate-500">Las cuentas nuevas tienen acceso de consulta.</p>
      </div>
      {submitError && <Alert tone="error">{submitError}</Alert>}
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <TextField label="Nombre completo" name="fullName" autoComplete="name" value={values.fullName} onChange={handleChange} error={errors.fullName} />
        <TextField label="Correo" name="email" type="email" autoComplete="email" value={values.email} onChange={handleChange} error={errors.email} />
        <TextField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres, con mayúscula, minúscula y número"
          value={values.password}
          onChange={handleChange}
          error={errors.password}
        />
        <TextField label="Confirmar contraseña" name="confirmPassword" type="password" autoComplete="new-password" value={values.confirmPassword} onChange={handleChange} error={errors.confirmPassword} />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Crear cuenta
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
