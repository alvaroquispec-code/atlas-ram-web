# Atlas RAM — Web

Cliente web de Atlas RAM, la plataforma de antibiogramas acumulados para terapia empírica informada. Consume la API REST de `atlas-ram-backend`.

## Tecnologías

React 19, TypeScript 6, Vite 8, React Router DOM 7, Tailwind CSS 4 y axios, las mismas versiones de los laboratorios del curso.

## Ejecución local

```bash
npm install
cp .env.example .env
npm run dev
```

La aplicación queda en `http://localhost:5173`. Usuario de prueba del seed: `admin@atlasram.test` / `AtlasRam2026!`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API, incluido `/api/v1` | `http://localhost:8080/api/v1` |

## Estructura

```
src/
  components/   componentes presentacionales reutilizables
  contexts/     estado global (autenticación)
  hooks/        lógica reutilizable (useAuth, useForm)
  layouts/      estructura de página compartida
  pages/        una vista por ruta, cargadas con React.lazy
  routes/       configuración centralizada de rutas
  services/     cliente HTTP y acceso a la API
  types/        contratos de datos de la API
  utils/        validaciones y traducción de errores
```
