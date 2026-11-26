import { Save } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import AntibiogramEditor, { emptyRowError, toPayload, type EntryRow } from '../components/AntibiogramEditor'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { catalogService, microorganismLabel } from '../services/catalogService'
import { isolateService } from '../services/isolateService'
import { uploadService } from '../services/uploadService'
import type { DataOrigin, Specimen, Ward } from '../types/api'
import { toApiError } from '../utils/apiError'
import { ORIGIN_LABELS, SPECIMEN_LABELS, WARD_LABELS } from '../utils/labels'

// Fecha local (no UTC): en Lima, después de las 19:00 la fecha UTC ya es la de mañana.
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

/**
 * Registro de UN paciente con su antibiograma, para cuando el laboratorio no tiene una exportación (o es un caso
 * puntual). La carga masiva sigue en /uploads. Sexo, edad y servicio son obligatorios: son variables mínimas del
 * INS para WHONET-INS. El aislamiento y sus resultados se guardan juntos: nunca queda un aislamiento vacío.
 */
export default function NewIsolatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  // ?from=ID: otro aislamiento del mismo paciente; el formulario se llena con sus datos.
  const [searchParams] = useSearchParams()
  const fromId = Number(searchParams.get('from')) || null
  const catalogs = useFetch(
    (signal) =>
      Promise.all([uploadService.myFacilities(signal), catalogService.microorganisms(signal), catalogService.antibiotics(signal)]),
    [],
  )
  const [facilities, microorganisms, antibiotics] = catalogs.data ?? [[], [], []]

  const [form, setForm] = useState({
    collectionDate: today(),
    specimenType: '' as Specimen | '',
    microorganismId: '',
    facilityId: '',
    patientAge: '',
    patientSex: '' as 'M' | 'F' | '',
    ward: '' as Ward | '',
    dataOrigin: 'SYNTHETIC' as DataOrigin,
    patientId: '',
  })
  const [rows, setRows] = useState<EntryRow[]>([])

  useEffect(() => {
    if (!fromId) return
    const controller = new AbortController()
    isolateService
      .findById(fromId, controller.signal)
      .then((i) =>
        setForm((f) => ({
          ...f,
          collectionDate: i.collectionDate,
          specimenType: i.specimenType,
          facilityId: i.facilityId ? String(i.facilityId) : f.facilityId,
          patientAge: i.patientAge === null ? '' : String(i.patientAge),
          patientSex: i.patientSex === 'M' || i.patientSex === 'F' ? i.patientSex : '',
          ward: i.ward ?? '',
          dataOrigin: i.dataOrigin ?? f.dataOrigin,
        })),
      )
      .catch(() => undefined)
    return () => controller.abort()
  }, [fromId])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const facilityId = form.facilityId || String(facilities[0]?.id ?? '')
  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.collectionDate || form.collectionDate > today()) e.collectionDate = 'Fecha de toma inválida o futura'
    if (!form.specimenType) e.specimenType = 'Elige el tipo de muestra'
    if (!form.microorganismId) e.microorganismId = 'Elige el microorganismo'
    if (!facilityId) e.facilityId = 'Elige el establecimiento'
    const age = Number(form.patientAge)
    if (form.patientAge.trim() === '' || !Number.isInteger(age) || age < 0 || age > 120) e.patientAge = 'Edad entre 0 y 120'
    if (!form.patientSex) e.patientSex = 'Elige el sexo'
    if (!form.ward) e.ward = 'Elige el servicio'
    if (rows.length === 0) e.results = 'Agrega al menos un antibiótico del antibiograma'
    else {
      const empty = emptyRowError(rows, antibiotics)
      if (empty) e.results = empty
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    if (!validate()) return
    setIsSaving(true)
    try {
      const created = await isolateService.create({
        collectionDate: form.collectionDate,
        specimenType: form.specimenType as Specimen,
        microorganismId: Number(form.microorganismId),
        facilityId: Number(facilityId),
        patientAge: Number(form.patientAge),
        patientSex: form.patientSex as 'M' | 'F',
        ward: form.ward as Ward,
        dataOrigin: form.dataOrigin,
        results: toPayload(rows),
        patientId: form.patientId.trim() || undefined,
        samePatientAsIsolateId: fromId ?? undefined,
      })
      showToast(`Aislamiento #${created.id} registrado`, 'success')
      navigate(`/isolates/${created.id}`)
    } catch (err) {
      const error = toApiError(err)
      if (error.fieldErrors) setErrors(error.fieldErrors)
      setFormError(error.message)
      setIsSaving(false)
    }
  }

  if (catalogs.isLoading) return <div className="py-16"><Spinner label="Cargando catálogos" /></div>
  if (catalogs.error) return <Alert tone="error">{catalogs.error.message}</Alert>

  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Aislamientos', to: '/isolates' }, { label: 'Registrar' }]} />
      <header>
        <h1 className="text-2xl font-semibold">{fromId ? `Otro aislamiento del paciente del #${fromId}` : 'Registrar un paciente'}</h1>
        <p className="text-sm text-slate-500">
          Un aislamiento con su antibiograma. Para muchos pacientes a la vez, usa{' '}
          <Link to="/uploads" className="text-brand-600 underline">la carga de archivos</Link> (CSV o WHONET).
        </p>
      </header>

      {fromId && (
        <Alert tone="info">
          Se copiaron los datos del aislamiento #{fromId}. Elige el microorganismo y su antibiograma; queda vinculado al
          mismo paciente (CLSI M39 cuenta un solo primer aislamiento por paciente y especie).
        </Alert>
      )}
      {formError && <Alert tone="error">{formError}</Alert>}

      <form onSubmit={submit} className="space-y-6" noValidate>
        <fieldset className="grid grid-cols-1 gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
          <legend className="px-1 text-sm font-semibold text-slate-700">Paciente y muestra</legend>
          <TextField label="Fecha de toma" type="date" max={today()} value={form.collectionDate}
            onChange={(e) => set('collectionDate')(e.target.value)} error={errors.collectionDate} />
          <Select label="Tipo de muestra" value={form.specimenType} onChange={set('specimenType')} error={errors.specimenType}
            options={(Object.keys(SPECIMEN_LABELS) as Specimen[]).map((s) => ({ value: s, label: SPECIMEN_LABELS[s] }))} />
          <Select label="Microorganismo" value={form.microorganismId} onChange={set('microorganismId')} error={errors.microorganismId}
            options={microorganisms.map((m) => ({ value: m.id, label: microorganismLabel(m) }))} />
          <Select label="Establecimiento" value={facilityId} onChange={set('facilityId')} error={errors.facilityId} placeholder={false}
            options={facilities.map((f) => ({ value: f.id, label: f.name }))} />
          <TextField label="Edad (años)" inputMode="numeric" value={form.patientAge}
            onChange={(e) => set('patientAge')(e.target.value)} error={errors.patientAge} />
          <Select label="Sexo" value={form.patientSex} onChange={set('patientSex')} error={errors.patientSex}
            options={[{ value: 'F', label: 'Femenino' }, { value: 'M', label: 'Masculino' }]} />
          <Select label="Servicio" value={form.ward} onChange={set('ward')} error={errors.ward}
            options={(Object.keys(WARD_LABELS) as Ward[]).map((w) => ({ value: w, label: WARD_LABELS[w] }))} />
          <Select label="Procedencia" value={form.dataOrigin} onChange={set('dataOrigin')} placeholder={false}
            options={(['SYNTHETIC', 'REAL'] as DataOrigin[]).map((o) => ({ value: o, label: ORIGIN_LABELS[o] }))} />
          {!fromId && (
            <TextField label="Historia clínica o DNI (opcional)" value={form.patientId} autoComplete="off"
              onChange={(e) => set('patientId')(e.target.value)} error={errors.patientId}
              hint="No se guarda: solo un seudónimo, para contar un aislamiento por paciente" />
          )}
        </fieldset>

        <fieldset className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <legend className="px-1 text-sm font-semibold text-slate-700">Antibiograma</legend>
          <p className="mb-3 text-xs text-slate-500">
            Agrega solo los antibióticos probados. Elige ≤, = o ≥ y escribe la CIM como la informa el equipo; se
            interpreta con el punto de corte CLSI vigente. Usa el halo solo si fue difusión en disco, y la lectura S, I o R
            del laboratorio cuando la CIM o el halo no basten.
          </p>
          {errors.results && <p className="mb-2 text-sm text-red-600">{errors.results}</p>}
          <AntibiogramEditor antibiotics={antibiotics} rows={rows} onChange={(r) => { setRows(r); setErrors((e) => ({ ...e, results: '' })) }} />
        </fieldset>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isSaving}>
            <Save size={16} aria-hidden />
            Registrar aislamiento
          </Button>
        </div>
      </form>
    </section>
  )
}

/** Select con opción vacía "Elige…" y mensaje de error debajo. */
function Select({ label, value, onChange, options, error, placeholder = true }: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string | number; label: string }[]
  error?: string
  placeholder?: boolean
}) {
  return (
    <div>
      <SelectField label={label} value={value} onChange={(e) => onChange(e.target.value)}
        options={placeholder ? [{ value: '', label: 'Elige…' }, ...options] : options} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
