import { useId } from 'react'

export interface PlateDisk {
  /** Código corto impreso en el disco, como en los discos reales (CRO, MEM, CIP…). */
  code: string
  /** Nombre completo, para lectores de pantalla y el tooltip. */
  name: string
  /** % de aislamientos sensibles (o no resistentes): define el tamaño del halo. */
  susceptible: number
}

interface PetriPlateProps {
  disks: PlateDisk[]
  /** Texto accesible que resume la placa. */
  label: string
  className?: string
}

/**
 * Placa de Mueller-Hinton vista desde arriba (prueba de Kirby-Bauer). Cada disco es un antibiótico y su halo de
 * inhibición crece con el % de sensibles: un halo grande es un antibiótico que todavía funciona; un disco sin
 * halo, uno al que la bacteria ya resiste. Es la imagen que cualquier microbiólogo reconoce, construida con los
 * datos de la pantalla (no es decorativa).
 *
 * El césped bacteriano es una textura de ruido (feTurbulence) y los halos aparecen una sola vez al cargar,
 * salvo que el sistema pida reducir el movimiento.
 */
export default function PetriPlate({ disks, label, className = '' }: PetriPlateProps) {
  const id = useId().replace(/:/g, '')
  const C = 100
  const AGAR = 90
  const DISK = disks.length <= 1 ? 20 : disks.length <= 6 ? 10.5 : 10
  // Los discos se reparten en un anillo; con uno solo, va al centro.
  const ring = disks.length <= 1 ? 0 : disks.length <= 6 ? 50 : 57
  const step = disks.length > 0 ? (2 * Math.PI) / disks.length : 0
  // El halo más grande posible sin tocar al vecino ni salirse del agar.
  const maxHalo =
    disks.length <= 1 ? AGAR - 14 : Math.min(ring * Math.sin(step / 2) - 1, AGAR - ring - 3)

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={label}>
      <defs>
        <radialGradient id={`agar-${id}`} cx="45%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#f1e6c4" />
          <stop offset="100%" stopColor="#e2cd96" />
        </radialGradient>
        {/* Textura del césped bacteriano: grano fino, apenas visible. */}
        <filter id={`lawn-${id}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.18  0 0 0 0.22 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
        <clipPath id={`clip-${id}`}>
          <circle cx={C} cy={C} r={AGAR} />
        </clipPath>
      </defs>

      {/* Placa de vidrio */}
      <circle cx={C} cy={C} r={97} fill="var(--color-slate-100)" stroke="var(--color-slate-300)" strokeWidth={1.5} />
      <circle cx={C} cy={C} r={93} fill="none" stroke="white" strokeOpacity={0.7} strokeWidth={1} />

      {/* Agar con césped */}
      <g clipPath={`url(#clip-${id})`}>
        <circle cx={C} cy={C} r={AGAR} fill={`url(#agar-${id})`} />
        <rect x={0} y={0} width={200} height={200} filter={`url(#lawn-${id})`} fill="#000" />
        {disks.map((d, i) => {
          const a = -Math.PI / 2 + i * step
          const x = C + ring * Math.cos(a)
          const y = C + ring * Math.sin(a)
          const halo = DISK + (Math.max(0, Math.min(100, d.susceptible)) / 100) * (maxHalo - DISK)
          return (
            <g key={d.code + i} className="petri-halo" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${i * 70}ms` }}>
              {/* Zona de inhibición: agar sin bacterias, más translúcido y con borde nítido */}
              <circle cx={x} cy={y} r={halo} fill="#bf9f5c" fillOpacity={0.5} stroke="#9c7a36" strokeOpacity={0.7} strokeWidth={0.9} />
            </g>
          )
        })}
      </g>

      {/* Discos de papel con su código */}
      {disks.map((d, i) => {
        const a = -Math.PI / 2 + i * step
        const x = C + ring * Math.cos(a)
        const y = C + ring * Math.sin(a)
        return (
          <g key={`d-${d.code}-${i}`}>
            <title>{`${d.name}: ${d.susceptible.toFixed(0)} % sensibles`}</title>
            <circle cx={x} cy={y} r={DISK} fill="#fdfcf8" stroke="#cfc6ad" strokeWidth={0.6} />
            <text
              x={x}
              y={y + DISK * 0.27}
              textAnchor="middle"
              fontSize={DISK * 0.78}
              fontWeight={700}
              fill="#3a286c"
              style={{ letterSpacing: '0.02em' }}
            >
              {d.code}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
