import type { BreakpointEdition, ReinterpretationReport } from '../types/api'
import { apiClient } from './apiClient'

export const breakpointService = {
  async editions(signal?: AbortSignal) {
    const { data } = await apiClient.get<BreakpointEdition[]>('/breakpoints/editions', { signal })
    return data
  },

  /** apply = false: vista previa, no cambia nada. apply = true: guarda (solo con la edición activa). */
  async reinterpret(version: string, apply: boolean) {
    // Recorre todo el histórico: puede tardar más que el límite general de 15 s.
    const { data } = await apiClient.post<ReinterpretationReport>('/breakpoints/reinterpret', null, {
      params: { version, apply },
      timeout: 120_000,
    })
    return data
  },
}
