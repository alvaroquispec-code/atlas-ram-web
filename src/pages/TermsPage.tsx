import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

/**
 * Términos y condiciones de uso (versión 2026-11). Pública: se abre desde el registro sin iniciar sesión.
 * Complementa la política de datos personales (/privacidad).
 */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6 text-slate-700">
      <Link to="/login" className="text-sm font-medium text-brand-600 hover:underline">
        ← Volver
      </Link>
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
          <FileText size={16} aria-hidden /> Atlas RAM
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Términos y condiciones de uso</h1>
        <p className="text-sm text-slate-500">Versión 2026-11.</p>
      </header>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Qué es Atlas RAM</h2>
        <p>
          Una plataforma de vigilancia de la resistencia a los antimicrobianos en Lima, desarrollada como proyecto
          universitario en la UTEC. Está en etapa piloto. Salvo donde se indica «dato real», los resultados que muestra
          son datos de demostración.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">No reemplaza el criterio clínico</h2>
        <p>
          Los antibiogramas acumulados, las alertas y la guía de terapia empírica son apoyo a la decisión. No reemplazan
          el antibiograma del paciente, la evaluación del médico tratante ni las guías del comité PROA del
          establecimiento.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Cuentas y roles</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Tu cuenta es personal: no compartas tu contraseña.</li>
          <li>Los datos de tu solicitud de acceso profesional (colegio, colegiatura, establecimiento) deben ser verdaderos. Si no lo son, se rechaza la solicitud o se retira el rol.</li>
          <li>Cada rol solo ve y modifica lo de su establecimiento. Las consultas y cambios de datos individuales quedan en un registro de auditoría.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Uso permitido de la información pública</h2>
        <ul className="list-disc space-y-1 pl-6">
          <li>Puedes consultar y citar los agregados públicos (mapa, antibiograma, tendencias) indicando «Fuente: Atlas RAM» y la fecha de consulta.</li>
          <li>Los datos reales publicados mantienen la licencia y la cita de su fuente original, que se muestran junto a cada tabla.</li>
          <li>No está permitido descargar la información de forma automatizada y masiva (robots o scraping), intentar volver a identificar a un paciente ni intentar acceder a datos de otro establecimiento. Las consultas sin sesión tienen un límite por minuto.</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Establecimientos públicos y privados</h2>
        <p>
          Los establecimientos públicos usan Atlas RAM sin costo mediante convenio. Las clínicas privadas acceden con una
          licencia. Que un establecimiento es público se comprueba con su registro en RENIPRESS (SUSALUD), no con lo que
          declara quien se registra.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Datos personales</h2>
        <p>
          El tratamiento de tus datos se rige por la{' '}
          <Link to="/privacidad" className="font-medium text-brand-600 hover:underline">
            política de tratamiento de datos personales
          </Link>{' '}
          (Ley 29733 y DS 016-2024-JUS).
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900">Cambios y ley aplicable</h2>
        <p>
          Si estos términos cambian, se publicará la nueva versión en esta página. Se rigen por las leyes de la República
          del Perú.
        </p>
      </section>
    </main>
  )
}
