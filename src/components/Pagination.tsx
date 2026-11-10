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
  sizeOptions = [10, 20, 50],
  onPageChange,
  onSizeChange,
}: PaginationProps) {
  const isFirst = page <= 0
  const isLast = page >= totalPages - 1

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        {totalElements} registros · página {totalPages === 0 ? 0 : page + 1} de {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          Por página
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
          Anterior
        </Button>
        <Button variant="secondary" disabled={isLast} onClick={() => onPageChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </div>
  )
}