import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Política de tratamiento de datos personales (versión 2026-11, la misma que guarda el backend en
 * DataPolicy.VERSION). Es pública: se abre desde el registro sin iniciar sesión.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 text-slate-700">
      <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline">
        ← Volver
      </Link>
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <ShieldCheck size={16} aria-hidden /> Atlas RAM
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Política de tratamiento de datos personales</h1>
        <p className="text-sm text-slate-500">
          Versión 2026-11. Marco: Ley 29733, Ley de Protección de Datos Personales, y su reglamento (DS 016-2024-JUS).
        </p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Qué datos tuyos guardamos</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Tu nombre, tu correo y tu rol en la plataforma.</li>
          <li>Tu contraseña, nunca en texto: solo su huella con BCrypt, que no se puede revertir.</li>
          <li>Si te registras como profesional de la salud: tu colegio profesional, tu número de colegiatura (guardado cifrado con AES-256-GCM) y el establecimiento donde trabajas.</li>
          <li>La fecha en que verificaste tu correo.</li>
          <li>Un registro de auditoría con qué datos individuales consultaste o modificaste, cuándo y desde qué IP.</li>
        </ul>
        <p>No pedimos tu DNI.</p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Datos de pacientes</h2>
        <p>
          Atlas RAM no guarda nombres, DNI ni historias clínicas de pacientes. Si el laboratorio envía un identificador,
          se reemplaza al cargarlo por un seudónimo (HMAC-SHA256 con una clave que no está en la base de datos), que solo
          sirve para contar un aislamiento por paciente. Es un procedimiento de disociación para vigilancia
          epidemiológica. El público general solo ve resultados agregados por distrito y establecimiento.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Para qué los usamos</h2>
        <p>
          Para darte acceso según tu rol, verificar tu condición de profesional de la salud y dejar constancia de quién
          accede a datos individuales. No vendemos ni cedemos tus datos a terceros.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Cómo los protegemos</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Toda la comunicación va cifrada (HTTPS).</li>
          <li>Control de acceso por rol y por establecimiento en cada petición (JWT).</li>
          <li>Límite de intentos fallidos de inicio de sesión y límite de consultas por minuto para quien no inició sesión (anti-scraping).</li>
          <li>Contraseñas con BCrypt e identificadores de pacientes seudonimizados con HMAC-SHA256.</li>
          <li>Registro de auditoría de accesos a datos individuales.</li>
        </ul>
        <p>
          Si ocurriera un incidente de seguridad, se notificará a la Autoridad Nacional de Protección de Datos Personales
          dentro de las 48 horas de conocerlo, como exige el artículo 34 del reglamento.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Dónde se guardan y por cuánto tiempo</h2>
        <p>
          Los datos se alojan en Amazon Web Services (AWS), en servidores fuera del Perú. Es un flujo transfronterizo de
          datos personales en el sentido de la Ley 29733: AWS actúa como encargado del tratamiento y no usa los datos para
          fines propios.
        </p>
        <p>
          Tu cuenta se conserva mientras esté activa. El registro de auditoría se conserva al menos dos años, como pide el
          reglamento.
        </p>
        <p>
          Atlas RAM es un proyecto universitario (UTEC) en etapa piloto. Antes de trabajar con datos reales de un hospital,
          se inscribirá el banco de datos en el Registro Nacional de Protección de Datos Personales y se firmará un
          convenio con el establecimiento.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Tus derechos</h2>
        <p>
          Puedes pedir acceder a tus datos, corregirlos, cancelarlos u oponerte a su tratamiento (derechos ARCO) a través
          del administrador de tu establecimiento o del equipo de Atlas RAM. Si cancelas tu cuenta, se desactiva y deja de
          poder iniciar sesión. Si no recibes respuesta, puedes reclamar ante la Autoridad Nacional de Protección de Datos
          Personales (Ministerio de Justicia y Derechos Humanos).
        </p>
        <p>
          Ver también los{' '}
          <Link to="/terminos" className="font-medium text-brand-600 hover:underline">
            términos y condiciones de uso
          </Link>
          .
        </p>
      </section>
    </main>
  )
}
