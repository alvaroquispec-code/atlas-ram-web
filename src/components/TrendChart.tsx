import type { TrendPoint } from '../types/api'
import { formatMonth } from '../utils/labels'

/**
 * % de resistentes por periodo: puntos con su intervalo de confianza (barras verticales) unidos por una
 * línea. Los periodos sin aislamientos quedan como huecos en la línea.
 */
export default function TrendChart({ points }: { points: TrendPoint[] }) {
  const W = 720
  const H = 300
  const left = 48
  const right = 16
  const top = 16
  const bottom = 48
  const plotW = W - left - right
  const plotH = H - top - bottom
  const x = (i: number) => left + (points.length <= 1 ? plotW / 2 : (i * plotW) / (points.length - 1))
  const y = (v: number) => top + plotH - (v / 100) * plotH

  // Segmentos continuos: se corta la línea donde un periodo no tiene datos.
  const segments: string[] = []
  let current: string[] = []
  points.forEach((p, i) => {
    if (p.resistancePercentage === null) {
      if (current.length > 1) segments.push(current.join(' '))
      current = []
    } else {
      current.push(`${x(i)},${y(p.resistancePercentage)}`)
    }
  })
  if (current.length > 1) segments.push(current.join(' '))

  const labelEvery = Math.max(1, Math.ceil(points.length / 8))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Resistencia por periodo">
      {[0, 25, 50, 75, 100].map((tick) => (
        <g key={tick}>
          <line x1={left} x2={W - right} y1={y(tick)} y2={y(tick)} className="stroke-slate-200" />
          <text x={left - 8} y={y(tick) + 4} textAnchor="end" className="fill-slate-500 text-[11px]">
            {tick} %
          </text>
        </g>
      ))}
      {segments.map((s) => (
        <polyline key={s} points={s} fill="none" className="stroke-red-500" strokeWidth={2} />
      ))}
      {points.map((p, i) =>
        p.resistancePercentage === null ? null : (
          <g key={p.periodStart}>
            {p.resistanceCiLow !== null && p.resistanceCiHigh !== null && (
              <line x1={x(i)} x2={x(i)} y1={y(p.resistanceCiLow)} y2={y(p.resistanceCiHigh)} className="stroke-red-300" strokeWidth={2} />
            )}
            <circle cx={x(i)} cy={y(p.resistancePercentage)} r={4} className="fill-red-600">
              <title>
                {`${formatMonth(p.periodStart)}: ${p.resistancePercentage.toFixed(1)} % resistentes (${p.resistantCount} de ${p.totalTested})`}
              </title>
            </circle>
          </g>
        ),
      )}
      {points.map((p, i) =>
        i % labelEvery === 0 ? (
          <text key={`l-${p.periodStart}`} x={x(i)} y={H - bottom + 20} textAnchor="middle" className="fill-slate-500 text-[11px]">
            {formatMonth(p.periodStart)}
          </text>
        ) : null,
      )}
    </svg>
  )
}
