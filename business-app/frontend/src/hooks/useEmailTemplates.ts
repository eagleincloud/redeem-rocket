import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../services/supabase'

interface EmailTemplate {
  id: string
  name: string
  category: string
  subjectTemplate: string
  bodyHtml: string
  variables: Record<string, string>
  createdAt: string
}

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = useCallback(async () => {
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

      const { data, error: fetchError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setTemplates(
        (data || []).map((t) => ({
          id: t.id,
          name: t.name,
          category: t.category,
          subjectTemplate: t.subject_template,
          bodyHtml: t.body_html,
          variables: t.variables || {},
          createdAt: t.created_at,
        }))
      )
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }, [])

  const createTemplate = useCallback(
    async (data: {
      name: string
      category: string
      subjectTemplate: string
      bodyHtml: string
      variables?: Record<string, string>
      tags?: string[]
    }) => {
      try {
        const { data: user } = await supabase.auth.getUser()
        if (!user.user) throw new Error('Not authenticated')

        const { data: business } = await supabase
          .from('biz_users')
          .select('id')
          .eq('auth_user_id', user.user.id)
          .single()

        if (!business) throw new Error('Business not found')

        const { data: template, error: insertError } = await supabase
          .from('email_templates')
          .insert({
            business_id: business.id,
            name: data.name,
            category: data.category,
            subject_template: data.subjectTemplate,
            body_html: data.bodyHtml,
            variables: data.variables || {},
            tags: data.tags || [],
          })
          .select()
          .single()

        if (insertError) throw insertError

        await fetchTemplates()
        return template
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to create template')
      }
    },
    [fetchTemplates]
  )

  const updateTemplate = useCallback(
    async (
      templateId: string,
      data: Partial<{
        name: string
        category: string
        subjectTemplate: string
        bodyHtml: string
      }>
    ) => {
      try {
        const updateData: Record<string, any> = {}
        if (data.name) updateData.name = data.name
        if (data.category) updateData.category = data.category
        if (data.subjectTemplate) updateData.subject_template = data.subjectTemplate
        if (data.bodyHtml) updateData.body_html = data.bodyHtml

        const { data: template, error: updateError } = await supabase
          .from('email_templates')
          .update(updateData)
          .eq('id', templateId)
          .select()
          .single()

        if (updateError) throw updateError

        await fetchTemplates()
        return template
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to update template')
      }
    },
    [fetchTemplates]
  )

  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', templateId)

      if (deleteError) throw deleteError

      await fetchTemplates()
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete template')
    }
  }, [fetchTemplates])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  }
}

export default useEmailTemplates
