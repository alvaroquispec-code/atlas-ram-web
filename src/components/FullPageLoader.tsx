import Spinner from './Spinner'

export default function FullPageLoader({ label = 'Cargando' }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  )
}
