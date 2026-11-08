const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,72}$/

export const required = (message: string) => (value: string) =>
  value.trim() ? undefined : message

export const email = (value: string) => {
  if (!value.trim()) return 'El correo es obligatorio'
  return EMAIL_PATTERN.test(value) ? undefined : 'Ingresa un correo válido'
}

export const strongPassword = (value: string) =>
  STRONG_PASSWORD.test(value)
    ? undefined
    : 'Mínimo 8 caracteres, con una mayúscula, una minúscula y un número'
