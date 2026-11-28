import { Area, Bar, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendPoint } from '../types/api'
import { formatMonth } from '../utils/labels'

type Row = {
  label: string
  pct: number | null
  band: [number, number] | null
  tested: number
  resistant: number
}

const pct = (v: number, digits = 0) => `${v.toFixed(digits)} %`

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div className="min-w-44 rounded-md bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-slate-200">
      <p className="font-semibold text-slate-900">{r.label}</p>
      {r.pct === null ? (
        <p className="text-slate-500">Sin aislamientos en este periodo</p>
      ) : (
        <>
          <p className="mt-1 text-base font-semibold text-slate-900 tabular-nums">{pct(r.pct, 1)} resistentes</p>
          {r.band && (
            <p className="text-slate-500 tabular-nums">
              IC 95 %: {pct(r.band[0])} a {pct(r.band[1])}
            </p>
          )}
          <p className="text-slate-600 tabular-nums">
            {r.resistant} de {r.tested} aislamientos
          </p>
        </>
      )}
    </div>
  )
}

/**
 * % de resistentes por periodo: la línea es el porcentaje, la banda sombreada su intervalo de confianza del 95 %
 * y las barras grises al pie, cuántos aislamientos hubo (una banda ancha con pocas barras = poca evidencia).
 * Los periodos sin aislamientos quedan como huecos.
 */
export default function TrendChart({ points }: { points: TrendPoint[] }) {
  const rows: Row[] = points.map((p) => ({
    label: formatMonth(p.periodStart),
    pct: p.resistancePercentage,
    band:
      p.resistanceCiLow !== null && p.resistanceCiHigh !== null ? [p.resistanceCiLow, p.resistanceCiHigh] : null,
    tested: p.totalTested,
    resistant: p.resistantCount,
  }))
  const maxTested = Math.max(1, ...rows.map((r) => r.tested))

  return (
    <div className="space-y-2">
      <div className="h-80 w-full" role="img" aria-label="Porcentaje de resistentes por periodo con su intervalo de confianza">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-slate-200)" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--color-slate-500)', fontSize: 12 }}
              minTickGap={24}
              tickMargin={8}
            />
            <YAxis
              yAxisId="pct"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(v: number) => `${v} %`}
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: 'var(--color-slate-500)', fontSize: 12 }}
            />
            {/* Eje oculto para que las barras de volumen ocupen solo el pie del gráfico. */}
            <YAxis yAxisId="n" hide domain={[0, maxTested * 5]} />
            <ReferenceLine yAxisId="pct" y={60} stroke="var(--color-res-3)" strokeDasharray="4 4" strokeOpacity={0.6} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-slate-300)' }} />
            <Bar yAxisId="n" dataKey="tested" fill="var(--color-slate-300)" radius={[2, 2, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            <Area
              yAxisId="pct"
              dataKey="band"
              stroke="none"
              fill="var(--color-res-3)"
              fillOpacity={0.14}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="pct"
              dataKey="pct"
              stroke="var(--color-res-3)"
              strokeWidth={2.25}
              dot={false}
              activeDot={{ r: 4, fill: 'var(--color-res-3)', stroke: 'white', strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-res-3" /> % resistentes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm bg-res-3/15" /> Intervalo de confianza 95 %
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2 rounded-sm bg-slate-300" /> Aislamientos probados
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 border-t border-dashed border-res-3" /> Umbral de alerta (60 %)
        </span>
      </div>
    </div>
  )
}
