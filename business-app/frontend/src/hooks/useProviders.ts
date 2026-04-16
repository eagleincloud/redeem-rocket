import { useState, useCallback } from 'react'
import { supabase, callEdgeFunction } from '../services/supabase'
import type { EmailProviderConfig, VerifyEmailProviderPayload } from '../types/growth-platform'

interface UseProvidersReturn {
  providers: EmailProviderConfig[]
  loading: boolean
  error: string | null
  fetchProviders: () => Promise<void>
  createProvider: (provider: Omit<EmailProviderConfig, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Promise<EmailProviderConfig | null>
  updateProvider: (id: string, changes: Partial<EmailProviderConfig>) => Promise<EmailProviderConfig | null>
  deleteProvider: (id: string) => Promise<boolean>
  verifyProvider: (payload: VerifyEmailProviderPayload) => Promise<any>
}

export function useProviders(): UseProvidersReturn {
  const [providers, setProviders] = useState<EmailProviderConfig[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('email_provider_configs')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setProviders(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch providers'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createProvider = useCallback(
    async (provider: Omit<EmailProviderConfig, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: insertError } = await supabase
          .from('email_provider_configs')
          .insert([provider])
          .select()
          .single()

        if (insertError) throw insertError
        setProviders((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create provider'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateProvider = useCallback(async (id: string, changes: Partial<EmailProviderConfig>) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: updateError } = await supabase
        .from('email_provider_configs')
        .update(changes)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      setProviders((prev) => prev.map((p) => (p.id === id ? data : p)))
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update provider'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteProvider = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('email_provider_configs').delete().eq('id', id)

      if (deleteError) throw deleteError
      setProviders((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete provider'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const verifyProvider = useCallback(async (payload: VerifyEmailProviderPayload) => {
    setLoading(true)
    setError(null)
    try {
      const response = await callEdgeFunction('verify-email-provider', payload)
      if (!response.success) throw new Error(response.error || 'Verification failed')
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to verify provider'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    providers,
    loading,
    error,
    fetchProviders,
    createProvider,
    updateProvider,
    deleteProvider,
    verifyProvider,
  }
}
