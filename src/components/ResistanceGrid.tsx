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

/** Detalle al pasar el mouse: conteo y, si hay, la estimación ajustada con su intervalo. */
function tooltip(d: DistrictResistance) {
  const base = `${d.resistantCount} resistentes de ${d.totalTested} probados`
  if (d.pooledResistancePercentage == null || d.pooledCiLow == null || d.pooledCiHigh == null) return base
  return `${base}\nAjustado con la red (Bayes empírico): ${d.pooledResistancePercentage.toFixed(1)} % ` +
    `[${d.pooledCiLow.toFixed(0)}–${d.pooledCiHigh.toFixed(0)} %]`
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
            title={tooltip(district)}
            className={`rounded-lg px-3 py-2 ring-1 ${toneFor(district.resistancePercentage)}`}
          >
            <p className="truncate text-sm font-medium">{district.name}</p>
            <p className="text-lg font-semibold">
              {district.resistancePercentage === null ? '—' : `${district.resistancePercentage.toFixed(0)} %`}
            </p>
            <p className="text-xs opacity-80">n = {district.totalTested}</p>
            {!district.sufficientData && district.pooledResistancePercentage != null && (
              <p className="text-xs opacity-80">≈ {district.pooledResistancePercentage.toFixed(0)} % ajustado</p>
            )}
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
        «≈ % ajustado»: con menos de 30 resultados, estimación que toma información del resto de distritos
        (pooling parcial beta-binomial). No reemplaza la regla de 30 de CLSI M39.
      </p>
    </div>
  )
}