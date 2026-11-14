import StatusPage from '../components/StatusPage'

export default function ForbiddenPage() {
  return <StatusPage code={403} title="Acceso restringido" message="Tu rol no tiene permiso para ver esta sección." />
}
