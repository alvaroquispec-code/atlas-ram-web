import type { BreakpointSite } from '../types/api'

interface Props {
  value: BreakpointSite
  onChange: (site: BreakpointSite) => void
}

const OPTIONS: { site: BreakpointSite; label: string }[] = [
  { site: 'NON_MENINGITIS', label: 'No meníngeo' },
  { site: 'MENINGITIS', label: 'Meníngeo' },
]

/**
 * Para pares con dos puntos de corte CLSI según el sitio de infección (S. pneumoniae frente a ceftriaxona):
 * elige con cuál se leen las CIM. Ambas opciones usan los mismos aislamientos; cambia solo el umbral.
 */
export default function SiteToggle({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-white p-3 text-sm shadow-sm ring-1 ring-slate-200">
      <span className="font-medium text-slate-700">Punto de corte CLSI</span>
      <div role="radiogroup" aria-label="Punto de corte por sitio de infección" className="inline-flex rounded-lg ring-1 ring-slate-300">
        {OPTIONS.map((o, i) => (
          <button
            key={o.site}
            type="button"
            role="radio"
            aria-checked={value === o.site}
            onClick={() => onChange(o.site)}
            className={`px-3 py-1.5 ${i === 0 ? 'rounded-l-lg' : 'rounded-r-lg'} ${
              value === o.site ? 'bg-sky-700 text-white' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-500">
        Mismas CIM, distinto umbral: meningitis S ≤ 0,5 µg/mL; otras infecciones S ≤ 1 µg/mL.
      </span>
    </div>
  )
}
