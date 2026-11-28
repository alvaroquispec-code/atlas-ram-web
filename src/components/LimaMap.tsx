import { ZoomIn, ZoomOut } from 'lucide-react'
import { useState } from 'react'
import {
  LIMA_DISTRICT_MARKERS,
  LIMA_DISTRICT_SHAPES,
  LIMA_MAP_HEIGHT,
  LIMA_MAP_WIDTH,
} from '../data/limaDistricts'
import type { DistrictResistance } from '../types/api'
import { RES_LEGEND, resColor } from './ResistanceGrid'

/** Mismos cortes y colores que la lista por distrito (ResistanceGrid). */
const fillFor = (d: DistrictResistance | undefined) => resColor(d?.sufficientData ? d.resistancePercentage : null)

const FULL = `0 0 ${LIMA_MAP_WIDTH} ${LIMA_MAP_HEIGHT}`
/** Lima centro y el Callao, donde los distritos son pequeños. */
const CENTER = '40 630 420 440'

const pct = (value: number, digits = 0) => `${value.toFixed(digits)} %`

function label(d: DistrictResistance | undefined, ubigeo: string) {
  if (!d) return ubigeo
  if (d.sufficientData && d.resistancePercentage != null) return `${d.name}: ${pct(d.resistancePercentage)} resistentes`
  return `${d.name}: menos de 30 resultados (n = ${d.totalTested})`
}

/** Panel con el detalle del distrito señalado (mouse, teclado o toque). */
function Detail({ d }: { d: DistrictResistance | undefined }) {
  if (!d) {
    return (
      <p className="text-sm text-slate-500">
        Pasa el mouse sobre un distrito (o tócalo en el celular) para ver su resistencia.
      </p>
    )
  }
  const hasPooled = d.pooledResistancePercentage != null && d.pooledCiLow != null && d.pooledCiHigh != null
  return (
    <div className="space-y-2 text-sm">
      <p className="text-lg font-semibold">{d.name}</p>
      <p className="text-slate-600">
        {d.resistantCount} resistentes de {d.totalTested} probados
      </p>
      {d.sufficientData && d.resistancePercentage != null ? (
        <p>
          <span className="text-3xl font-semibold tabular-nums">{pct(d.resistancePercentage)}</span>
          <span className="ml-2 text-slate-500">resistentes</span>
          {d.resistanceCiLow != null && d.resistanceCiHigh != null && (
            <span className="block text-xs text-slate-500">
              IC 95 %: {pct(d.resistanceCiLow)}–{pct(d.resistanceCiHigh)}
            </span>
          )}
        </p>
      ) : (
        <p className="text-slate-500">Menos de 30 resultados: CLSI M39 no publica el porcentaje.</p>
      )}
      {!d.sufficientData && hasPooled && (
        <p className="rounded-lg bg-brand-50 p-2 text-brand-700 ring-1 ring-brand-200">
          Ajustado con la red (Bayes empírico): <b>{pct(d.pooledResistancePercentage!, 1)}</b>
          <span className="block text-xs">
            IC 95 %: {pct(d.pooledCiLow!)}–{pct(d.pooledCiHigh!)}. Con pocos datos se acerca al promedio de Lima.
          </span>
        </p>
      )}
    </div>
  )
}

/**
 * Vista de mapa: los mismos datos que los cuadros por distrito, sobre el contorno de Lima y el Callao.
 * Pensada para el público general y para quien recién empieza: ubica cada distrito de un vistazo.
 */
export default function LimaMap({ districts }: { districts: DistrictResistance[] }) {
  const [active, setActive] = useState<string | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const byUbigeo = new Map(districts.map((d) => [d.ubigeo, d]))
  const current = active ? byUbigeo.get(active) : undefined

  const handlers = (ubigeo: string) => ({
    onMouseEnter: () => setActive(ubigeo),
    onFocus: () => setActive(ubigeo),
    onClick: () => setActive(ubigeo),
  })

  return (
    <div className="space-y-3">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="relative rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
          <button
            type="button"
            onClick={() => setZoomed((z) => !z)}
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
          >
            {zoomed ? <ZoomOut size={14} aria-hidden /> : <ZoomIn size={14} aria-hidden />}
            {zoomed ? 'Ver toda Lima' : 'Acercar a Lima centro'}
          </button>
          <svg
            viewBox={zoomed ? CENTER : FULL}
            role="img"
            aria-label="Mapa de resistencia por distrito de Lima y el Callao"
            overflow="hidden"
            className="block h-[560px] w-full"
          >
            {LIMA_DISTRICT_SHAPES.map((s) => {
              const d = byUbigeo.get(s.ubigeo)
              const isActive = active === s.ubigeo
              return (
                <path
                  key={s.ubigeo}
                  d={s.d}
                  tabIndex={0}
                  role="button"
                  aria-label={label(d, s.ubigeo)}
                  {...handlers(s.ubigeo)}
                  className="cursor-pointer stroke-slate-50 outline-none transition-opacity hover:opacity-80 focus:opacity-80"
                  strokeWidth={isActive ? 4 : 1.5}
                  style={{ fill: fillFor(d), ...(isActive ? { stroke: 'var(--color-brand-600)' } : {}) }}
                />
              )
            })}
            {LIMA_DISTRICT_MARKERS.map((m) => {
              const d = byUbigeo.get(m.ubigeo)
              const isActive = active === m.ubigeo
              return (
                <circle
                  key={m.ubigeo}
                  cx={m.x}
                  cy={m.y}
                  r={zoomed ? 9 : 14}
                  tabIndex={0}
                  role="button"
                  aria-label={label(d, m.ubigeo)}
                  {...handlers(m.ubigeo)}
                  className="cursor-pointer outline-none"
                  strokeWidth={isActive ? 4 : 2}
                  style={{ fill: fillFor(d), stroke: isActive ? 'var(--color-brand-600)' : 'var(--color-slate-700)' }}
                />
              )
            })}
          </svg>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200" aria-live="polite">
          <Detail d={current} />
        </div>
      </div>
      <ul className="flex flex-wrap gap-4 text-sm text-slate-600">
        {RES_LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className="h-4 w-4 rounded ring-1 ring-slate-300" style={{ background: item.color }} aria-hidden />
            {item.label}
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-full bg-slate-200 ring-2 ring-slate-600" aria-hidden />
          Santa Anita, La Punta y Mi Perú: punto (sin contorno en el mapa base)
        </li>
      </ul>
      <p className="text-xs text-slate-500">
        Mapa esquemático con límites del INEI (peru-geojson, licencia MPL 2.0); no es cartografía oficial.
      </p>
    </div>
  )
}
