import type { PublishedAntibiogram } from '../types/api'
import { apiClient } from './apiClient'

export const publishedService = {
  /** Antibiogramas reales publicados (VIRAPERU…), cada fila con el valor de Atlas RAM al lado. */
  async list(signal?: AbortSignal) {
    const { data } = await apiClient.get<PublishedAntibiogram[]>('/antibiogram/published', { signal })
    return data
  },
}
