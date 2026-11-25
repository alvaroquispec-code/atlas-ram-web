import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  size: number
  sizeOptions?: number[]
  onPageChange: (page: number) => void
  onSizeChange: (size: number) => void
}

export default function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  sizeOptions = [10, 25, 50, 100],
  onPageChange,
  onSizeChange,
}: PaginationProps) {
  const isFirst = page <= 0
  const isLast = page >= totalPages - 1
  const from = totalElements === 0 ? 0 : page * size + 1
  const to = Math.min((page + 1) * size, totalElements)
  const pages = visiblePages(page, totalPages)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        Mostrando {from}–{to} de {totalElements} · página {totalPages === 0 ? 0 : page + 1} de {totalPages}
      </span>
      {/* En pantallas angostas la fila se parte en dos líneas en vez de ensanchar la página. */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          <span className="sr-only sm:not-sr-only">Por página</span>
          <select
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            className="rounded-md border border-slate-300 bg-white px-2 py-1"
          >
            {sizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <Button variant="secondary" disabled={isFirst} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={16} aria-hidden />
          <span className="sr-only sm:not-sr-only">Anterior</span>
        </Button>
        <nav aria-label="Páginas" className="flex items-center gap-1">
          {pages.map((item, index) =>
            item === 'gap' ? (
              <span key={`gap-${index}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                className={`min-w-9 rounded-md px-2 py-1.5 text-sm transition-colors ${
                  item === page ? 'bg-brand-600 font-semibold text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item + 1}
              </button>
            ),
          )}
        </nav>
        <Button variant="secondary" disabled={isLast} onClick={() => onPageChange(page + 1)}>
          <span className="sr-only sm:not-sr-only">Siguiente</span>
          <ChevronRight size={16} aria-hidden />
        </Button>
      </div>
    </div>
  )
}
// Primera, última y las vecinas de la actual: 1 … 4 5 6 … 459
function visiblePages(page: number, totalPages: number): (number | 'gap')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i)
  const pages = new Set([0, totalPages - 1, page - 1, page, page + 1].filter((p) => p >= 0 && p < totalPages))
  const sorted = [...pages].sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? ['gap' as const, p] : [p]))
}
