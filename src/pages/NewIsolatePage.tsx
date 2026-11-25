import { Save } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert'
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
import type { DataOrigin, Interpretation, Specimen, Ward } from '../types/api'
import { toApiError } from '../utils/apiError'
import { INTERPRETATION_LABELS, ORIGIN_LABELS, SPECIMEN_LABELS, WARD_LABELS } from '../utils/labels'

interface ResultRow {
  mic: string
  diskMm: string
  reported: Interpretation | ''
}

const EMPTY_ROW: ResultRow = { mic: '', diskMm: '', reported: '' }
const today = () => new Date().toISOString().slice(0, 10)
const filled = (r: ResultRow) => r.mic.trim() !== '' || r.diskMm.trim() !== '' || r.reported !== ''

/**
 * Registro de UN paciente con su antibiograma, para cuando el laboratorio no tiene una exportación (o es un caso
 * puntual). La carga masiva sigue en /uploads. Sexo, edad y servicio son obligatorios: son variables mínimas del
 * INS para WHONET-INS. El aislamiento y sus resultados se guardan juntos: nunca queda un aislamiento vacío.
 */
export default function NewIsolatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
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
  })
  const [rows, setRows] = useState<Record<number, ResultRow>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const facilityId = form.facilityId || String(facilities[0]?.id ?? '')
  const set = (key: keyof typeof form) => (value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: '' }))
  }
  const setRow = (id: number, patch: Partial<ResultRow>) =>
    setRows((r) => ({ ...r, [id]: { ...(r[id] ?? EMPTY_ROW), ...patch } }))
  const filledCount = useMemo(() => Object.values(rows).filter(filled).length, [rows])

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
    if (filledCount === 0) e.results = 'Registra al menos un antibiótico del antibiograma'
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
        results: Object.entries(rows)
          .filter(([, r]) => filled(r))
          .map(([id, r]) => ({
            antibioticId: Number(id),
            mic: r.mic.trim() || undefined,
            diskMm: r.diskMm.trim() ? Number(r.diskMm) : undefined,
            reportedInterpretation: r.reported || undefined,
          })),
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
        <h1 className="text-2xl font-semibold">Registrar un paciente</h1>
        <p className="text-sm text-slate-500">
          Un aislamiento con su antibiograma. Para muchos pacientes a la vez, usa{' '}
          <Link to="/uploads" className="text-brand-600 underline">la carga de archivos</Link> (CSV o WHONET).
        </p>
      </header>

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
        </fieldset>

        <fieldset className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <legend className="px-1 text-sm font-semibold text-slate-700">Antibiograma</legend>
          <p className="mb-3 text-xs text-slate-500">
            Completa solo los antibióticos probados. La CIM se escribe como la informa el equipo (≤0,25 · 2 · ≥16) y se
            interpreta con el punto de corte CLSI vigente; la interpretación del laboratorio solo se usa si la CIM o el
            halo no bastan. Usa CIM o halo (difusión en disco), no ambos. {filledCount} con resultado.
          </p>
          {errors.results && <p className="mb-2 text-sm text-red-600">{errors.results}</p>}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2 pr-4">Antibiótico</th>
                  <th className="py-2 pr-4">CIM <span className="normal-case">(µg/mL)</span></th>
                  <th className="py-2 pr-4" title="Difusión en disco: diámetro de la zona de inhibición">Halo <span className="normal-case">(mm, disco)</span></th>
                  <th className="py-2">Interpretación del laboratorio</th>
                </tr>
              </thead>
              <tbody>
                {antibiotics.map((a) => {
                  const r = rows[a.id] ?? EMPTY_ROW
                  return (
                    <tr key={a.id} className={`border-t border-slate-100 ${filled(r) ? 'bg-brand-50/40' : ''}`}>
                      <td className="py-1.5 pr-4">{a.name} <span className="text-xs text-slate-400">{a.code}</span></td>
                      <td className="py-1.5 pr-4">
                        <input aria-label={`CIM de ${a.name}`} value={r.mic} placeholder="—"
                          onChange={(e) => setRow(a.id, { mic: e.target.value })}
                          className="w-28 rounded-md border border-slate-300 px-2 py-1" />
                      </td>
                      <td className="py-1.5 pr-4">
                        <input aria-label={`Halo de ${a.name}`} inputMode="numeric" value={r.diskMm} placeholder="—"
                          onChange={(e) => setRow(a.id, { diskMm: e.target.value })}
                          className="w-20 rounded-md border border-slate-300 px-2 py-1" />
                      </td>
                      <td className="py-1.5">
                        <select aria-label={`Interpretación de ${a.name}`} value={r.reported}
                          onChange={(e) => setRow(a.id, { reported: e.target.value as Interpretation | '' })}
                          className="rounded-md border border-slate-300 bg-white px-2 py-1">
                          <option value="">—</option>
                          {(Object.keys(INTERPRETATION_LABELS) as Interpretation[]).map((i) => (
                            <option key={i} value={i}>{INTERPRETATION_LABELS[i]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
