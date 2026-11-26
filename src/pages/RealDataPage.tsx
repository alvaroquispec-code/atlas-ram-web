import { BadgeCheck, ExternalLink, RotateCw } from 'lucide-react'
import Alert from '../components/Alert'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import Spinner from '../components/Spinner'
import { useFetch } from '../hooks/useFetch'
import { publishedService } from '../services/publishedService'
import type { PublishedAntibiogram, PublishedRow } from '../types/api'
import { formatDate, SPECIMEN_LABELS } from '../utils/labels'

const pct = (value: number) => `${value.toFixed(1)} %`

/** Atlas dentro del intervalo de la fuente: coinciden; fuera: se marca la diferencia en puntos porcentuales. */
function AtlasCell({ row }: { row: PublishedRow }) {
  if (row.atlasResistancePercentage == null) return <span className="text-slate-400">sin datos</span>
  const diff = row.atlasResistancePercentage - row.resistancePercentage
  const inside = row.atlasResistancePercentage >= row.resistanceCiLow && row.atlasResistancePercentage <= row.resistanceCiHigh
  return (
    <span className="tabular-nums">
      {pct(row.atlasResistancePercentage)}
      <span className="ml-1 text-xs text-slate-500">(n = {row.atlasTested})</span>
      <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${inside ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
        {inside ? 'dentro del IC' : `${diff > 0 ? '+' : ''}${diff.toFixed(0)} pp`}
      </span>
    </span>
  )
}

function SourceCard({ source }: { source: PublishedAntibiogram }) {
  const groups = source.rows.reduce<Record<string, PublishedRow[]>>((acc, r) => {
    ;(acc[r.organismLabel] ??= []).push(r)
    return acc
  }, {})
  return (
    <article className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <BadgeCheck size={14} aria-hidden /> DATO REAL · AGREGADO PUBLICADO
          </span>
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Licencia {source.license}</span>
        </div>
        <h2 className="mt-2 text-lg font-semibold">{source.title}</h2>
        <p className="text-sm text-slate-600">{source.setting}</p>
        <p className="text-sm text-slate-600">
          {SPECIMEN_LABELS[source.specimenType] ?? source.specimenType} · {formatDate(source.periodStart)} a{' '}
          {formatDate(source.periodEnd)} · primer aislamiento por paciente · {source.breakpointStandard}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {source.citation}.{' '}
          <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand-700 underline">
            {source.url.replace('https://', '')} <ExternalLink size={12} aria-hidden />
          </a>
        </p>
      </div>

      {Object.entries(groups).map(([organism, rows]) => (
        <div key={organism} className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <h3 className="border-b border-slate-200 px-4 py-3 font-semibold italic">{organism}</h3>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Antibiótico</th>
                <th className="px-4 py-2 text-right">n</th>
                <th className="px-4 py-2 text-right">% resistentes (real)</th>
                <th className="px-4 py-2">IC 95 %</th>
                <th className="px-4 py-2">Atlas RAM, mismo tipo de muestra</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.antibioticId} className="border-t border-slate-100">
                  <td className="px-4 py-2">{r.antibioticName}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.tested}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{pct(r.resistancePercentage)}</td>
                  <td className="px-4 py-2 tabular-nums text-slate-600">
                    {r.resistanceCiLow.toFixed(0)}–{r.resistanceCiHigh.toFixed(0)} %
                  </td>
                  <td className="px-4 py-2">
                    <AtlasCell row={r} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </article>
  )
}

export default function RealDataPage() {
  const { data, error, isLoading, reload } = useFetch((signal) => publishedService.list(signal), [])
  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Panel', to: '/dashboard' }, { label: 'Datos reales' }]} />
      <header>
        <h1 className="text-2xl font-semibold">Datos reales publicados</h1>
        <p className="text-sm text-slate-500">
          En el Perú no hay datos abiertos a nivel de aislamiento: lo real y público son antibiogramas agregados en estudios
          de acceso abierto. Atlas RAM los carga aparte, con su fuente y su licencia, sin mezclarlos con los aislamientos.
          Al lado se muestra lo que calcula Atlas RAM con sus datos (hoy sintéticos) para el mismo par y el mismo tipo de
          muestra. Las diferencias son esperables: otro periodo y otras regiones.
        </p>
      </header>

      {isLoading ? (
        <div className="py-16">
          <Spinner label="Cargando datos publicados" />
        </div>
      ) : error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={reload}><RotateCw size={16} aria-hidden />Reintentar</Button>}>
          {error.message}
        </Alert>
      ) : !data || data.length === 0 ? (
        <Alert tone="info">Todavía no hay fuentes publicadas cargadas.</Alert>
      ) : (
        data.map((source) => <SourceCard key={source.code} source={source} />)
      )}
    </section>
  )
}
