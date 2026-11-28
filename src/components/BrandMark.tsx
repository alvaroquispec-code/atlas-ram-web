/**
 * Marca de Atlas RAM: una placa de antibiograma vista desde arriba. El disco central es el antibiótico y el
 * anillo, el halo de inhibición (prueba de Kirby-Bauer): mientras más grande el halo, más sensible la bacteria.
 */
export default function BrandMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="11" fill="var(--color-brand-600)" />
      <circle cx="12" cy="12" r="7.5" fill="var(--color-res-0)" opacity="0.95" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="var(--color-res-3)" strokeWidth="1" strokeDasharray="2 1.6" />
      <circle cx="12" cy="12" r="2.6" fill="#ffffff" />
    </svg>
  )
}
