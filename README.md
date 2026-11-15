# Atlas RAM · Web

Frontend web de **Atlas RAM**, la plataforma de antibiogramas acumulados de Lima y Callao. Hecho con React y consume la API REST de [`atlas-ram-backend`](https://github.com/alvaroquispec-code/atlas-ram-backend).

| | |
|---|---|
| **Web en producción** | https://atlas-ram-web.vercel.app |
| **API** | https://3-85-201-152.sslip.io/api/v1 |
| **App móvil** | [`atlas-ram-mobile`](https://github.com/alvaroquispec-code/atlas-ram-mobile) |

Usuario de prueba: `admin@atlasram.test` / `AtlasRam2026!` (datos de demostración).

## Integrantes y participación

El porcentaje indica cuánto cumplió cada integrante de sus responsabilidades en cada fase (100 % = cumplimiento completo).

| Integrante | Principales aportes | Fase 1 (API) | Fase 2 (web, móvil y despliegue) |
|---|---|:---:|:---:|
| Álvaro Felipe Quispe Carrillo | Modelo de dominio y lógica de la API; despliegue completo (AWS EC2, RDS, HTTPS con Caddy, Vercel, EAS); web: panel de resistencia, aislamientos, usuarios y catálogo; base de la app móvil | 100 % | 100 % |
| Joaquim Alexander Carrión Díaz | Fase 1: autenticación JWT con refresh tokens y autorización por rol (#5). Fase 2: web, con login y registro, cliente API con interceptores y rutas protegidas | 100 % | 100 % |
| Adriano Alonso Cosme Salazar | Fase 1: ingesta asíncrona de CSV, eventos de dominio y notificaciones (#8). Fase 2: app móvil, con escáner QR, registro de aislamientos y publicación del APK con EAS | 100 % | 100 % |
| Fabian Isaias Sanchez Zedano | Fase 1: excepciones propias, manejo global de errores y endpoints de la API (#6). No participó en la fase 2 | 100 % | 0 % |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router 7 · Axios · Lucide (iconos)

## Vistas

| Ruta | Vista | Acceso |
|---|---|---|
| `/login`, `/register` | Inicio de sesión y registro con validación en tiempo real | Pública |
| `/dashboard` | Resistencia por distrito: filtros de microorganismo, antibiótico y fechas (en query params), indicadores y cuadrícula por distrito | Autenticado |
| `/isolates?page&size&sort&facilityId&microorganismId&specimen` | Aislamientos paginados con filtros combinables, orden por fecha y acceso directo por número | Autenticado |
| `/isolates/:id` | Detalle del aislamiento con su antibiograma (CIM, halo, interpretación CLSI); un ADMIN puede eliminarlo (`DELETE`) con confirmación | Autenticado |
| `/antibiotics?q=` | Catálogo de antibióticos: búsqueda con debounce (en query param) y creación con `POST /antibiotics` y edición en línea con `PUT /antibiotics/{id}` | Solo ADMIN |
| `/users?page&size` | Administración de usuarios: cambio de rol y activar o desactivar con confirmación | Solo ADMIN |
| `/forbidden`, `*` | Acceso denegado y 404 | — |

## Arquitectura

```
src/
  components/   UI reutilizable (Button, TextField, SelectField, Pagination, Breadcrumbs, Alert, ErrorBoundary…)
  contexts/     AuthContext (sesión) y ToastContext (avisos)
  hooks/        useAuth, useFetch (con AbortController), useForm, useToast, useDebouncedValue
  layouts/      AppLayout (navegación) y AuthLayout
  pages/        una página por ruta, cargada con React.lazy
  routes/       AppRouter: rutas centralizadas, PrivateRoute con roles
  services/     apiClient (axios + interceptores) y un servicio por recurso
  types/        tipos de la API
  utils/        errores, validadores, etiquetas
```

- **Autenticación:** el access token vive en memoria y el refresh token en `sessionStorage`. Un interceptor agrega `Authorization: Bearer`. Ante un 401 renueva el token una sola vez con `/auth/refresh`, aunque haya varias peticiones a la vez, y repite la petición.
- **Reintentos:** si un `GET` falla por red, timeout o 5xx, el interceptor lo repite hasta 2 veces con espera exponencial (500 ms y 1 s). Los `POST`, `PUT` y `DELETE` no se reintentan para no duplicar operaciones.
- **Errores:** `utils/apiError.ts` traduce cada código HTTP, timeout o falta de conexión a un mensaje claro. Un `ErrorBoundary` evita que un error de renderizado tumbe toda la app.
- **Modo oscuro:** botón sol/luna en la barra y en el login. Arranca con la preferencia del sistema y recuerda la elección. Se implementó redefiniendo las variables de color de Tailwind 4 bajo `.dark`, sin duplicar clases en cada componente; un script en `index.html` lo aplica antes de pintar para evitar el destello blanco.
- **Paginación:** números de página con elipsis (1 … 4 5 6 … 459), anterior y siguiente, "Mostrando X–Y de Z" y tamaño de página 10, 25, 50 o 100.
- **Estado en la URL:** la paginación y los filtros viven en query params, así que un link compartido abre la misma vista.

## Correr en local

```bash
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:8080/api/v1
npm run dev             # http://localhost:5173
```

## Despliegue

Vercel publica cada merge a `main`. La variable `VITE_API_URL` está configurada en el proyecto de Vercel, no en el código. `vercel.json` redirige todas las rutas a `index.html` para que funcione recargar cualquier página.
