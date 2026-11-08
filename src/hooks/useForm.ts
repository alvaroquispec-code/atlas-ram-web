import { useCallback, useState, type ChangeEvent, type FormEvent } from 'react'

export type Validators<T> = Partial<Record<keyof T, (value: string, values: T) => string | undefined>>

export function useForm<T extends Record<string, string>>(initialValues: T, validators: Validators<T>) {
  const [values, setValues] = useState<T>(initialValues)
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [serverErrors, setServerErrors] = useState<Partial<Record<keyof T, string>>>({})

  const validateField = useCallback(
    (name: keyof T, currentValues: T) => validators[name]?.(currentValues[name], currentValues),
    [validators],
  )

  const errors = Object.keys(values).reduce<Partial<Record<keyof T, string>>>((acc, key) => {
    const name = key as keyof T
    const message = serverErrors[name] ?? (touched[name] ? validateField(name, values) : undefined)
    if (message) acc[name] = message
    return acc
  }, {})

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const name = event.target.name as keyof T
    setValues((prev) => ({ ...prev, [name]: event.target.value }))
    setTouched((prev) => ({ ...prev, [name]: true }))
    setServerErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = (onValid: (values: T) => void | Promise<void>) => (event: FormEvent) => {
    event.preventDefault()
    const allTouched = Object.keys(values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
    setTouched(allTouched)
    const hasErrors = Object.keys(values).some((key) => validateField(key as keyof T, values))
    if (!hasErrors) return onValid(values)
  }

  return { values, errors, handleChange, handleSubmit, setServerErrors }
}
