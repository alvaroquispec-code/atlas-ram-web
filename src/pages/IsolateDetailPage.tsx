import { Link, useParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import InterpretationBadge from '../components/InterpretationBadge'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { isolateService } from '../services/isolateService'
import { formatDate, SPECIMEN_LABELS } from '../utils/labels'
import NotFoundPage from './NotFoundPage'

export default function IsolateDetailPage() {
  const { id } = useParams()
  const isolateId = Number(id)

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
      <Alert tone="error" action={<Button variant="ghost" onClick={reload}>Reintentar</Button>}>
        {error?.message ?? 'No se pudo cargar el aislamiento.'}
      </Alert>
    )
  }

  const [isolate, results] = data
  const resistant = results.filter((r) => r.interpretation === 'RESISTANT').length

  return (
    <section className="space-y-6">
      <Link to="/isolates" className="text-sm font-medium text-brand-600 hover:underline">
        ← Volver a aislamientos
      </Link>

      <header className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-semibold italic">{isolate.microorganismName}</h1>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-4">
          <Info label="Fecha de toma" value={formatDate(isolate.collectionDate)} />
          <Info label="Muestra" value={SPECIMEN_LABELS[isolate.specimenType]} />
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
            {results.map((result) => (
              <tr key={result.id}>
                <td className="px-4 py-3">
                  {result.antibioticName} <span className="text-slate-400">({result.antibioticCode})</span>
                </td>
                <td className="px-4 py-3">{result.micValue ?? '—'}</td>
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