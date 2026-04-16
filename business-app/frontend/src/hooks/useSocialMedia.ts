import { useState, useCallback } from 'react'
import { supabase, callEdgeFunction } from '../services/supabase'
import type { SocialAccount, SocialPost, PublishSocialPostPayload } from '../types/growth-platform'

interface UseSocialMediaReturn {
  accounts: SocialAccount[]
  posts: SocialPost[]
  loading: boolean
  error: string | null
  fetchAccounts: () => Promise<void>
  fetchPosts: () => Promise<void>
  createAccount: (account: Omit<SocialAccount, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Promise<SocialAccount | null>
  deleteAccount: (id: string) => Promise<boolean>
  createPost: (post: Omit<SocialPost, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => Promise<SocialPost | null>
  updatePost: (id: string, changes: Partial<SocialPost>) => Promise<SocialPost | null>
  publishPost: (payload: PublishSocialPostPayload) => Promise<any>
  deletePost: (id: string) => Promise<boolean>
}

export function useSocialMedia(): UseSocialMediaReturn {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('social_accounts')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setAccounts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch accounts'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await supabase
        .from('social_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setPosts(data || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch posts'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createAccount = useCallback(
    async (account: Omit<SocialAccount, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: insertError } = await supabase
          .from('social_accounts')
          .insert([account])
          .select()
          .single()

        if (insertError) throw insertError
        setAccounts((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create account'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const deleteAccount = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('social_accounts').delete().eq('id', id)

      if (deleteError) throw deleteError
      setAccounts((prev) => prev.filter((a) => a.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete account'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const createPost = useCallback(
    async (post: Omit<SocialPost, 'id' | 'business_id' | 'created_at' | 'updated_at'>) => {
      setLoading(true)
      setError(null)
      try {
        const { data, error: insertError } = await supabase
          .from('social_posts')
          .insert([post])
          .select()
          .single()

        if (insertError) throw insertError
        setPosts((prev) => [data, ...prev])
        return data
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create post'
        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updatePost = useCallback(async (id: string, changes: Partial<SocialPost>) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: updateError } = await supabase
        .from('social_posts')
        .update(changes)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      setPosts((prev) => prev.map((p) => (p.id === id ? data : p)))
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update post'
      setError(message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const publishPost = useCallback(async (payload: PublishSocialPostPayload) => {
    setLoading(true)
    setError(null)
    try {
      const response = await callEdgeFunction('publish-social-post', payload)
      if (!response.success) throw new Error(response.error || 'Publish failed')
      return response
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to publish post'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const deletePost = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const { error: deleteError } = await supabase.from('social_posts').delete().eq('id', id)

      if (deleteError) throw deleteError
      setPosts((prev) => prev.filter((p) => p.id !== id))
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete post'
      setError(message)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    accounts,
    posts,
    loading,
    error,
    fetchAccounts,
    fetchPosts,
    createAccount,
    deleteAccount,
    createPost,
    updatePost,
    publishPost,
    deletePost,
  }
}
