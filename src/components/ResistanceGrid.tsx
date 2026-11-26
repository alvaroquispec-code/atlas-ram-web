import type { DistrictResistance } from '../types/api'

// Mismos cortes que usa el backend para alertar (app.alert.resistance-threshold = 60).
function toneFor(percentage: number | null) {
  if (percentage === null) return 'bg-slate-100 text-slate-400 ring-slate-200'
  if (percentage >= 60) return 'bg-red-600 text-white ring-red-700'
  if (percentage >= 40) return 'bg-orange-400 text-white ring-orange-500'
  if (percentage >= 20) return 'bg-amber-200 text-amber-900 ring-amber-300'
  return 'bg-emerald-100 text-emerald-800 ring-emerald-200'
}

const LEGEND = [
  { label: '< 20 %', tone: toneFor(10) },
  { label: '20–39 %', tone: toneFor(30) },
  { label: '40–59 %', tone: toneFor(50) },
  { label: '≥ 60 %', tone: toneFor(70) },
  { label: 'Menos de 30 resultados', tone: toneFor(null) },
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
      className="pointer-events-none invisible absolute inset-x-0 top-full z-30 mt-2 rounded-lg bg-[#0f172a] p-3 text-left text-xs leading-relaxed text-[#e2e8f0] opacity-0 shadow-xl ring-1 ring-[#3b82f6] transition-opacity duration-100 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
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
            <span className="font-semibold text-[#93c5fd]">{pct(d.pooledResistancePercentage!, 1)}</span>
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
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {sorted.map((district) => (
          <li
            key={district.districtId}
            tabIndex={0}
            className={`group relative cursor-default rounded-lg px-3 py-2 ring-1 outline-none focus-visible:ring-2 focus-visible:ring-brand-500 hover:z-20 focus:z-20 ${toneFor(district.resistancePercentage)}`}
          >
            <p className="truncate text-sm font-medium">{district.name}</p>
            <p className="text-lg font-semibold">
              {district.resistancePercentage === null ? '—' : `${district.resistancePercentage.toFixed(0)} %`}
            </p>
            <p className="text-xs opacity-80">n = {district.totalTested}</p>
            {!district.sufficientData && district.pooledResistancePercentage != null && (
              <p className="mt-1 inline-block rounded bg-brand-50 px-1.5 py-0.5 text-xs font-medium text-brand-700 ring-1 ring-brand-200">
                ≈ {district.pooledResistancePercentage.toFixed(0)} % ajustado
              </p>
            )}
            <DistrictDetail d={district} />
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-3 text-xs text-slate-600">
        {LEGEND.map((item) => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded ring-1 ${item.tone}`} />
            {item.label}
          </span>
        ))}
      </div>
      <p className="text-xs text-slate-500">
        Pasa el mouse sobre un distrito para ver el detalle. «≈ % ajustado»: con menos de 30 resultados, estimación que toma información del resto de distritos
        (pooling parcial beta-binomial). No reemplaza la regla de 30 de CLSI M39.
      </p>
    </div>
  )
}