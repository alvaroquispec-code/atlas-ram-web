import type { Interpretation } from '../types/api'
import { INTERPRETATION_LABELS } from '../utils/labels'

const STYLES: Record<Interpretation, string> = {
  SUSCEPTIBLE: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  INTERMEDIATE: 'bg-amber-50 text-amber-700 ring-amber-200',
  RESISTANT: 'bg-red-50 text-red-700 ring-red-200',
}

export default function InterpretationBadge({ value }: { value: Interpretation }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${STYLES[value]}`}>
      {INTERPRETATION_LABELS[value]}
    </span>
  )
}