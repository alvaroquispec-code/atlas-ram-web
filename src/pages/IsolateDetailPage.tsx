import { CopyPlus, FileJson, Plus, RotateCw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AntibiogramEditor, { emptyRowError, toPayload, type EntryRow } from '../components/AntibiogramEditor'
import Breadcrumbs from '../components/Breadcrumbs'
import Alert from '../components/Alert'
import Button from '../components/Button'
import InterpretationBadge from '../components/InterpretationBadge'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { catalogService } from '../services/catalogService'
import { isolateService } from '../services/isolateService'
import { toApiError } from '../utils/apiError'
import { formatDate, formatMic, SPECIMEN_LABELS, WARD_LABELS } from '../utils/labels'
import NotFoundPage from './NotFoundPage'

export default function IsolateDetailPage() {
  const { id } = useParams()
  const isolateId = Number(id)
  const navigate = useNavigate()
  const { hasRole } = useAuth()
  const { showToast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const canRegister = hasRole('ADMIN', 'LAB_TECHNICIAN')
  // Agregar antibióticos que llegan después (todos o ninguno).
  const [adding, setAdding] = useState(false)
  const [newRows, setNewRows] = useState<EntryRow[]>([])
  const [addError, setAddError] = useState<string | null>(null)
  const [isSavingRows, setIsSavingRows] = useState(false)
  const antibiotics = useFetch((signal) => (canRegister ? catalogService.antibiotics(signal) : Promise.resolve([])), [canRegister])

  // Pedimos el aislamiento y sus resultados en paralelo; si sales de la página, se cancelan los dos.
  const { data, error, isLoading, reload } = useFetch(
    (signal) => Promise.all([isolateService.findById(isolateId, signal), isolateService.results(isolateId, signal)]),
    [isolateId],
  )

  if (!Number.isInteger(isolateId) || error?.status === 404) {
    return <NotFoundPage title="Aislamiento no encontrado" message={`No existe un aislamiento con el id ${id}.`} />
  }
  if (isLoading) return <div className="py-16"><Spinner label="Cargando aislamiento" /></div>
  if (error || !data) {
    return (
      <Alert tone="error" action={<Button variant="ghost" onClick={reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
        {error?.message ?? 'No se pudo cargar el aislamiento.'}
      </Alert>
    )
  }

  const [isolate, results] = data
  const resistant = results.filter((r) => r.interpretation === 'RESISTANT').length

  async function saveNewRows() {
    const list = antibiotics.data ?? []
    const problem = newRows.length === 0 ? 'Agrega al menos un antibiótico' : emptyRowError(newRows, list)
    if (problem) {
      setAddError(problem)
      return
    }
    setIsSavingRows(true)
    setAddError(null)
    try {
      await isolateService.addResults(isolate.id, toPayload(newRows))
      showToast(`${newRows.length} antibiótico(s) agregado(s)`, 'success')
      setNewRows([])
      setAdding(false)
      reload()
    } catch (err) {
      setAddError(toApiError(err).message)
    } finally {
      setIsSavingRows(false)
    }
  }

  // Borrar un aislamiento también borra sus resultados y cambia el antibiograma: pedimos confirmación.
  async function handleDelete() {
    if (!window.confirm(`¿Eliminar el aislamiento #${isolate.id} y sus ${results.length} resultados? No se puede deshacer.`)) return
    setIsDeleting(true)
    try {
      await isolateService.remove(isolate.id)
      showToast(`Aislamiento #${isolate.id} eliminado`, 'success')
      navigate('/isolates', { replace: true })
    } catch (err) {
      showToast(toApiError(err).message, 'error')
      setIsDeleting(false)
    }
  }

  // Descarga el JSON FHIR como archivo: es lo que recibiría el sistema del hospital (HIS o LIS).
  async function handleExport() {
    setIsExporting(true)
    try {
      const bundle = await isolateService.fhirBundle(isolate.id)
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/fhir+json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `aislamiento-${isolate.id}-fhir.json`
      link.click()
      URL.revokeObjectURL(url)
      showToast('Exportado en HL7 FHIR R4', 'success')
    } catch (err) {
      showToast(toApiError(err).message, 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Panel', to: '/dashboard' },
          { label: 'Aislamientos', to: '/isolates' },
          { label: `Aislamiento #${isolate.id}` },
        ]}
      />

      <header className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold italic">{isolate.microorganismName}</h1>
          <div className="flex flex-wrap gap-2">
            {canRegister && (
              <Link
                to={`/isolates/new?from=${isolate.id}`}
                title="Mismo paciente, muestra y fecha; otro microorganismo"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
              >
                <CopyPlus size={16} aria-hidden />
                Otro aislamiento de este paciente
              </Link>
            )}
            {hasRole('ADMIN', 'LAB_TECHNICIAN', 'EPIDEMIOLOGIST') && (
              <Button variant="secondary" isLoading={isExporting} onClick={handleExport}
                title="Descarga el resultado en HL7 FHIR R4 con códigos LOINC y SNOMED CT">
                {!isExporting && <FileJson size={16} aria-hidden />}
                Exportar HL7 FHIR
              </Button>
            )}
            {hasRole('ADMIN') && (
              <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
                {!isDeleting && <Trash2 size={16} aria-hidden />}
                Eliminar
              </Button>
            )}
          </div>
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
          <Info label="Fecha de toma" value={formatDate(isolate.collectionDate)} />
          <Info label="Muestra" value={SPECIMEN_LABELS[isolate.specimenType]} />
          <Info label="Servicio" value={isolate.ward ? WARD_LABELS[isolate.ward] : '—'} />
          <Info label="Establecimiento" value={isolate.facilityName} />
          <Info label="Distrito" value={isolate.districtName} />
          <Info label="Edad" value={isolate.patientAge === null ? '—' : `${isolate.patientAge} años`} />
          <Info label="Sexo" value={isolate.patientSex ?? '—'} />
          <Info label="Antibióticos probados" value={String(results.length)} />
          <Info label="Resistente a" value={`${resistant} de ${results.length}`} />
        </dl>
      </header>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Antibiótico</th>
              <th className="px-4 py-3">CIM <span className="normal-case">(µg/mL)</span></th>
              <th className="px-4 py-3">Halo <span className="normal-case">(mm)</span></th>
              <th className="px-4 py-3">Interpretación</th>
              <th className="px-4 py-3">Norma</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {results.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  Este aislamiento aún no tiene resultados de sensibilidad.
                </td>
              </tr>
            )}
            {results.map((result) => (
              <tr key={result.id}>
                <td className="px-4 py-3">
                  {result.antibioticName} <span className="text-slate-400">({result.antibioticCode})</span>
                </td>
                <td className="px-4 py-3 tabular-nums">{formatMic(result.micDisplay, result.micValue) ?? '—'}</td>
                <td className="px-4 py-3">{result.diskDiffusionMm ?? '—'}</td>
                <td className="px-4 py-3">
                  <InterpretationBadge value={result.interpretation} />
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {result.breakpointStandard} {result.breakpointVersion}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canRegister && (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          {!adding ? (
            <Button variant="secondary" onClick={() => setAdding(true)}>
              <Plus size={16} aria-hidden />
              Agregar antibióticos
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700">Agregar antibióticos a este aislamiento</p>
              {addError && <Alert tone="error">{addError}</Alert>}
              <AntibiogramEditor
                antibiotics={antibiotics.data ?? []}
                rows={newRows}
                microorganismId={isolate.microorganismId}
                specimen={isolate.specimenType}
                onChange={(r) => { setNewRows(r); setAddError(null) }}
                excludeCodes={results.map((r) => r.antibioticCode)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setAdding(false); setNewRows([]); setAddError(null) }}>Cancelar</Button>
                <Button isLoading={isSavingRows} onClick={saveNewRows}>Guardar</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value}</dd>
    </div>
  )
}
