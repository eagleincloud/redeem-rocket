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
