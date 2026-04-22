import { useState, useCallback, useEffect } from 'react'
import { EmailSegmentation } from '../services/email-service'
import { supabase } from '../services/supabase'

interface Segment {
  id: string
  name: string
  recipientCount: number
  isActive: boolean
}

export function useEmailSegments() {
  const [segments, setSegments] = useState<Segment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSegments = useCallback(async () => {
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

      const data = await EmailSegmentation.getSegments(business.id)

      const enrichedSegments = await Promise.all(
        (data || []).map(async (s) => ({
          id: s.id,
          name: s.name,
          recipientCount: await EmailSegmentation.countSegmentRecipients(s.id),
          isActive: s.is_active,
        }))
      )

      setSegments(enrichedSegments)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch segments')
    } finally {
      setLoading(false)
    }
  }, [])

  const createSegment = useCallback(
    async (name: string, criteria: Record<string, any>) => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error('Not authenticated')

        const { data: business } = await supabase
          .from('biz_users')
          .select('id')
          .eq('auth_user_id', user.user.id)
          .single()

        if (!business) throw new Error('Business not found')

        const segment = await EmailSegmentation.createSegment(
          business.id,
          name,
          criteria
        )

        await fetchSegments()
        return segment
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to create segment')
      }
    },
    [fetchSegments]
  )

  const deleteSegment = useCallback(
    async (segmentId: string) => {
      try {
        await EmailSegmentation.deleteSegment(segmentId)
        await fetchSegments()
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to delete segment')
      }
    },
    [fetchSegments]
  )

  useEffect(() => {
    fetchSegments()
  }, [fetchSegments])

  return {
    segments,
    loading,
    error,
    fetchSegments,
    createSegment,
    deleteSegment,
  }
}

export default useEmailSegments
