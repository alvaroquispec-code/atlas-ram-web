import { useAuth } from '../hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Hola, {user?.fullName}</h1>
      <p className="text-slate-500">El panel de resistencia se construye en el siguiente bloque.</p>
    </section>
  )
}
