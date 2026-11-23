/**
 * Un porcentaje con su intervalo de confianza: la barra marca el valor y la línea fina el intervalo.
 * Así se ve de un vistazo cuándo un 85 % con n = 20 no se distingue de un 95 %.
 */
interface CiBarProps {
  value: number
  low: number
  high: number
  tone: string
  label?: string
}

export default function CiBar({ value, low, high, tone, label }: CiBarProps) {
  const clamp = (v: number) => Math.min(100, Math.max(0, v))
  return (
    <div className="flex items-center gap-2" title={`${value.toFixed(1)} % (IC 95 %: ${low.toFixed(1)}–${high.toFixed(1)} %)`}>
      <div className="relative h-3 w-32 shrink-0 rounded-full bg-slate-100" aria-hidden>
        <div className={`absolute inset-y-0 left-0 rounded-full ${tone}`} style={{ width: `${clamp(value)}%` }} />
        <div
          className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-slate-800"
          style={{ left: `${clamp(low)}%`, width: `${Math.max(0.5, clamp(high) - clamp(low))}%` }}
        />
        <div className="absolute top-0 h-3 w-0.5 bg-slate-800" style={{ left: `${clamp(low)}%` }} />
        <div className="absolute top-0 h-3 w-0.5 bg-slate-800" style={{ left: `calc(${clamp(high)}% - 2px)` }} />
      </div>
      <span className="whitespace-nowrap text-sm tabular-nums">
        {label ?? `${value.toFixed(1)} %`}
        <span className="ml-1 text-xs text-slate-500">
          ({low.toFixed(0)}–{high.toFixed(0)})
        </span>
      </span>
    </div>
  )
}
