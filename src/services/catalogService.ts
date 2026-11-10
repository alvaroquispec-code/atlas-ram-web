import type { Antibiotic, Facility, Microorganism, Page } from '../types/api'
import { apiClient } from './apiClient'

// Los catálogos son cortos (8 microorganismos, ~20 antibióticos): los pedimos en una sola página.
const ALL = { size: 100 }

export const catalogService = {
  async microorganisms(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Microorganism>>('/microorganisms', { params: ALL, signal })
    return data.content
  },

  async facilities(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Facility>>('/facilities', { params: { size: 200, sort: 'name' }, signal })
    return data.content
  },

  async antibiotics(signal?: AbortSignal) {
    const { data } = await apiClient.get<Page<Antibiotic>>('/antibiotics', { params: ALL, signal })
    return data.content
  },
}

export const microorganismLabel = (m: Microorganism) => `${m.genus} ${m.species ?? ''}`.trim()