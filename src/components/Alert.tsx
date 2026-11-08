import type { ReactNode } from 'react'

type Tone = 'error' | 'success' | 'info' | 'warning'

const TONES: Record<Tone, string> = {
  error: 'bg-red-50 text-red-800 ring-red-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  info: 'bg-brand-50 text-brand-700 ring-brand-100',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
}

interface AlertProps {
  tone?: Tone
  children: ReactNode
  action?: ReactNode
}

export default function Alert({ tone = 'info', children, action }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex items-center justify-between gap-4 rounded-lg px-4 py-3 text-sm ring-1 ${TONES[tone]}`}
    >
      <div>{children}</div>
      {action}
    </div>
  )
}
