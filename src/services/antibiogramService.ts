import type { AntibiogramEntry, DataOrigin, DistrictResistance, Syndrome, TrendResult, WiscaResult } from '../types/api'
import { apiClient } from './apiClient'

export interface ResistanceQuery {
  microorganismId: number
  antibioticId: number
  from: string
  to: string
}

export interface CumulativeQuery {
  microorganismId?: number
  from: string
  to: string
  includeInsufficient: boolean
  origin?: DataOrigin
}

export interface TrendQuery {
  microorganismId: number
  antibioticId: number
  facilityId?: number
  from: string
  to: string
  interval: 'MONTH' | 'QUARTER'
  origin?: DataOrigin
}

export interface WiscaQuery {
  syndrome: Syndrome
  from: string
  to: string
  facilityId?: number
  target: number
  origin?: DataOrigin
}

/** Quita los filtros vacíos para que no viajen como "undefined" en la URL. */
const clean = <T extends object>(params: T) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== '' && v !== null))

export const antibiogramService = {
  async byDistrict(query: ResistanceQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<DistrictResistance[]>('/antibiogram/by-district', {
      params: query,
      signal,
    })
    return data
  },

  async cumulative(query: CumulativeQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<AntibiogramEntry[]>('/antibiogram', { params: clean(query), signal })
    return data
  },

  async trend(query: TrendQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<TrendResult>('/antibiogram/trend', { params: clean(query), signal })
    return data
  },

  async wisca(query: WiscaQuery, signal?: AbortSignal) {
    const { data } = await apiClient.get<WiscaResult>('/antibiogram/wisca', { params: clean(query), signal })
    return data
  },
}
