import { useEffect, useMemo, useState } from 'react'
import { Check, Pencil, Plus, RotateCw, Search, X } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import TextField from '../components/TextField'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { useFetch } from '../hooks/useFetch'
import { useForm } from '../hooks/useForm'
import { useToast } from '../hooks/useToast'
import { catalogService } from '../services/catalogService'
import type { Antibiotic, AntibioticInput } from '../types/api'
import { toApiError } from '../utils/apiError'
import { required } from '../utils/validators'

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export default function AntibioticsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const debouncedSearch = useDebouncedValue(search, 300)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { showToast } = useToast()

  const { data, error, isLoading, reload } = useFetch((signal) => catalogService.antibiotics(signal), [])

  // La búsqueda queda en la URL (?q=) para poder compartirla, pero solo cuando el usuario deja de escribir.
  useEffect(() => {
    setSearchParams(debouncedSearch ? { q: debouncedSearch } : {}, { replace: true })
  }, [debouncedSearch, setSearchParams])

  const filtered = useMemo(() => {
    const term = normalize(debouncedSearch.trim())
    if (!data || !term) return data ?? []
    return data.filter((antibiotic) =>
      [antibiotic.code, antibiotic.name, antibiotic.antibioticClass ?? ''].some((field) => normalize(field).includes(term)),
    )
  }, [data, debouncedSearch])

  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Panel', to: '/dashboard' }, { label: 'Antibióticos' }]} />
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Antibióticos</h1>
          <p className="text-sm text-slate-500">Catálogo usado en los antibiogramas. Solo los administradores pueden editarlo.</p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} disabled={editingId !== null}>
            <Plus size={16} aria-hidden />
            Nuevo antibiótico
          </Button>
        )}
      </header>

      {isCreating && (
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-brand-200">
          <h2 className="mb-3 font-semibold">Nuevo antibiótico</h2>
          <AntibioticForm
            initial={{ code: '', name: '', antibioticClass: '' }}
            submitLabel="Crear"
            onCancel={() => setIsCreating(false)}
            onSubmit={async (input) => {
              await catalogService.createAntibiotic(input)
              showToast(`Se creó ${input.name}`, 'success')
              setIsCreating(false)
              reload()
            }}
          />
        </div>
      )}

      <label className="relative block max-w-sm">
        <span className="sr-only">Buscar antibiótico</span>
        <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por código, nombre o clase"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>

      {error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {error.message}
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Clase</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-12">
                    <Spinner label="Cargando antibióticos" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    No hay antibióticos que coincidan con “{debouncedSearch}”.{' '}
                    <button type="button" className="font-medium text-brand-700 hover:underline" onClick={() => setSearch('')}>
                      Limpiar búsqueda
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((antibiotic) =>
                  editingId === antibiotic.id ? (
                    <EditRow
                      key={antibiotic.id}
                      antibiotic={antibiotic}
                      onCancel={() => setEditingId(null)}
                      onSaved={() => {
                        setEditingId(null)
                        reload()
                      }}
                    />
                  ) : (
                    <tr key={antibiotic.id}>
                      <td className="px-4 py-3 font-mono text-slate-600">{antibiotic.code}</td>
                      <td className="px-4 py-3">{antibiotic.name}</td>
                      <td className="px-4 py-3 text-slate-500">{antibiotic.antibioticClass || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="secondary" onClick={() => setEditingId(antibiotic.id)} disabled={editingId !== null}>
                          <Pencil size={16} aria-hidden />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <p className="text-sm text-slate-500">
          Mostrando {filtered.length} de {data.length} antibióticos
        </p>
      )}
    </section>
  )
}

interface EditRowProps {
  antibiotic: Antibiotic
  onCancel: () => void
  onSaved: () => void
}

function EditRow({ antibiotic, onCancel, onSaved }: EditRowProps) {
  const { showToast } = useToast()

  // PUT reemplaza el recurso completo: mandamos los tres campos aunque solo cambie uno.
  async function update(input: AntibioticInput) {
    await catalogService.updateAntibiotic(antibiotic.id, input)
    showToast(`Se actualizó ${input.name}`, 'success')
    onSaved()
  }

  return (
    <tr className="bg-brand-50/40">
      <td colSpan={4} className="px-4 py-4">
        <AntibioticForm
          initial={{ code: antibiotic.code, name: antibiotic.name, antibioticClass: antibiotic.antibioticClass ?? '' }}
          submitLabel="Guardar"
          onSubmit={update}
          onCancel={onCancel}
        />
      </td>
    </tr>
  )
}

const VALIDATORS = {
  code: required('El código es obligatorio'),
  name: required('El nombre es obligatorio'),
}

interface AntibioticFormProps {
  initial: AntibioticInput
  submitLabel: string
  onSubmit: (input: AntibioticInput) => Promise<void>
  onCancel: () => void
}

/** Formulario compartido por la creación (POST) y la edición (PUT). */
function AntibioticForm({ initial, submitLabel, onSubmit, onCancel }: AntibioticFormProps) {
  const { showToast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const { values, errors, handleChange, handleSubmit, setServerErrors } = useForm<AntibioticInput & Record<string, string>>(
    { ...initial },
    VALIDATORS,
  )

  const save = handleSubmit(async (input) => {
    setIsSaving(true)
    try {
      await onSubmit({
        code: input.code.trim().toUpperCase(),
        name: input.name.trim(),
        antibioticClass: input.antibioticClass.trim(),
      })
    } catch (err) {
      // 409: el código ya existe. Lo mostramos en el campo, no como aviso general.
      const apiError = toApiError(err)
      if (apiError.status === 409) setServerErrors({ code: apiError.message })
      else showToast(apiError.message, 'error')
      setIsSaving(false)
    }
  })

  return (
    <form onSubmit={save} className="grid items-start gap-3 sm:grid-cols-[8rem_1fr_1fr_auto]" noValidate>
      <TextField label="Código" name="code" value={values.code} onChange={handleChange} error={errors.code} placeholder="CRO" />
      <TextField label="Nombre" name="name" value={values.name} onChange={handleChange} error={errors.name} placeholder="Ceftriaxona" />
      <TextField
        label="Clase"
        name="antibioticClass"
        value={values.antibioticClass}
        onChange={handleChange}
        hint="Opcional, por ejemplo “Cefalosporina”"
      />
      <div className="flex gap-2 sm:pt-6">
        <Button type="submit" isLoading={isSaving}>
          {!isSaving && <Check size={16} aria-hidden />}
          {submitLabel}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
          <X size={16} aria-hidden />
          Cancelar
        </Button>
      </div>
    </form>
  )
}
