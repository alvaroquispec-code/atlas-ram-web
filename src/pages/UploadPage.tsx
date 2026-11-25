import { Upload } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { uploadService } from '../services/uploadService'
import type { DataCompleteness, DataOrigin, DataUpload } from '../types/api'
import { toApiError } from '../utils/apiError'
import { ORIGIN_LABELS } from '../utils/labels'

const FINISHED = ['COMPLETED', 'FAILED', 'REVERTED']

export default function UploadPage() {
  const facilities = useFetch((signal) => uploadService.myFacilities(signal), [])
  const [facilityId, setFacilityId] = useState('')
  const [origin, setOrigin] = useState<DataOrigin>('SYNTHETIC')
  const [file, setFile] = useState<File | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [upload, setUpload] = useState<DataUpload | null>(null)

  const selectedFacility = facilityId || String(facilities.data?.[0]?.id ?? '')

  // Mientras la carga se procesa en segundo plano, se consulta su estado cada segundo y medio.
  useEffect(() => {
    if (!upload || FINISHED.includes(upload.status)) return
    const timer = setTimeout(async () => {
      try {
        setUpload(await uploadService.get(upload.id))
      } catch (e) {
        setError(toApiError(e).message)
      }
    }, 1500)
    return () => clearTimeout(timer)
  }, [upload])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!file || !selectedFacility) return
    setIsSending(true)
    setError(null)
    setUpload(null)
    try {
      setUpload(await uploadService.upload(file, Number(selectedFacility), origin))
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setIsSending(false)
    }
  }

  const errors = upload?.errorLog?.split('\n').filter(Boolean) ?? []

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Cargar resultados</h1>
        <p className="text-sm text-slate-500">
          Sube el archivo que exporta tu laboratorio: el CSV de Atlas RAM o la exportación de WHONET (una columna por
          antibiótico), que se reconoce sola. Cada fila con errores se informa sin detener la carga.
        </p>
      </header>

      <form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2">
        <SelectField
          label="Establecimiento"
          value={selectedFacility}
          onChange={(e) => setFacilityId(e.target.value)}
          disabled={facilities.isLoading}
          options={(facilities.data ?? []).map((x) => ({ value: x.id, label: x.name }))}
        />
        <SelectField
          label="Procedencia de los datos"
          value={origin}
          onChange={(e) => setOrigin(e.target.value as DataOrigin)}
          options={[
            { value: 'SYNTHETIC', label: ORIGIN_LABELS.SYNTHETIC },
            { value: 'REAL', label: ORIGIN_LABELS.REAL },
          ]}
        />
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label htmlFor="file" className="text-sm font-medium text-slate-700">Archivo (.csv o .txt, máximo 20 MB)</label>
          <input
            id="file"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
          />
        </div>
        <p className="text-xs text-slate-500 sm:col-span-2">
          Marca «Reales» solo si son resultados de un laboratorio. Por defecto el sistema nunca presume que un dato es
          real. El identificador del paciente se guarda solo como seudónimo.
        </p>
        <div className="sm:col-span-2">
          <Button type="submit" isLoading={isSending} disabled={!file || !selectedFacility}>
            <Upload size={16} aria-hidden />
            Subir archivo
          </Button>
        </div>
      </form>

      {error && <Alert tone="error">{error}</Alert>}

      {upload && (
        <div className="space-y-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium">
              Carga #{upload.id} · {upload.fileName}
            </p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">{upload.status}</span>
          </div>
          {!FINISHED.includes(upload.status) ? (
            <Spinner label="Procesando en segundo plano" />
          ) : (
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Stat label="Filas" value={upload.totalRows} />
              <Stat label="Cargadas" value={upload.processedRows} />
              <Stat label="Con errores" value={upload.failedRows} />
              <Stat label="Procedencia" value={upload.dataOrigin === 'REAL' ? 'Real' : 'Sintética'} />
            </dl>
          )}
          {FINISHED.includes(upload.status) && upload.completeness && upload.completeness.isolates > 0 && (
            <Completeness c={upload.completeness} />
          )}
          {errors.length > 0 && (
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700">Filas con errores</p>
              <ul className="max-h-64 space-y-1 overflow-y-auto rounded-lg bg-slate-50 p-3 font-mono text-xs">
                {errors.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/**
 * Sexo, edad y servicio son variables mínimas obligatorias del INS para WHONET-INS. La carga se acepta aunque
 * falten, pero se muestra cuánto falta para que el laboratorio lo corrija en su exportación.
 */
function Completeness({ c }: { c: DataCompleteness }) {
  const items = [
    { label: 'Sexo', value: c.sexPercentage },
    { label: 'Edad', value: c.agePercentage },
    { label: 'Servicio', value: c.wardPercentage },
  ]
  const incomplete = items.some((i) => i.value < 100)
  return (
    <div className={`rounded-lg p-3 text-sm ring-1 ${incomplete ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-emerald-50 text-emerald-900 ring-emerald-200'}`}>
      <p className="font-medium">Variables mínimas obligatorias del INS · {c.isolates} aislamientos</p>
      <p className="mt-1">
        {items.map((i) => `${i.label} ${i.value.toFixed(0)} %`).join(' · ')}
      </p>
      {incomplete && (
        <p className="mt-1 text-xs">
          Los datos se cargaron, pero el INS exige sexo, edad y servicio para la vigilancia nacional (WHONET-INS).
          Agrega las columnas <code>sexo</code>, <code>edad</code> y <code>servicio</code> en la próxima exportación.
        </p>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-semibold">{value ?? '—'}</dd>
    </div>
  )
}
