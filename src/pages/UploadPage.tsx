import { Upload } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import Alert from '../components/Alert'
import Button from '../components/Button'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { uploadService } from '../services/uploadService'
import type { DataOrigin, DataUpload } from '../types/api'
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

function Stat({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-semibold">{value ?? '—'}</dd>
    </div>
  )
}
