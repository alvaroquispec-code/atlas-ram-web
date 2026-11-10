# Atlas RAM · Web

Frontend web de **Atlas RAM**, la plataforma de antibiogramas acumulados de Lima y Callao. Hecho con React y consume la API REST de [`atlas-ram-backend`](https://github.com/alvaroquispec-code/atlas-ram-backend).

| | |
|---|---|
| **Web en producción** | https://atlas-ram-web.vercel.app |
| **API** | https://3-85-201-152.sslip.io/api/v1 |
| **App móvil** | [`atlas-ram-mobile`](https://github.com/alvaroquispec-code/atlas-ram-mobile) |

Usuario de prueba: `admin@atlasram.test` / `AtlasRam2026!` (datos de demostración).

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router 7 · Axios

## Vistas

| Ruta | Vista | Acceso |
|---|---|---|
| `/login`, `/register` | Inicio de sesión y registro con validación en tiempo real | Pública |
| `/dashboard` | Resistencia por distrito: filtros de microorganismo, antibiótico y fechas (en query params), indicadores y cuadrícula por distrito | Autenticado |
| `/isolates?page&size&facilityId` | Aislamientos paginados, con filtro por establecimiento | Autenticado |
| `/isolates/:id` | Detalle del aislamiento con su antibiograma (CIM, halo, interpretación CLSI) | Autenticado |
| `/users?page&size` | Administración de usuarios: cambio de rol y activar o desactivar con confirmación | Solo ADMIN |
| `/forbidden`, `*` | Acceso denegado y 404 | — |

## Arquitectura

```
src/
  components/   UI reutilizable (Button, TextField, SelectField, Pagination, Breadcrumbs, Alert, ErrorBoundary…)
  contexts/     AuthContext (sesión) y ToastContext (avisos)
  hooks/        useAuth, useFetch (con AbortController), useForm, useToast
  layouts/      AppLayout (navegación) y AuthLayout
  pages/        una página por ruta, cargada con React.lazy
  routes/       AppRouter: rutas centralizadas, PrivateRoute con roles
  services/     apiClient (axios + interceptores) y un servicio por recurso
  types/        tipos de la API
  utils/        errores, validadores, etiquetas
```

- **Autenticación:** el access token vive en memoria y el refresh token en `sessionStorage`. Un interceptor agrega `Authorization: Bearer`. Ante un 401 renueva el token una sola vez con `/auth/refresh`, aunque haya varias peticiones a la vez, y repite la petición.
- **Errores:** `utils/apiError.ts` traduce cada código HTTP, timeout o falta de conexión a un mensaje claro. Un `ErrorBoundary` evita que un error de renderizado tumbe toda la app.
- **Estado en la URL:** la paginación y los filtros viven en query params, así que un link compartido abre la misma vista.

## Correr en local

```bash
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:8080/api/v1
npm run dev             # http://localhost:5173
```

## Despliegue

Vercel publica cada merge a `main`. La variable `VITE_API_URL` está configurada en el proyecto de Vercel, no en el código. `vercel.json` redirige todas las rutas a `index.html` para que funcione recargar cualquier página.
