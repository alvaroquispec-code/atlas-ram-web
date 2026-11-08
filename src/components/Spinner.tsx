
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const SIZES = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-[3px]', lg: 'h-12 w-12 border-4' }

export default function Spinner({ size = 'md', label }: SpinnerProps) {
  return (
    <div role="status" className="flex flex-col items-center gap-3">
      <span className={`${SIZES[size]} animate-spin rounded-full border-brand-100 border-t-brand-600`} />
      {label ? <span className="text-sm text-slate-500">{label}</span> : <span className="sr-only">Cargando</span>}
    </div>
  )
}
