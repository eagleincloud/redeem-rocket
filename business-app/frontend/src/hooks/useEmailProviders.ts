import { useState, useCallback, useEffect } from 'react'
import { EmailProvider } from '../services/email-service'
import { supabase } from '../services/supabase'

interface Provider {
  id: string
  providerType: string
  providerName: string
  isVerified: boolean
  isPrimary: boolean
  verifiedDomain?: string
}

export function useEmailProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProviders = useCallback(async () => {
    setLoading(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data: business } = await supabase
        .from('biz_users')
        .select('id')
        .eq('auth_user_id', user.user.id)
        .single()

      if (!business) throw new Error('Business not found')

      const data = await EmailProvider.getProviders(business.id)

      setProviders(
        (data || []).map((p) => ({
          id: p.id,
          providerType: p.provider_type,
          providerName: p.provider_name,
          isVerified: p.is_verified,
          isPrimary: p.is_primary,
          verifiedDomain: p.verified_domain,
        }))
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch providers')
    } finally {
      setLoading(false)
    }
  }, [])

  const createProvider = useCallback(
    async (
      providerType: string,
      configJson: Record<string, any>,
      isPrimary?: boolean
    ) => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error('Not authenticated')

        const { data: business } = await supabase
          .from('biz_users')
          .select('id')
          .eq('auth_user_id', user.user.id)
          .single()

        if (!business) throw new Error('Business not found')

        const provider = await EmailProvider.createProvider(
          business.id,
          providerType,
          configJson,
          isPrimary
        )

        await fetchProviders()
        return provider
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to create provider')
      }
    },
    [fetchProviders]
  )

  const setPrimaryProvider = useCallback(
    async (providerId: string) => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error('Not authenticated')

        const { data: business } = await supabase
          .from('biz_users')
          .select('id')
          .eq('auth_user_id', user.user.id)
          .single()

        if (!business) throw new Error('Business not found')

        await EmailProvider.setPrimaryProvider(business.id, providerId)
        await fetchProviders()
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to set primary provider')
      }
    },
    [fetchProviders]
  )

  const verifyProvider = useCallback(
    async (providerId: string) => {
      try {
        await EmailProvider.verifyProvider(providerId)
        await fetchProviders()
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to verify provider')
      }
    },
    [fetchProviders]
  )

  const deleteProvider = useCallback(
    async (providerId: string) => {
      try {
        await EmailProvider.deleteProvider(providerId)
        await fetchProviders()
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to delete provider')
      }
    },
    [fetchProviders]
  )

  useEffect(() => {
    fetchProviders()
  }, [fetchProviders])

  return {
    providers,
    loading,
    error,
    fetchProviders,
    createProvider,
    setPrimaryProvider,
    verifyProvider,
    deleteProvider,
  }
}

export default useEmailProviders
