import { useState, useCallback } from 'react'
import { supabase, callEdgeFunction } from '../services/supabase'
import type { EmailSequence, Campaign } from '../types/growth-platform'

interface UseEmailSequencesReturn {
  sequences: EmailSequence[]
  loading: boolean
  error: string | null
  fetchSequences: () => Promise<void>
  createCampaign: (campaign: Campaign) => Promise<string | null>
  updateSequence: (id: string, changes: Partial<EmailSequence>) => Promise<EmailSequence | null>
  deleteSequence: (id: string) => Promise<boolean>
  getSequencesByCampaign: (campaignId: string) => Promise<EmailSequence[]>
}

export function useEmailSequences(): UseEmailSequencesReturn {
  const [sequences, setSequences] = useState<EmailSequence[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSequences = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('email_sequences')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setSequences(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch sequences'
      setError(message)
      console.error('Fetch sequences error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createCampaign = useCallback(async (campaign: Campaign) => {
    setLoading(true)
    setError(null)
    try {
      // Create campaign (or use first step's campaign_id)
      const campaignId = campaign.id || crypto.randomUUID()

      // Insert all steps
      const sequencesToInsert = campaign.steps.map((step) => ({
        campaign_id: campaignId,
        sequence_name: campaign.name,
        trigger_type: campaign.trigger_type,
        step_number: step.step_number,
        step_delay_days: step.step_delay_days,
        email_subject: step.email_subject,
        email_body: step.email_body,
        is_active: true,
      }))

      const { error: insertError } = await supabase.from('email_sequences').insert(sequencesToInsert)

      if (insertError) throw insertError

      await fetchSequences()
      return campaignId
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create campaign'
      setError(message)
      console.error('Create campaign error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchSequences])

  const updateSequence = useCallback(async (id: string, changes: Partial<EmailSequence>) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: updateError } = await supabase
        .from('email_sequences')
        .update(changes)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      setSequences((prev) => prev.map((seq) => (seq.id === id ? data : seq)))
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update sequence'
      setError(message)
      console.error('Update sequence error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteSequence = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('email_sequences').delete().eq('id', id)

      if (deleteError) throw deleteError
      setSequences((prev) => prev.filter((seq) => seq.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete sequence'
      setError(message)
      console.error('Delete sequence error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const getSequencesByCampaign = useCallback(async (campaignId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('email_sequences')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('step_number', { ascending: true })

      if (fetchError) throw fetchError
      return data || []
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch campaign sequences'
      setError(message)
      console.error('Get campaign sequences error:', err)
      return []
    }
  }, [])

  return {
    sequences,
    loading,
    error,
    fetchSequences,
    createCampaign,
    updateSequence,
    deleteSequence,
    getSequencesByCampaign,
  }
}
