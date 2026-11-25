import { useFetch } from '../hooks/useFetch'
import { catalogService } from '../services/catalogService'

/**
 * Con qué normas se calculó lo que se ve: la edición de CLSI M100 (puntos de corte S/I/R) y CLSI M39 (cómo se
 * acumula). Si la consulta falla no se muestra nada: es información de contexto, no bloquea la página.
 */
export default function StandardsNote({ withExpectedPhenotypes = false }: { withExpectedPhenotypes?: boolean }) {
  const { data } = useFetch((signal) => catalogService.standards(signal), [])
  if (!data) return null
  return (
    <p className="text-xs text-slate-500">
      Puntos de corte: <span className="font-medium">{data.breakpoints}</span> · Agregación: {data.aggregation}
      {withExpectedPhenotypes && <> · Pares no probados: {data.expectedPhenotypes}</>}
    </p>
  )
}
