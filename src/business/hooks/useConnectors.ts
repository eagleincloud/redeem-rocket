import { useState, useCallback } from 'react'
import { supabase } from '../services/supabase'
import type { LeadConnector } from '../types'

interface UseConnectorsReturn {
  connectors: LeadConnector[]
  loading: boolean
  error: string | null
  fetchConnectors: () => Promise<void>
  createConnector: (connector: Omit<LeadConnector, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'sync_count' | 'error_count' | 'last_sync_at' | 'last_error'>) => Promise<LeadConnector | null>
  updateConnector: (id: string, changes: Partial<LeadConnector>) => Promise<LeadConnector | null>
  deleteConnector: (id: string) => Promise<boolean>
  testConnector: (id: string) => Promise<any>
  syncConnector: (id: string) => Promise<any>
}

export function useConnectors(): UseConnectorsReturn {
  const [connectors, setConnectors] = useState<LeadConnector[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchConnectors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('lead_connectors')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setConnectors(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch connectors'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createConnector = useCallback(
    async (connector: Omit<LeadConnector, 'id' | 'business_id' | 'created_at' | 'updated_at' | 'sync_count' | 'error_count' | 'last_sync_at' | 'last_error'>) => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: insertError } = await supabase
          .from('lead_connectors')
          .insert([{ ...connector, sync_count: 0, error_count: 0 }])
          .select()
          .single()

        if (insertError) throw insertError
        setConnectors((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create connector'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateConnector = useCallback(async (id: string, changes: Partial<LeadConnector>) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: updateError } = await supabase
        .from('lead_connectors')
        .update(changes)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      setConnectors((prev) => prev.map((c) => (c.id === id ? data : c)))
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update connector'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteConnector = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('lead_connectors').delete().eq('id', id)

      if (deleteError) throw deleteError
      setConnectors((prev) => prev.filter((c) => c.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete connector'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const testConnector = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        const connector = connectors.find((c) => c.id === id)
        if (!connector) throw new Error('Connector not found')

        // Call the connector operations edge function
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connector-operations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              operation: `test-${connector.connector_type}`,
              connector_type: connector.connector_type,
              connector_id: connector.id,
              ...connector,
            }),
          }
        )

        const result = await response.json()
        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Test failed'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [connectors]
  )

  const syncConnector = useCallback(
    async (id: string) => {
      setLoading(true)
      setError(null)
      try {
        const connector = connectors.find((c) => c.id === id)
        if (!connector) throw new Error('Connector not found')

        // Call the connector sync endpoint
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/connector-operations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              operation: 'sync-database',
              connector_type: connector.connector_type,
              connector_id: connector.id,
              business_id: connector.business_id,
            }),
          }
        )

        const result = await response.json()

        // Update last sync time
        if (result.success) {
          await updateConnector(id, {
            last_sync_at: new Date().toISOString(),
            sync_count: (connector.sync_count || 0) + 1,
          })
        }

        return result
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Sync failed'
        setError(message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [connectors, updateConnector]
  )

  return {
    connectors,
    loading,
    error,
    fetchConnectors,
    createConnector,
    updateConnector,
    deleteConnector,
    testConnector,
    syncConnector,
  }
}
