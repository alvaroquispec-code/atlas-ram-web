import { Plus, X } from 'lucide-react'
import type { Antibiotic, Interpretation } from '../types/api'

export type MicQualifierInput = '<=' | '=' | '>='

/** Un antibiótico del antibiograma mientras se escribe. */
export interface EntryRow {
  antibioticId: number
  qualifier: MicQualifierInput
  value: string
  diskMm: string
  reported: Interpretation | ''
}

const QUALIFIERS: { value: MicQualifierInput; label: string; title: string }[] = [
  { value: '<=', label: '≤', title: 'Menor o igual (extremo inferior del panel)' },
  { value: '=', label: '=', title: 'Valor exacto' },
  { value: '>=', label: '≥', title: 'Mayor o igual (extremo superior del panel)' },
]
const READINGS: { value: Interpretation; label: string; title: string }[] = [
  { value: 'SUSCEPTIBLE', label: 'S', title: 'Sensible' },
  { value: 'INTERMEDIATE', label: 'I', title: 'Intermedio' },
  { value: 'RESISTANT', label: 'R', title: 'Resistente' },
]

export const newRow = (antibioticId: number): EntryRow => ({ antibioticId, qualifier: '=', value: '', diskMm: '', reported: '' })
export const isFilled = (r: EntryRow) => r.value.trim() !== '' || r.diskMm.trim() !== '' || r.reported !== ''

/** Lo que espera el servidor: la CIM como texto con su calificador ("<=0.25", ">=16", "2"). */
export function toPayload(rows: EntryRow[]) {
  return rows.map((r) => ({
    antibioticId: r.antibioticId,
    mic: r.value.trim() ? `${r.qualifier === '=' ? '' : r.qualifier}${r.value.trim().replace(',', '.')}` : undefined,
    diskMm: r.diskMm.trim() ? Number(r.diskMm) : undefined,
    reportedInterpretation: r.reported || undefined,
  }))
}

/** Mensaje si alguna fila agregada quedó vacía (sin CIM, halo ni lectura). */
export function emptyRowError(rows: EntryRow[], antibiotics: Antibiotic[]) {
  const empty = rows.find((r) => !isFilled(r))
  if (!empty) return null
  const name = antibiotics.find((a) => a.id === empty.antibioticId)?.name ?? 'Un antibiótico'
  return `${name}: escribe la CIM, el halo o marca S, I o R (o quítalo)`
}

interface Props {
  antibiotics: Antibiotic[]
  rows: EntryRow[]
  onChange: (rows: EntryRow[]) => void
  /** Códigos que el aislamiento ya tiene: no se ofrecen. */
  excludeCodes?: string[]
}

/**
 * Antibiograma de un paciente: se agregan solo los antibióticos probados. El calificador de la CIM se elige con
 * tres botones (≤ = ≥) en vez de escribir "<=": menos toques, se ve siempre lo elegido y el número solo admite
 * dígitos. "> 16" equivale a "≥ 32" (las diluciones se duplican), así que tres opciones bastan.
 */
export default function AntibiogramEditor({ antibiotics, rows, onChange, excludeCodes = [] }: Props) {
  const used = new Set(rows.map((r) => r.antibioticId))
  const available = antibiotics.filter((a) => !used.has(a.id) && !excludeCodes.includes(a.code))
  const update = (id: number, patch: Partial<EntryRow>) =>
    onChange(rows.map((r) => (r.antibioticId === id ? { ...r, ...patch } : r)))
  const name = (id: number) => antibiotics.find((a) => a.id === id)

  return (
    <div className="space-y-3">
      {rows.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
          {rows.map((r) => {
            const a = name(r.antibioticId)
            return (
              <li key={r.antibioticId} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
                <span className="w-48 font-medium">
                  {a?.name} <span className="text-xs font-normal text-slate-400">{a?.code}</span>
                </span>
                <div className="flex items-center gap-1" aria-label={`CIM de ${a?.name}`}>
                  <Segmented options={QUALIFIERS} value={r.qualifier} onSelect={(q) => update(r.antibioticId, { qualifier: q })} />
                  <input
                    aria-label={`Valor de la CIM de ${a?.name} en µg/mL`}
                    inputMode="decimal"
                    value={r.value}
                    placeholder="CIM"
                    onChange={(e) => update(r.antibioticId, { value: e.target.value.replace(/[^0-9.,/]/g, '') })}
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-slate-500">µg/mL</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    aria-label={`Halo de ${a?.name} en mm (difusión en disco)`}
                    inputMode="numeric"
                    value={r.diskMm}
                    placeholder="Halo"
                    onChange={(e) => update(r.antibioticId, { diskMm: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    className="w-16 rounded-md border border-slate-300 px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-slate-500">mm</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">Lectura</span>
                  <Segmented
                    options={READINGS}
                    value={r.reported}
                    onSelect={(v) => update(r.antibioticId, { reported: r.reported === v ? '' : v })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((x) => x.antibioticId !== r.antibioticId))}
                  className="ml-auto rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                  aria-label={`Quitar ${a?.name}`}
                  title="Quitar"
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <Plus size={16} aria-hidden className="text-brand-600" />
        <span className="font-medium text-slate-700">Agregar antibiótico</span>
        <select
          value=""
          disabled={available.length === 0}
          onChange={(e) => e.target.value && onChange([...rows, newRow(Number(e.target.value))])}
          className="min-w-56 rounded-lg border border-slate-300 bg-white px-3 py-1.5"
        >
          <option value="">{available.length ? 'Elige…' : 'No quedan antibióticos'}</option>
          {available.map((a) => (
            <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
          ))}
        </select>
      </label>
    </div>
  )
}

function Segmented<T extends string>({ options, value, onSelect }: {
  options: { value: T; label: string; title: string }[]
  value: T | ''
  onSelect: (value: T) => void
}) {
  return (
    <div role="radiogroup" className="inline-flex overflow-hidden rounded-md ring-1 ring-slate-300">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          title={o.title}
          onClick={() => onSelect(o.value)}
          className={`min-w-8 px-2 py-1 text-sm font-medium ${value === o.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
