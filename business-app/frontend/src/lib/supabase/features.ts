import { supabase } from './client'
import type {
  Feature,
  FeatureCategory,
  FeatureTemplate,
  FeatureRequest,
  BusinessOwnerFeature,
  FeatureBrowseFilters,
  BusinessType,
  FeatureStatus,
} from '../../types'

/**
 * Feature Service - All feature marketplace operations
 */

// ============================================================================
// FEATURES
// ============================================================================

export async function getActiveFeatures() {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error) throw error
  return data as Feature[]
}

export async function getFeaturesByCategory(category: string) {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('category', category)
    .eq('status', 'active')
    .order('name')

  if (error) throw error
  return data as Feature[]
}

export async function getFeaturesByBusinessType(businessType: BusinessType) {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error) throw error

  // Filter client-side by relevance score (since we can't query JSONB ranges easily)
  return (data as Feature[]).filter(
    (f) => f.relevant_for[businessType] && f.relevant_for[businessType] > 0
  ).sort((a, b) => (b.relevant_for[businessType] || 0) - (a.relevant_for[businessType] || 0))
}

export async function getFeatureById(id: string) {
  const { data, error } = await supabase
    .from('features')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Feature
}

export async function searchFeatures(query: string, filters?: FeatureBrowseFilters) {
  let query_builder = supabase
    .from('features')
    .select('*')
    .eq('status', filters?.status || 'active')

  if (filters?.category) {
    query_builder = query_builder.eq('category', filters.category)
  }

  const { data, error } = await query_builder.order('name')

  if (error) throw error

  let results = data as Feature[]

  // Filter by search query (name + description)
  if (query.trim()) {
    const lowerQuery = query.toLowerCase()
    results = results.filter(
      (f) =>
        f.name.toLowerCase().includes(lowerQuery) ||
        f.description.toLowerCase().includes(lowerQuery)
    )
  }

  // Filter by business type relevance
  if (filters?.businessType) {
    results = results
      .filter((f) => f.relevant_for[filters.businessType!] && f.relevant_for[filters.businessType!] > 0)
      .sort((a, b) => (b.relevant_for[filters.businessType!] || 0) - (a.relevant_for[filters.businessType!] || 0))
  }

  // Filter by price range
  if (filters?.priceRange) {
    results = results.filter(
      (f) =>
        f.base_price_monthly >= filters.priceRange!.min &&
        f.base_price_monthly <= filters.priceRange!.max
    )
  }

  return results
}

// ============================================================================
// FEATURE CATEGORIES
// ============================================================================

export async function getFeatureCategories() {
  const { data, error } = await supabase
    .from('feature_categories')
    .select('*')
    .order('order')

  if (error) throw error
  return data as FeatureCategory[]
}

// ============================================================================
// FEATURE TEMPLATES
// ============================================================================

export async function getTemplatesForBusinessType(businessType: BusinessType) {
  const { data, error } = await supabase
    .from('feature_templates')
    .select('*, features:feature_ids(*)')
    .eq('for_business_type', businessType)
    .order('monthly_price')

  if (error) throw error
  return data as FeatureTemplate[]
}

export async function getTemplateById(id: string) {
  const { data, error } = await supabase
    .from('feature_templates')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as FeatureTemplate
}

// ============================================================================
// BUSINESS OWNER FEATURES (Selected Features for a Business)
// ============================================================================

export async function getBusinessFeatures(businessId: string) {
  const { data, error } = await supabase
    .from('business_owner_features')
    .select('*, feature:feature_id(name, slug, icon, description)')
    .eq('business_id', businessId)
    .order('enabled_at')

  if (error) throw error
  return data as BusinessOwnerFeature[]
}

