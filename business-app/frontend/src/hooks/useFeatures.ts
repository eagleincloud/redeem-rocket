import { useState, useCallback, useEffect } from 'react'
import * as featureService from '../lib/supabase/features'
import type {
  Feature,
  FeatureCategory,
  FeatureTemplate,
  FeatureRequest,
  BusinessOwnerFeature,
  FeatureBrowseFilters,
  BusinessType,
} from '../types'

export function useFeatures() {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveFeatures = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.getActiveFeatures()
      setFeatures(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch features')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFeaturesByCategory = useCallback(async (category: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.getFeaturesByCategory(category)
      setFeatures(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch features')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchFeaturesByBusinessType = useCallback(async (businessType: BusinessType) => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.getFeaturesByBusinessType(businessType)
      setFeatures(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch features')
    } finally {
      setLoading(false)
    }
  }, [])

  const searchFeatures = useCallback(async (query: string, filters?: FeatureBrowseFilters) => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.searchFeatures(query, filters)
      setFeatures(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search features')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    features,
    loading,
    error,
    fetchActiveFeatures,
    fetchFeaturesByCategory,
    fetchFeaturesByBusinessType,
    searchFeatures,
  }
}

export function useFeatureCategories() {
  const [categories, setCategories] = useState<FeatureCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.getFeatureCategories()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    categories,
    loading,
    error,
    fetchCategories,
  }
}

export function useFeatureTemplates() {
  const [templates, setTemplates] = useState<FeatureTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplatesForBusinessType = useCallback(async (businessType: BusinessType) => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.getTemplatesForBusinessType(businessType)
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }, [])

  const applyTemplate = useCallback(async (businessId: string, templateId: string) => {
    setLoading(true)
    setError(null)
    try {
      await featureService.applyTemplateToBusinessl(businessId, templateId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply template')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    templates,
    loading,
    error,
    fetchTemplatesForBusinessType,
    applyTemplate,
  }
}

export function useBusinessFeatures(businessId: string) {
  const [features, setFeatures] = useState<BusinessOwnerFeature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBusinessFeatures = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.getBusinessFeatures(businessId)
      setFeatures(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch business features')
    } finally {
      setLoading(false)
    }
  }, [businessId])

  const enableFeature = useCallback(
    async (featureId: string, customConfig?: Record<string, any>) => {
      setLoading(true)
      setError(null)
      try {
        const newFeature = await featureService.enableFeatureForBusiness(
          businessId,
          featureId,
          customConfig
        )
        setFeatures((prev) => [...prev, newFeature])
        return newFeature
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to enable feature')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [businessId]
  )

  const disableFeature = useCallback(
    async (featureId: string) => {
      setLoading(true)
      setError(null)
      try {
        await featureService.disableFeatureForBusiness(businessId, featureId)
        setFeatures((prev) => prev.filter((f) => f.feature_id !== featureId))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to disable feature')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [businessId]
  )

  const updateConfig = useCallback(
    async (featureId: string, customConfig: Record<string, any>) => {
      setLoading(true)
      setError(null)
      try {
        const updated = await featureService.updateFeatureConfig(businessId, featureId, customConfig)
        setFeatures((prev) =>
          prev.map((f) => (f.feature_id === featureId ? updated : f))
        )
        return updated
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update feature config')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [businessId]
  )

  return {
    features,
    loading,
    error,
    fetchBusinessFeatures,
    enableFeature,
    disableFeature,
    updateConfig,
  }
}

export function useFeatureRequests() {
  const [requests, setRequests] = useState<FeatureRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submitRequest = useCallback(
    async (
      businessId: string,
      requesterId: string,
      featureName: string,
      description: string,
      businessTypeRelevance: BusinessType[]
    ) => {
      setLoading(true)
      setError(null)
      try {
        const request = await featureService.submitFeatureRequest(
          businessId,
          requesterId,
          featureName,
          description,
          businessTypeRelevance
        )
        setRequests((prev) => [request, ...prev])
        return request
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit feature request')
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const fetchBusinessRequests = useCallback(async (businessId: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.getBusinessFeatureRequests(businessId)
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllRequests = useCallback(async (status?: string) => {
    setLoading(true)
    setError(null)
    try {
      const data = await featureService.getAllFeatureRequests(status)
      setRequests(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    requests,
    loading,
    error,
    submitRequest,
    fetchBusinessRequests,
    fetchAllRequests,
  }
}
