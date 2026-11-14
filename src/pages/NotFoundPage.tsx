import StatusPage from '../components/StatusPage'

interface NotFoundPageProps {
  title?: string
  message?: string
}

export default function NotFoundPage({
  title = 'Página no encontrada',
  message = 'La dirección que buscas no existe o fue movida.',
}: NotFoundPageProps) {
  return <StatusPage code={404} title={title} message={message} />
}
