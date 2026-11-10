import type { Interpretation, Specimen } from '../types/api'

export const SPECIMEN_LABELS: Record<Specimen, string> = {
  BLOOD: 'Sangre',
  URINE: 'Orina',
  RESPIRATORY: 'Respiratoria',
  WOUND: 'Herida',
  CSF: 'Líquido cefalorraquídeo',
  STOOL: 'Heces',
  OTHER: 'Otra',
}

export const INTERPRETATION_LABELS: Record<Interpretation, string> = {
  SUSCEPTIBLE: 'Sensible',
  INTERMEDIATE: 'Intermedio',
  RESISTANT: 'Resistente',
}

export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })