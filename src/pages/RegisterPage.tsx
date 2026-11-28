import { ShieldCheck, Stethoscope, User as UserIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import TextField from '../components/TextField'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useForm } from '../hooks/useForm'
import { useToast } from '../hooks/useToast'
import { catalogService } from '../services/catalogService'
import type { ProfessionalBody, Role } from '../types/api'
import { toApiError } from '../utils/apiError'
import { email, required, strongPassword } from '../utils/validators'

const VALIDATORS = {
  fullName: required('Ingresa tu nombre completo'),
  email,
  password: strongPassword,
  confirmPassword: (value: string, values: { password: string }) =>
    value === values.password ? undefined : 'Las contraseñas no coinciden',
}

const BODIES: { value: ProfessionalBody; label: string }[] = [
  { value: 'CMP', label: 'Colegio Médico del Perú (CMP)' },
  { value: 'CTMP', label: 'Colegio Tecnólogo Médico del Perú (CTMP)' },
  { value: 'CBP', label: 'Colegio de Biólogos del Perú (CBP)' },
  { value: 'CQFP', label: 'Colegio Químico Farmacéutico del Perú (CQFP)' },
]

const ROLES: { value: Role; label: string }[] = [
  { value: 'LAB_TECHNICIAN', label: 'Laboratorio de microbiología' },
  { value: 'EPIDEMIOLOGIST', label: 'Epidemiología / comité PROA o IAAS' },
  { value: 'PHARMACIST', label: 'Farmacia' },
]

type Tab = 'general' | 'professional'

export default function RegisterPage() {
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('general')
  const [submitError, setSubmitError] = useState<string>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [acceptedError, setAcceptedError] = useState<string>()
  const [facilityId, setFacilityId] = useState('')
  const [requestedRole, setRequestedRole] = useState<Role>('LAB_TECHNICIAN')
  const [body, setBody] = useState<ProfessionalBody>('CTMP')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [professionalError, setProfessionalError] = useState<string>()
  const { values, errors, handleChange, handleSubmit, setServerErrors } = useForm(
    { fullName: '', email: '', password: '', confirmPassword: '' },
    VALIDATORS,
  )
  // /facilities es público: la lista de establecimientos se puede ver sin cuenta.
  const facilities = useFetch((signal) => catalogService.facilities(signal), [])

  const onSubmit = handleSubmit(async ({ fullName, email: mail, password }) => {
    setSubmitError(undefined)
    setAcceptedError(undefined)
    setProfessionalError(undefined)
    if (!accepted) {
      setAcceptedError('Para crear la cuenta debes aceptar la política de datos personales')
      return
    }
    const professional = tab === 'professional'
    if (professional && (!facilityId || !/^\d{4,6}$/.test(registrationNumber))) {
      setProfessionalError(!facilityId ? 'Elige tu establecimiento' : 'La colegiatura tiene de 4 a 6 dígitos')
      return
    }
    setIsSubmitting(true)
    try {
      await register({
        fullName,
        email: mail,
        password,
        acceptedDataPolicy: true,
        professional: professional
          ? { facilityId: Number(facilityId), requestedRole, professionalBody: body, registrationNumber }
          : undefined,
      })
      if (professional) {
        showToast('Cuenta creada. Tu solicitud de acceso profesional quedó pendiente de aprobación.', 'success')
      }
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
        <p className="mt-1 text-sm text-slate-500">
          {tab === 'general'
            ? 'Acceso de consulta: mapa, antibiograma y tendencias, sin datos de pacientes.'
            : 'Te registras con acceso de consulta y pides un rol clínico en tu establecimiento.'}
        </p>
      </div>

      <div role="tablist" aria-label="Tipo de cuenta" className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
        {([
          { value: 'general', label: 'Usuario general', icon: UserIcon },
          { value: 'professional', label: 'Profesional de la salud', icon: Stethoscope },
        ] as const).map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={tab === option.value}
            onClick={() => setTab(option.value)}
            className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <option.icon size={16} aria-hidden />
            {option.label}
          </button>
        ))}
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

        {tab === 'professional' && (
          <fieldset className="space-y-4 rounded-lg p-4 ring-1 ring-slate-200">
            <legend className="px-1 text-sm font-semibold">Datos profesionales</legend>
            <SelectField
              label="Establecimiento"
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              options={[
                { value: '', label: facilities.isLoading ? 'Cargando…' : 'Elige…' },
                ...(facilities.data ?? []).map((f) => ({ value: f.id, label: f.name })),
              ]}
            />
            <SelectField
              label="Rol que necesitas"
              value={requestedRole}
              onChange={(e) => setRequestedRole(e.target.value as Role)}
              options={ROLES}
            />
            <SelectField
              label="Colegio profesional"
              value={body}
              onChange={(e) => setBody(e.target.value as ProfessionalBody)}
              options={BODIES}
            />
            <TextField
              label="Número de colegiatura"
              name="registrationNumber"
              inputMode="numeric"
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value.replace(/\D/g, '').slice(0, 6))}
              hint="Se verifica en el buscador público de tu colegio antes de darte el rol"
            />
            {professionalError && <p className="text-sm text-red-600">{professionalError}</p>}
            <p className="text-xs text-slate-500">
              Te enviaremos un enlace para verificar tu correo. Si usas el correo institucional de tu hospital, el acceso
              se aprueba solo al verificarlo; si no, lo aprueba el jefe de tu establecimiento tras confirmar tu
              colegiatura. Mientras tanto, tienes acceso de consulta. Tu colegiatura se guarda cifrada.
            </p>
          </fieldset>
        )}

        <div className="space-y-1">
          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => {
                setAccepted(e.target.checked)
                setAcceptedError(undefined)
              }}
              className="mt-0.5 h-4 w-4 rounded border-slate-300"
            />
            <span>
              Acepto la{' '}
              <Link to="/privacidad" target="_blank" className="font-medium text-brand-600 hover:underline">
                política de tratamiento de datos personales
              </Link>{' '}
              (Ley 29733) y los{' '}
              <Link to="/terminos" target="_blank" className="font-medium text-brand-600 hover:underline">
                términos de uso
              </Link>
              .
            </span>
          </label>
          {acceptedError && <p className="text-sm text-red-600">{acceptedError}</p>}
        </div>

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {tab === 'professional' ? 'Crear cuenta y solicitar acceso' : 'Crear cuenta'}
        </Button>
      </form>
      <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
        <ShieldCheck size={14} aria-hidden /> Conexión cifrada (HTTPS). No pedimos DNI ni datos de pacientes.
      </p>
      <p className="text-center text-xs text-slate-500">
        ¿Representas una clínica u hospital que aún no está en Atlas RAM? Crea tu cuenta y regístralo desde Mi cuenta
        con su RUC y su código IPRESS: el sector (público o privado) lo toma Atlas RAM del padrón RENIPRESS de SUSALUD.
      </p>
      <p className="text-center text-sm text-slate-500">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  )
}
