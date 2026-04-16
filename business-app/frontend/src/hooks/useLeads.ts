import { useState, useCallback } from 'react'
import { supabase, callEdgeFunction } from '../services/supabase'
import type { Lead, LeadFilter, LeadIngestPayload, LeadIngestResponse } from '../types/growth-platform'

interface UseLeadsReturn {
  leads: Lead[]
  loading: boolean
  error: string | null
  fetchLeads: (filters?: LeadFilter) => Promise<void>
  createLead: (lead: Omit<Lead, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Promise<Lead | null>
  updateLead: (id: string, changes: Partial<Lead>) => Promise<Lead | null>
  deleteLead: (id: string) => Promise<boolean>
  importLeads: (payload: LeadIngestPayload) => Promise<LeadIngestResponse>
  getLead: (id: string) => Promise<Lead | null>
}

export function useLeads(): UseLeadsReturn {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLeads = useCallback(async (filters?: LeadFilter) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('leads').select('*')

      if (filters?.stage) {
        query = query.eq('stage', filters.stage)
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters?.source) {
        query = query.eq('source', filters.source)
      }
      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
        )
      }
      if (filters?.minValue) {
        query = query.gte('deal_value', filters.minValue)
      }
      if (filters?.maxValue) {
        query = query.lte('deal_value', filters.maxValue)
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setLeads(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch leads'
      setError(message)
      console.error('Fetch leads error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createLead = useCallback(
    async (lead: Omit<Lead, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: insertError } = await supabase
          .from('leads')
          .insert([lead])
          .select()
          .single()

        if (insertError) throw insertError
        setLeads((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create lead'
        setError(message)
        console.error('Create lead error:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateLead = useCallback(async (id: string, changes: Partial<Lead>) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: updateError } = await supabase
        .from('leads')
        .update(changes)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      setLeads((prev) => prev.map((lead) => (lead.id === id ? data : lead)))
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update lead'
      setError(message)
      console.error('Update lead error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteLead = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('leads').delete().eq('id', id)

      if (deleteError) throw deleteError
      setLeads((prev) => prev.filter((lead) => lead.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete lead'
      setError(message)
      console.error('Delete lead error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const importLeads = useCallback(async (payload: LeadIngestPayload) => {
    setLoading(true)
    setError(null)
    try {
      const response = await callEdgeFunction<LeadIngestResponse>('lead-ingest', payload)
      if (!response.success) throw new Error(response.error || 'Import failed')
      await fetchLeads()
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import leads'
      setError(message)
      console.error('Import leads error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchLeads])

  const getLead = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch lead'
      setError(message)
      console.error('Get lead error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    updateLead,
    deleteLead,
    importLeads,
    getLead,
  }
}
