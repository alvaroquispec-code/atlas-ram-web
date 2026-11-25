import type { DataOrigin, Interpretation, Specimen, Syndrome, Ward } from '../types/api'

export const SPECIMEN_LABELS: Record<Specimen, string> = {
  BLOOD: 'Sangre',
  URINE: 'Orina',
  RESPIRATORY: 'Respiratoria',
  WOUND: 'Herida',
  CSF: 'Líquido cefalorraquídeo',
  STOOL: 'Heces',
  OTHER: 'Otra',
}

export const WARD_LABELS: Record<Ward, string> = {
  ICU: 'UCI',
  INPATIENT: 'Hospitalización',
  EMERGENCY: 'Emergencia',
  OUTPATIENT: 'Consulta externa',
}

/** Opciones del filtro de servicio, con "Todos" primero. */
export const WARD_OPTIONS = [
  { value: '', label: 'Todos' },
  ...(Object.keys(WARD_LABELS) as Ward[]).map((w) => ({ value: w, label: WARD_LABELS[w] })),
]

export const INTERPRETATION_LABELS: Record<Interpretation, string> = {
  SUSCEPTIBLE: 'Sensible',
  INTERMEDIATE: 'Intermedio',
  RESISTANT: 'Resistente',
}

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
export const SYNDROME_LABELS: Record<Syndrome, string> = {
  BACTEREMIA: 'Bacteriemia (hemocultivo)',
  URINARY: 'Infección urinaria (urocultivo)',
  RESPIRATORY: 'Infección respiratoria',
  SKIN_SOFT_TISSUE: 'Piel y partes blandas',
  MENINGITIS: 'Meningitis (LCR)',
}

export const ORIGIN_LABELS: Record<DataOrigin, string> = {
  REAL: 'Reales (laboratorio)',
  SYNTHETIC: 'Sintéticos (demostración)',
}

/** "2026-03-01" → "mar 2026" */
export const formatMonth = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })

export const pct = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? '—' : `${value.toFixed(digits)} %`

/** ">=16" → "≥ 16", "<=0.25" → "≤ 0.25": el calificador indica que la CIM está fuera del rango del panel. */
export function formatMic(display: string | null | undefined, value: number | null): string | null {
  const text = display ?? (value === null ? null : String(value))
  if (!text) return null
  return text.replace(/^>=/, '≥ ').replace(/^<=/, '≤ ').replace(/^>/, '> ').replace(/^</, '< ')
}
