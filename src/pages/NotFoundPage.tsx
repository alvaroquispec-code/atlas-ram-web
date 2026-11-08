import { Link } from 'react-router-dom'

interface NotFoundPageProps {
  title?: string
  message?: string
}

export default function NotFoundPage({
  title = 'Página no encontrada',
  message = 'La dirección que buscas no existe o fue movida.',
}: NotFoundPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-semibold text-brand-600">404</p>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-slate-500">{message}</p>
      <Link to="/dashboard" className="mt-2 text-sm font-medium text-brand-600 hover:underline">
        Volver al panel
      </Link>
    </div>
  )
}
