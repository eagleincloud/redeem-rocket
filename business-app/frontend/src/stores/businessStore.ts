import { create } from 'zustand'
import { Business, Deal } from '../types'

interface BusinessStore {
  businesses: Business[]
  selectedBusiness: Business | null
  deals: Deal[]
  isLoading: boolean
  error: string | null
  filters: {
    city?: string
    category?: string
    searchQuery?: string
  }

  setBusinesses: (businesses: Business[]) => void
  setSelectedBusiness: (business: Business | null) => void
  setDeals: (deals: Deal[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setFilters: (filters: Partial<BusinessStore['filters']>) => void
  clearError: () => void
  fetchBusinesses: (filters?: any) => Promise<void>
  fetchDeals: (businessId?: string) => Promise<void>
}

export const useBusinessStore = create<BusinessStore>((set) => ({
  businesses: [],
  selectedBusiness: null,
  deals: [],
  isLoading: false,
  error: null,
  filters: {},

  setBusinesses: (businesses) => set({ businesses }),
  setSelectedBusiness: (business) => set({ selectedBusiness: business }),
  setDeals: (deals) => set({ deals }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),

  fetchBusinesses: async (filters?) => {
    set({ isLoading: true, error: null })
    try {
      const params = new URLSearchParams()
      if (filters?.city) params.append('city', filters.city)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.searchQuery) params.append('search', filters.searchQuery)

      const response = await fetch(`/api/v1/businesses/?${params}`)
      if (!response.ok) throw new Error('Failed to fetch businesses')

      const data = await response.json()
      set({ businesses: data.results || data, error: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch businesses'
      set({ error: errorMessage })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchDeals: async (businessId?) => {
    set({ isLoading: true, error: null })
    try {
      const url = businessId
        ? `/api/v1/businesses/${businessId}/deals/`
        : '/api/v1/deals/'

      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch deals')

      const data = await response.json()
      set({ deals: data.results || data, error: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch deals'
      set({ error: errorMessage })
    } finally {
      set({ isLoading: false })
    }
  },
}))
