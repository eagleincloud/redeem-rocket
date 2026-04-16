import { useState, useCallback } from 'react'
import { supabase, callEdgeFunction } from '../services/supabase'
import type { AutomationRule, ExecuteAutomationPayload, AutomationExecutionResponse } from '../types/growth-platform'

interface UseAutomationReturn {
  rules: AutomationRule[]
  loading: boolean
  error: string | null
  fetchRules: () => Promise<void>
  createRule: (rule: Omit<AutomationRule, 'id' | 'business_id' | 'run_count' | 'last_run_at' | 'created_at' | 'updated_at'>) => Promise<AutomationRule | null>
  updateRule: (id: string, changes: Partial<AutomationRule>) => Promise<AutomationRule | null>
  deleteRule: (id: string) => Promise<boolean>
  executeRule: (payload: ExecuteAutomationPayload) => Promise<AutomationExecutionResponse>
}

export function useAutomation(): UseAutomationReturn {
  const [rules, setRules] = useState<AutomationRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRules = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setRules(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rules'
      setError(message)
      console.error('Fetch rules error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createRule = useCallback(
    async (rule: Omit<AutomationRule, 'id' | 'business_id' | 'run_count' | 'last_run_at' | 'created_at' | 'updated_at'>) => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: insertError } = await supabase
          .from('automation_rules')
          .insert([{ ...rule, run_count: 0 }])
          .select()
          .single()

        if (insertError) throw insertError
        setRules((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create rule'
        setError(message)
        console.error('Create rule error:', err)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateRule = useCallback(async (id: string, changes: Partial<AutomationRule>) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: updateError } = await supabase
        .from('automation_rules')
        .update(changes)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      setRules((prev) => prev.map((rule) => (rule.id === id ? data : rule)))
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update rule'
      setError(message)
      console.error('Update rule error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteRule = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('automation_rules').delete().eq('id', id)

      if (deleteError) throw deleteError
      setRules((prev) => prev.filter((rule) => rule.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete rule'
      setError(message)
      console.error('Delete rule error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const executeRule = useCallback(async (payload: ExecuteAutomationPayload) => {
    setLoading(true)
    setError(null)
    try {
      const response = await callEdgeFunction<AutomationExecutionResponse>('execute-automation-rules', payload)
      if (!response.success) throw new Error(response.error || 'Execution failed')
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to execute rule'
      setError(message)
      console.error('Execute rule error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    rules,
    loading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    executeRule,
  }
}
