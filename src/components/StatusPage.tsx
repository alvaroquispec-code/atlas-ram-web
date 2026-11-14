import { Link } from 'react-router-dom'

interface StatusPageProps {
  code: 403 | 404
  title: string
  message: string
}

/** Pantalla de estado HTTP reutilizable: 404 para lo que no existe y 403 para lo que el rol no puede ver. */
export default function StatusPage({ code, title, message }: StatusPageProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-semibold text-brand-600">{code}</p>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="max-w-sm text-sm text-slate-500">{message}</p>
      <Link to="/dashboard" className="mt-2 text-sm font-medium text-brand-600 hover:underline">
        Volver al panel
      </Link>
    </div>
  )
}
