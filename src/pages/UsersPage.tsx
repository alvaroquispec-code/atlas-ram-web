import { useSearchParams } from 'react-router-dom'
import Alert from '../components/Alert'
import Breadcrumbs from '../components/Breadcrumbs'
import Button from '../components/Button'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { useAuth } from '../hooks/useAuth'
import { useFetch } from '../hooks/useFetch'
import { useToast } from '../hooks/useToast'
import { userService } from '../services/userService'
import type { Role, User } from '../types/api'
import { toApiError } from '../utils/apiError'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  LAB_TECHNICIAN: 'Técnico de laboratorio',
  EPIDEMIOLOGIST: 'Epidemiólogo',
  PUBLIC_VIEWER: 'Consulta pública',
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(0, Number(searchParams.get('page') ?? 0))
  const size = Number(searchParams.get('size') ?? 10)

  const { data, error, isLoading, reload } = useFetch((signal) => userService.list({ page, size }, signal), [page, size])

  const goTo = (nextPage: number, nextSize = size) =>
    setSearchParams({ page: String(nextPage), size: String(nextSize) })

  // Después de cada cambio se avisa con un toast y se recarga la página actual.
  async function run(action: Promise<User>, successMessage: string) {
    try {
      await action
      showToast(successMessage, 'success')
      reload()
    } catch (err) {
      showToast(toApiError(err).message, 'error')
    }
  }

  return (
    <section className="space-y-6">
      <Breadcrumbs items={[{ label: 'Panel', to: '/dashboard' }, { label: 'Usuarios' }]} />
      <header>
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-slate-500">Solo los administradores ven esta página. Cambia el rol o desactiva cuentas.</p>
      </header>

      {error ? (
        <Alert tone="error" action={<Button variant="ghost" onClick={reload}>Reintentar</Button>}>
          {error.message}
        </Alert>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Correo</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <Spinner label="Cargando usuarios" />
                  </td>
                </tr>
              ) : (
                data?.content.map((user) => {
                  const isMe = user.email === currentUser?.email
                  return (
                    <tr key={user.id}>
                      <td className="px-4 py-3">{user.fullName}</td>
                      <td className="px-4 py-3 text-slate-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          disabled={isMe}
                          onChange={(e) =>
                            run(userService.changeRole(user.id, e.target.value as Role), `Rol de ${user.fullName} actualizado`)
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1"
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span className={user.active ? 'text-emerald-700' : 'text-slate-400'}>
                          {user.active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!isMe && (
                          <Button
                            variant={user.active ? 'danger' : 'secondary'}
                            onClick={() => {
                              // Desactivar deja a la persona sin acceso: pedimos confirmación antes.
                              if (user.active && !window.confirm(`¿Desactivar a ${user.fullName}? Ya no podrá iniciar sesión.`)) return
                              run(
                                userService.setActive(user.id, !user.active),
                                user.active ? `${user.fullName} fue desactivado` : `${user.fullName} fue activado`,
                              )
                            }}
                          >
                            {user.active ? 'Desactivar' : 'Activar'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && (
        <Pagination
          page={page}
          totalPages={data.totalPages}
          totalElements={data.totalElements}
          size={size}
          sizeOptions={[5, 10, 25]}
          onPageChange={(next) => goTo(next)}
          onSizeChange={(nextSize) => goTo(0, nextSize)}
        />
      )}
    </section>
  )
}