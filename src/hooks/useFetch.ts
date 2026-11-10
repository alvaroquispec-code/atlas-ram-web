import { useCallback, useEffect, useState, type DependencyList } from 'react'
import { isCancelled, toApiError, type ApiError } from '../utils/apiError'

/**
 * Ejecuta una petición cuando cambian las dependencias.
 * Si cambian antes de que llegue la respuesta (o el usuario sale de la página),
 * el AbortController cancela la petición anterior para no pisar datos nuevos con viejos.
 */
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<ApiError | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setError(null)

    fetcher(controller.signal)
      .then((result) => setData(result))
      .catch((err) => {
        if (!isCancelled(err)) setError(toApiError(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, reloadKey])

  const reload = useCallback(() => setReloadKey((key) => key + 1), [])

  return { data, error, isLoading, reload }
}