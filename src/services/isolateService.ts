import type { CreateIsolatePayload, Interpretation, InterpretationPreview, Isolate, Page, Specimen, SusceptibilityResult } from '../types/api'
import { apiClient } from './apiClient'

export type IsolateSort = 'collectionDate,desc' | 'collectionDate,asc'

export interface IsolateQuery {
  page: number
  size: number
  facilityId?: number
  microorganismId?: number
  specimen?: Specimen
  sort?: IsolateSort
}

export const isolateService = {
  async list({ page, size, facilityId, microorganismId, specimen, sort = 'collectionDate,desc' }: IsolateQuery, signal?: AbortSignal) {
    // axios omite los parámetros undefined, así que solo viajan los filtros elegidos.
    const { data } = await apiClient.get<Page<Isolate>>('/isolates', {
      params: { page, size, facilityId, microorganismId, specimen, sort },
      signal,
    })
    return data
  },

  async findById(id: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<Isolate>(`/isolates/${id}`, { signal })
    return data
  },

  /** Un paciente con su antibiograma, en una sola transacción. */
  async create(payload: CreateIsolatePayload) {
    const { data } = await apiClient.post<Isolate>('/isolates', payload)
    return data
  },

  /** Antibióticos que llegan después: se agregan todos o ninguno. */
  async addResults(id: number, results: CreateIsolatePayload['results']) {
    const { data } = await apiClient.post<Isolate>(`/isolates/${id}/results`, { results })
    return data
  },

  /** S, I o R que tendría un resultado con estos datos, calculado por el servidor sin guardar nada. */
  async previewInterpretation(
    params: { microorganismId: number; antibioticId: number; specimen?: Specimen; mic?: string; diskMm?: number; reported?: Interpretation },
    signal?: AbortSignal,
  ) {
    const { data } = await apiClient.get<InterpretationPreview>('/isolates/interpretation-preview', { params, signal })
    return data
  },

  async remove(id: number) {
    await apiClient.delete(`/isolates/${id}`)
  },

  async results(id: number, signal?: AbortSignal) {
    const { data } = await apiClient.get<SusceptibilityResult[]>(`/isolates/${id}/results`, { signal })
    return data
  },

  /** El aislamiento y su antibiograma en HL7 FHIR R4 (LOINC y SNOMED CT), para otros sistemas del hospital. */
  async fhirBundle(id: number) {
    const { data } = await apiClient.get<unknown>(`/fhir/isolates/${id}`, {
      headers: { Accept: 'application/fhir+json' },
      responseType: 'json',
    })
    return data
  },
}
