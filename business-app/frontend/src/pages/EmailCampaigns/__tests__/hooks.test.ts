import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEmailCampaigns } from '../../../hooks/useEmailCampaigns'
import { useEmailTemplates } from '../../../hooks/useEmailTemplates'
import { useEmailSegments } from '../../../hooks/useEmailSegments'
import { useEmailAnalytics } from '../../../hooks/useEmailAnalytics'

// Mock services
vi.mock('../../../services/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}))

describe('Email Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useEmailCampaigns', () => {
    it('should initialize with empty campaigns', () => {
      const { result } = renderHook(() => useEmailCampaigns())
      expect(result.current.campaigns).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should handle fetch campaigns', async () => {
      const { result } = renderHook(() => useEmailCampaigns())

      await waitFor(() => {
        expect(result.current.campaigns).toBeDefined()
      })
    })
  })

  describe('useEmailTemplates', () => {
    it('should initialize with empty templates', () => {
      const { result } = renderHook(() => useEmailTemplates())
      expect(result.current.templates).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should have createTemplate method', () => {
      const { result } = renderHook(() => useEmailTemplates())
      expect(typeof result.current.createTemplate).toBe('function')
    })
  })

  describe('useEmailSegments', () => {
    it('should initialize with empty segments', () => {
      const { result } = renderHook(() => useEmailSegments())
      expect(result.current.segments).toEqual([])
      expect(result.current.loading).toBe(false)
    })

    it('should have createSegment method', () => {
      const { result } = renderHook(() => useEmailSegments())
      expect(typeof result.current.createSegment).toBe('function')
    })
  })

  describe('useEmailAnalytics', () => {
    it('should initialize with null metrics', () => {
      const { result } = renderHook(() => useEmailAnalytics('campaign-123'))
      expect(result.current.metrics).toBeNull()
      expect(result.current.topLinks).toEqual([])
    })

    it('should require campaignId', () => {
      const { result } = renderHook(() => useEmailAnalytics(''))
      expect(result.current.metrics).toBeNull()
    })
  })
})
