import type { DistrictResistance } from '../types/api'

// Mismos cortes que usa el backend para alertar (app.alert.resistance-threshold = 60).
export function resColor(percentage: number | null) {
  if (percentage === null) return 'var(--color-res-nodata)'
  if (percentage >= 60) return 'var(--color-res-3)'
  if (percentage >= 40) return 'var(--color-res-2)'
  if (percentage >= 20) return 'var(--color-res-1)'
  return 'var(--color-res-0)'
}

export const RES_LEGEND = [
  { label: 'Menos de 20 %', color: resColor(10) },
  { label: '20 a 39 %', color: resColor(30) },
  { label: '40 a 59 %', color: resColor(50) },
  { label: '60 % o más', color: resColor(70) },
  { label: 'Menos de 30 resultados', color: resColor(null) },
]

const pct = (value: number, digits = 0) => `${value.toFixed(digits)} %`

/**
 * Detalle del distrito al pasar el mouse o con el teclado (Tab). Se dibuja con CSS en vez de usar el atributo
 * title del navegador, que tarda en aparecer y casi no se ve. Colores fijos: se lee igual en modo claro y oscuro.
 */
function DistrictDetail({ d }: { d: DistrictResistance }) {
  const hasPooled = d.pooledResistancePercentage != null && d.pooledCiLow != null && d.pooledCiHigh != null
  return (
    <div
      role="tooltip"
      className="pointer-events-none invisible absolute left-8 right-0 top-full z-30 mt-1 max-w-sm rounded-lg bg-[#1c1a2b] p-3 text-left text-xs leading-relaxed text-[#e2e8f0] opacity-0 shadow-xl ring-1 ring-[#5a43a0] transition-opacity duration-100 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
    >
      <p className="font-semibold text-white">{d.name}</p>
      <p>
        {d.resistantCount} resistentes de {d.totalTested} probados
      </p>
      {d.sufficientData && d.resistancePercentage != null ? (
        <p>
          Resistencia: <span className="font-semibold text-white">{pct(d.resistancePercentage)}</span>
          {d.resistanceCiLow != null && d.resistanceCiHigh != null && (
            <> (IC 95 %: {pct(d.resistanceCiLow)}–{pct(d.resistanceCiHigh)})</>
          )}
        </p>
      ) : (
        <p className="text-[#94a3b8]">Menos de 30 resultados: CLSI M39 no publica el porcentaje.</p>
      )}
      {!d.sufficientData && hasPooled && (
        <div className="mt-2 border-t border-[#334155] pt-2">
          <p>
            Ajustado con la red:{' '}
            <span className="font-semibold text-[#c9bcf5]">{pct(d.pooledResistancePercentage!, 1)}</span>
          </p>
          <p>
            IC 95 %: {pct(d.pooledCiLow!)}–{pct(d.pooledCiHigh!)}
          </p>
          <p className="mt-1 text-[#94a3b8]">
            Bayes empírico: con pocos datos se acerca al promedio de los distritos de Lima.
          </p>
        </div>
      )}
    </div>
  )
}

export default function ResistanceGrid({ districts }: { districts: DistrictResistance[] }) {
  // Primero los distritos con más resistencia; los que no tienen datos suficientes, al final.
  const sorted = [...districts].sort(
    (a, b) => (b.resistancePercentage ?? -1) - (a.resistancePercentage ?? -1),
  )

  return (
    <div className="space-y-4">
      <ol className="grid grid-cols-1 gap-x-10 lg:grid-cols-2">
        {sorted.map((d, i) => {
          const p = d.sufficientData ? d.resistancePercentage : null
          const estimate = !d.sufficientData ? d.pooledResistancePercentage : null
          const ciLow = d.sufficientData ? d.resistanceCiLow : null
          const ciHigh = d.sufficientData ? d.resistanceCiHigh : null
          return (
            <li
              key={d.districtId}
              tabIndex={0}
              className="group relative grid cursor-default grid-cols-[1.5rem_minmax(0,9rem)_1fr_3.5rem] items-center gap-3 border-b border-slate-200 py-2 text-sm outline-none hover:z-20 hover:bg-slate-100/60 focus:z-20 focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="text-right text-xs text-slate-400 tabular-nums">{p === null ? '' : i + 1}</span>
              <span className={`truncate ${p === null ? 'text-slate-500' : 'font-medium text-slate-800'}`}>{d.name}</span>
              <span className="relative h-3.5" aria-hidden>
                {/* cortes de 20, 40 y 60 % */}
                {[20, 40, 60].map((t) => (
                  <span key={t} className="absolute inset-y-[-3px] w-px bg-slate-200" style={{ left: `${t}%` }} />
                ))}
                {p !== null ? (
                  <span className="absolute inset-y-0 left-0 rounded-sm" style={{ width: `${p}%`, background: resColor(p) }} />
                ) : estimate != null ? (
                  <span
                    className="absolute inset-y-0 left-0 rounded-sm border border-dashed border-slate-400"
                    style={{ width: `${estimate}%`, background: 'var(--color-res-nodata)' }}
                  />
                ) : null}
                {ciLow != null && ciHigh != null && (
                  <span
                    className="absolute top-1/2 h-px -translate-y-1/2 bg-slate-800/60"
                    style={{ left: `${ciLow}%`, width: `${Math.max(0, ciHigh - ciLow)}%` }}
                  />
                )}
              </span>
              <span className="text-right tabular-nums">
                {p !== null ? (
                  <span className="font-semibold text-slate-900">{p.toFixed(0)} %</span>
                ) : estimate != null ? (
                  <span className="text-slate-500" title="Estimación ajustada con la red">≈{estimate.toFixed(0)} %</span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </span>
              <DistrictDetail d={d} />
            </li>
          )
        })}
      </ol>
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600">
        {RES_LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ background: item.color }} />
            {item.label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="h-px w-4 bg-slate-800/60" />
          Intervalo de confianza 95 %
        </span>
      </div>
      <p className="max-w-3xl text-xs text-slate-500">
        Pasa el mouse o usa Tab sobre un distrito para ver el detalle. «≈ %»: con menos de 30 resultados, estimación
        que toma información del resto de distritos (pooling parcial beta-binomial); no reemplaza la regla de 30 de CLSI M39.
      </p>
    </div>
  )
}
