// User Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: 'customer' | 'business_owner' | 'admin'
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

// Business Types
export interface Business {
  id: string
  ownerId: string
  name: string
  category: string
  description: string
  logo?: string
  email: string
  phone: string
  whatsapp?: string
  website?: string
  address: string
  city: string
  state: string
  pincode: string
  country: string
  mapLat: number
  mapLng: number
  serviceRadius: number
  serviceAreas: string[]
  socialLinks: {
    facebook?: string
    instagram?: string
    youtube?: string
    linkedin?: string
  }
  businessHours: Record<string, { open: string; close: string; closed?: boolean }>
  acceptedPayments: string[]
  isVerified: boolean
  verificationStatus: 'pending' | 'approved' | 'rejected'
  documents: BusinessDocument[]
  photos: BusinessPhoto[]
  teamMembers: BusinessTeamMember[]
  createdAt: string
  updatedAt: string
}

export interface BusinessDocument {
  id: string
  businessId: string
  documentType: string
  fileUrl: string
  uploadedAt: string
  verified: boolean
  verifiedAt?: string
}

export interface BusinessPhoto {
  id: string
  businessId: string
  photoUrl: string
  uploadedAt: string
  order: number
}

export interface BusinessTeamMember {
  id: string
  businessId: string
  name: string
  email: string
  phone: string
  role: string
  joinedAt: string
}

// Order Types
export interface Order {
  id: string
  customerId: string
  businessId: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  totalAmount: number
  items: OrderItem[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  orderId: string
  description: string
  quantity: number
  amount: number
}

// Deal/Offer Types
export interface Deal {
  id: string
  businessId: string
  title: string
  description: string
  category: string
  originalPrice?: number
  discountedPrice: number
  discountPercentage: number
  validFrom: string
  validUntil: string
  termsAndConditions?: string
  imageUrl?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// Payment Types
export interface Payment {
  id: string
  orderId: string
  amount: number
  paymentMethod: 'upi' | 'card' | 'wallet' | 'bank_transfer' | 'cash'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  transactionId?: string
  createdAt: string
  updatedAt: string
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}

// Auth Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  password2: string
  firstName: string
  lastName: string
  phone?: string
  role: 'customer' | 'business_owner'
}

export interface AuthTokens {
  access: string
  refresh: string
}

// Feature Marketplace Types
export type BusinessType = 'ecommerce' | 'services' | 'marketplace' | 'b2b'
export type FeatureStatus = 'active' | 'beta' | 'deprecated' | 'coming_soon' | 'development'
export type FeatureRequestStatus = 'submitted' | 'in_review' | 'ai_development' | 'admin_testing' | 'approved' | 'deployed'

export interface Feature {
  id: string
  slug: string
  name: string
  description: string
  long_description?: string
  category: string
  icon?: string
  status: FeatureStatus
  base_price_monthly: number
  additional_seats_price?: number
  relevant_for: Record<BusinessType, number> // relevance score 0-100
  components: string[] // list of React component names included
  dependencies?: string[] // feature slugs this depends on
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FeatureCategory {
  id: string
  name: string
  description?: string
  icon?: string
  order: number
  created_at: string
}

export interface FeatureTemplate {
  id: string
  name: string
  description: string
  for_business_type: BusinessType
  feature_ids: string[]
  icon?: string
  monthly_price: number
  is_popular: boolean
  metadata?: Record<string, any>
  created_at: string
}

export interface BusinessOwnerFeature {
  id: string
  business_id: string
  feature_id: string
  enabled_at: string
  custom_config?: Record<string, any>
  feature?: Feature // populated when doing joins
}

export interface FeatureRequest {
  id: string
  business_id: string
  requester_id: string
  feature_name: string
  description: string
  business_type_relevance: BusinessType[]
  status: FeatureRequestStatus
  ai_generated_code?: {
    components?: string
    migration?: string
    types?: string
    hooks?: string
  }
  admin_notes?: string
  admin_testing_status?: 'passed' | 'failed' | 'in_progress'
  admin_tested_by?: string
  admin_approval_at?: string
  make_available_to_all_businesses: boolean
  rollout_percentage?: number
  created_at: string
  updated_at: string
}

export interface BusinessOwnerProfile {
  id: string
  user_id: string
  business_type: BusinessType
  selected_template_id?: string
  theme_config?: {
    primary_color?: string
    secondary_color?: string
    logo_url?: string
    business_name?: string
    tagline?: string
  }
  onboarding_answers?: Record<string, any>
  custom_pricing_override?: number
  monthly_billing_amount?: number
  onboarding_status: 'pending' | 'in_progress' | 'completed'
  onboarding_completed_at?: string
  created_at: string
  updated_at: string
}

export interface FeatureBrowseFilters {
  category?: string
  status?: FeatureStatus
  businessType?: BusinessType
  priceRange?: {
    min: number
    max: number
  }
  searchQuery?: string
}
