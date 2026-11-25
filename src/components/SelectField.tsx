import { useId, type SelectHTMLAttributes } from 'react'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: { value: string | number; label: string }[]
}

export default function SelectField({ label, options, className = '', ...props }: SelectFieldProps) {
  const id = useId()
  return (
    // min-w-0 y w-full: un <select> mide por defecto lo que su opción más larga (p. ej. "Hospital Nacional
    // Guillermo Almenara Irigoyen") y, dentro de una grilla, ensancharía la página en un celular angosto.
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        id={id}
        {...props}
        className="w-full min-w-0 text-ellipsis rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}