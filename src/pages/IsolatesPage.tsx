import { useState, type FormEvent } from 'react'
import { ArrowRight, FilterX, Plus, RotateCw } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import SelectField from '../components/SelectField'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { catalogService, microorganismLabel } from '../services/catalogService'
import { isolateService, type IsolateSort } from '../services/isolateService'
import type { Specimen } from '../types/api'
import { formatDate, SPECIMEN_LABELS } from '../utils/labels'

const DEFAULT_SIZE = 25
const DEFAULT_SORT: IsolateSort = 'collectionDate,desc'
const FILTER_KEYS = ['facilityId', 'microorganismId', 'specimen'] as const

export default function IsolatesPage() {
  const { hasRole } = useAuth()
  const canRegister = hasRole('ADMIN', 'LAB_TECHNICIAN')
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  // Todo el estado del listado vive en la URL: /isolates?page=2&size=50&microorganismId=3&sort=collectionDate,asc
  const page = Math.max(0, Number(searchParams.get('page') ?? 0))
  const size = Number(searchParams.get('size') ?? DEFAULT_SIZE)
  const facilityId = searchParams.get('facilityId') ?? ''
  const microorganismId = searchParams.get('microorganismId') ?? ''
  const specimen = (searchParams.get('specimen') ?? '') as Specimen | ''
  const sort = (searchParams.get('sort') ?? DEFAULT_SORT) as IsolateSort
  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key))

  const [goToId, setGoToId] = useState('')
  const [goToError, setGoToError] = useState<string>()

  const facilities = useFetch((signal) => catalogService.facilities(signal), [])
  const microorganisms = useFetch((signal) => catalogService.microorganisms(signal), [])
  const { data, error, isLoading, reload } = useFetch(
    (signal) =>
      isolateService.list(
        {
          page,
          size,
          sort,
          facilityId: facilityId ? Number(facilityId) : undefined,
          microorganismId: microorganismId ? Number(microorganismId) : undefined,
          specimen: specimen || undefined,
        },
        signal,
      ),
    [page, size, sort, facilityId, microorganismId, specimen],
  )

  // Cambiar un filtro o el orden vuelve a la primera página.
  function update(changes: Record<string, string>, resetPage = true) {
    const next = new URLSearchParams(searchParams)
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    if (resetPage) next.set('page', '0')
    setSearchParams(next)
  }

  function clearFilters() {
    update(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])))
  }

  function handleGoTo(event: FormEvent) {
    event.preventDefault()
    const id = Number(goToId.trim().replace(/^#/, ''))
    if (!Number.isInteger(id) || id <= 0) {
      setGoToError('Escribe un número de aislamiento válido')
      return
    }
    navigate(`/isolates/${id}`)
  }

  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Panel', to: '/dashboard' }, { label: 'Aislamientos' }]} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Aislamientos</h1>
          <p className="text-sm text-slate-500">Muestras registradas por los laboratorios.</p>
          {canRegister && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/isolates/new" className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700">
                <Plus size={16} aria-hidden />
                Registrar un paciente
              </Link>
              <Link to="/uploads" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50">
                Cargar archivo (CSV o WHONET)
              </Link>
            </div>
          )}
        </div>
        <form onSubmit={handleGoTo} className="flex flex-col gap-1" noValidate>
          <label htmlFor="go-to-id" className="text-sm font-medium text-slate-700">
            Ir al aislamiento
          </label>
          <div className="flex gap-2">
            <input
              id="go-to-id"
              inputMode="numeric"
              placeholder="N.º, por ejemplo 1024"
              value={goToId}
              onChange={(e) => {
                setGoToId(e.target.value)
                setGoToError(undefined)
              }}
              aria-invalid={!!goToError}
              aria-describedby={goToError ? 'go-to-id-error' : undefined}
              className={`w-48 rounded-lg border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 ${
                goToError ? 'border-red-400 focus:ring-red-100' : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
              }`}
            />
            <Button type="submit" variant="secondary" aria-label="Ir al aislamiento" title="Abrir el detalle de ese número">
              <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
          {goToError && (
            <p id="go-to-id-error" className="text-xs text-red-600">
              {goToError}
            </p>
          )}
        </form>
      </header>

      <div className="grid grid-cols-1 gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
        <SelectField
          label="Establecimiento"
          value={facilityId}
          disabled={facilities.isLoading}
          onChange={(e) => update({ facilityId: e.target.value })}
          options={[
            { value: '', label: 'Todos' },
            ...(facilities.data ?? []).map((f) => ({ value: f.id, label: f.name })),
          ]}
        />
        <SelectField
          label="Microorganismo"
          value={microorganismId}
          disabled={microorganisms.isLoading}
          onChange={(e) => update({ microorganismId: e.target.value })}
          options={[
            { value: '', label: 'Todos' },
            ...(microorganisms.data ?? []).map((m) => ({ value: m.id, label: microorganismLabel(m) })),
          ]}
        />
        <SelectField
          label="Tipo de muestra"
          value={specimen}
          onChange={(e) => update({ specimen: e.target.value })}
          options={[
            { value: '', label: 'Todas' },
            ...Object.entries(SPECIMEN_LABELS).map(([value, label]) => ({ value, label })),
          ]}
        />
        <SelectField
          label="Orden"
          value={sort}
          onChange={(e) => update({ sort: e.target.value })}
          options={[
            { value: 'collectionDate,desc', label: 'Más recientes' },
            { value: 'collectionDate,asc', label: 'Más antiguos' },
          ]}
        />
        <Button variant="ghost" onClick={clearFilters} disabled={!hasFilters} className="justify-self-start">
          <FilterX size={16} aria-hidden />
          Limpiar
        </Button>
      </div>

      {error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {error.message}
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">N.º</th>
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
                  <td colSpan={7} className="py-12">
                    <Spinner label="Cargando aislamientos" />
                  </td>
                </tr>
              ) : data?.empty ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {hasFilters ? (
                      <>
                        Ningún aislamiento coincide con estos filtros.{' '}
                        <button type="button" className="font-medium text-brand-700 hover:underline" onClick={clearFilters}>
                          Limpiar filtros
                        </button>
                      </>
                    ) : (
                      'No hay aislamientos registrados.'
                    )}
                  </td>
                </tr>
              ) : (
                data?.content.map((isolate) => (
                  <tr key={isolate.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-slate-500">#{isolate.id}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(isolate.collectionDate)}</td>
                    <td className="px-4 py-3 italic">{isolate.microorganismName}</td>
                    <td className="px-4 py-3">{SPECIMEN_LABELS[isolate.specimenType]}</td>
                    <td className="px-4 py-3">{isolate.facilityName}</td>
                    <td className="px-4 py-3">{isolate.districtName ?? '—'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
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
          onPageChange={(next) => update({ page: String(next) }, false)}
          onSizeChange={(nextSize) => update({ size: String(nextSize) })}
        />
      )}
    </section>
  )
}