export async function enableFeatureForBusiness(businessId: string, featureId: string, customConfig?: Record<string, any>) {
  const { data, error } = await supabase
    .from('business_owner_features')
    .insert({
      business_id: businessId,
      feature_id: featureId,
      custom_config: customConfig,
      enabled_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as BusinessOwnerFeature
}

export async function disableFeatureForBusiness(businessId: string, featureId: string) {
  const { error } = await supabase
    .from('business_owner_features')
    .delete()
    .eq('business_id', businessId)
    .eq('feature_id', featureId)

  if (error) throw error
}

export async function updateFeatureConfig(businessId: string, featureId: string, customConfig: Record<string, any>) {
  const { data, error } = await supabase
    .from('business_owner_features')
    .update({ custom_config: customConfig })
    .eq('business_id', businessId)
    .eq('feature_id', featureId)
    .select()
    .single()

  if (error) throw error
  return data as BusinessOwnerFeature
}

export async function applyTemplateToBusinessl(businessId: string, templateId: string) {
  // Get template with feature IDs
  const template = await getTemplateById(templateId)

  // Enable all features in the template
  const enablePromises = template.feature_ids.map((featureId) =>
    enableFeatureForBusiness(businessId, featureId)
  )

  const results = await Promise.all(enablePromises)
  return results
}

// ============================================================================
// FEATURE REQUESTS (User Requests for New Features)
// ============================================================================

export async function submitFeatureRequest(
  businessId: string,
  requesterId: string,
  featureName: string,
  description: string,
  businessTypeRelevance: BusinessType[]
) {
  const { data, error } = await supabase
    .from('feature_requests')
    .insert({
      business_id: businessId,
      requester_id: requesterId,
      feature_name: featureName,
      description: description,
      business_type_relevance: businessTypeRelevance,
      status: 'submitted',
      make_available_to_all_businesses: false,
    })
    .select()
    .single()

  if (error) throw error
  return data as FeatureRequest
}

export async function getBusinessFeatureRequests(businessId: string) {
  const { data, error } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as FeatureRequest[]
}

export async function getFeatureRequestById(id: string) {
  const { data, error } = await supabase
    .from('feature_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as FeatureRequest
}

// For admin use - get all feature requests
export async function getAllFeatureRequests(status?: string) {
  let query_builder = supabase
    .from('feature_requests')
    .select('*')

  if (status) {
    query_builder = query_builder.eq('status', status)
  }

  const { data, error } = await query_builder.order('created_at', { ascending: false })

  if (error) throw error
  return data as FeatureRequest[]
}

export async function getFeatureRequestsInDevelopment() {
  const { data, error } = await supabase
    .from('feature_requests')
    .select('*')
    .in('status', ['ai_development', 'admin_testing', 'approved'])
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as FeatureRequest[]
}

// ============================================================================
// ADMIN OPERATIONS (Feature Management)
// ============================================================================

export async function createFeature(feature: Omit<Feature, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('features')
    .insert(feature)
    .select()
    .single()

  if (error) throw error
  return data as Feature
}

export async function updateFeature(id: string, updates: Partial<Feature>) {
  const { data, error } = await supabase
    .from('features')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Feature
}

export async function updateFeatureRequestStatus(
  requestId: string,
  status: string,
  adminNotes?: string
) {
  const updates: Record<string, any> = { status }
  if (adminNotes) updates.admin_notes = adminNotes

  const { data, error } = await supabase
    .from('feature_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data as FeatureRequest
}

export async function updateFeatureRequestAdminApproval(
  requestId: string,
  testingStatus: 'passed' | 'failed' | 'in_progress',
  adminNotes?: string
) {
  const updates: Record<string, any> = {
    admin_testing_status: testingStatus,
  }
  if (adminNotes) updates.admin_notes = adminNotes
  if (testingStatus === 'passed') {
    updates.status = 'approved'
    updates.admin_approval_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('feature_requests')
    .update(updates)
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data as FeatureRequest
}

export async function deployFeatureRequest(requestId: string, rolloutPercentage: number = 100) {
  const { data: request, error: fetchError } = await getFeatureRequestById(requestId)
  if (fetchError) throw fetchError

  // Create feature from request
  const newFeature = await createFeature({
    slug: `feature-${Date.now()}`,
    name: request.feature_name,
    description: request.description,
    category: 'custom',
    status: 'active',
    base_price_monthly: 0,
    relevant_for: {
      ecommerce: request.business_type_relevance.includes('ecommerce') ? 80 : 0,
      services: request.business_type_relevance.includes('services') ? 80 : 0,
      marketplace: request.business_type_relevance.includes('marketplace') ? 80 : 0,
      b2b: request.business_type_relevance.includes('b2b') ? 80 : 0,
    },
    components: [],
  })

  // Mark request as deployed
  const { data, error } = await supabase
    .from('feature_requests')
    .update({
      status: 'deployed',
      rollout_percentage: rolloutPercentage,
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return { request: data as FeatureRequest, feature: newFeature }
}
