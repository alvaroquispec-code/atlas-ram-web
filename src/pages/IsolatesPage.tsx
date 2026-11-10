import { Link, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { isolateService } from '../services/isolateService'
import { formatDate, SPECIMEN_LABELS } from '../utils/labels'

const DEFAULT_SIZE = 20

export default function IsolatesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // La página y el tamaño se leen de la URL: /isolates?page=2&size=50
  const page = Math.max(0, Number(searchParams.get('page') ?? 0))
  const size = Number(searchParams.get('size') ?? DEFAULT_SIZE)

  const { data, error, isLoading, reload } = useFetch(
    (signal) => isolateService.list({ page, size }, signal),
    [page, size],
  )

  const goTo = (nextPage: number, nextSize = size) =>
    setSearchParams({ page: String(nextPage), size: String(nextSize) })

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Aislamientos</h1>
        <p className="text-sm text-slate-500">Muestras registradas por los laboratorios, de la más reciente a la más antigua.</p>
      </header>

      {error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={reload}>Reintentar</Button>}>
          {error.message}
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Microorganismo</th>
                <th className="px-4 py-3">Muestra</th>
                <th className="px-4 py-3">Establecimiento</th>
                <th className="px-4 py-3">Distrito</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12">
                    <Spinner label="Cargando aislamientos" />
                  </td>
                </tr>
              ) : data?.empty ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No hay aislamientos registrados.
                  </td>
                </tr>
              ) : (
                data?.content.map((isolate) => (
                  <tr key={isolate.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(isolate.collectionDate)}</td>
                    <td className="px-4 py-3 italic">{isolate.microorganismName}</td>
                    <td className="px-4 py-3">{SPECIMEN_LABELS[isolate.specimenType]}</td>
                    <td className="px-4 py-3">{isolate.facilityName}</td>
                    <td className="px-4 py-3">{isolate.districtName}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/isolates/${isolate.id}`} className="font-medium text-brand-600 hover:underline">
                        Ver detalle
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          size={size}
          onPageChange={(next) => goTo(next)}
          onSizeChange={(nextSize) => goTo(0, nextSize)}
        />
      )}
    </section>
  )
}