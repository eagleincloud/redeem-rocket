export type UserRole = 'customer' | 'business' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  /** Rule-derived type for map icons: restaurant, grocery, pharmacy, salon, hotel, atm, other */
  businessType?: string;
  logo: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  rating: number;
  distance?: number;
  offers: Offer[];
  hasAuction?: boolean;
  isPremium?: boolean;
  /** Whether a merchant has claimed this business */
  is_claimed?: boolean;
  claimed_by?: string;
}

export interface Offer {
  id: string;
  businessId: string;
  title: string;
  description: string;
  discount: number;
  expiresAt: Date;
  category: string;
  isFlashDeal?: boolean;
  /** Optional price for add-to-cart (e.g. product or service price before discount). */
  price?: number;
  /** Approval lifecycle — only 'approved' offers are shown to customers */
  status?: 'pending_approval' | 'approved' | 'rejected';
  rejection_reason?: string;
}

export interface Auction {
  id: string;
  businessId: string;
  businessName: string;
  title: string;
  description: string;
  startingBid: number;
  currentBid: number;
  endsAt: Date;
  image: string;
  totalBids: number;
}

export interface CustomerRequirement {
  id: string;
  customerId: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'completed';
  createdAt: Date;
  images?: string[];
  responses?: RequirementResponse[];
}

export interface RequirementResponse {
  id: string;
  businessId: string;
  businessName: string;
  message: string;
  price: number;
  createdAt: Date;
}

export interface WalletTransaction {
  id: string;
  type: 'cashback' | 'payment' | 'refund';
  amount: number;
  description: string;
  createdAt: Date;
  /** ISO date string — cashback credits expire 1 year after being credited */
  expiry_date?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
  read: boolean;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  description: string;
  /** MRP — the price customer pays */
  mrp: number;
  /** Selling price — what platform pays the merchant. Must be < mrp. */
  selling_price: number;
  /** Alias for mrp — used for cart/order total display */
  price: number;
  image?: string;
  category: string;
}

export interface CartItem {
  product?: Product;
  offer?: Offer;
  businessId: string;
  businessName: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  businessId: string;
  businessName: string;
  verificationCode: string;
  createdAt: Date;
  items: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  /** Whether the merchant has redeemed/fulfilled this order. */
  redeemed?: boolean;
  /** Pre-computed cashback amount (₹1 to floor((mrp−sp)/2) per item) */
  cashbackAmount?: number;
}

// ─── Business app types ───────────────────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise';

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessPhoto {
  id: string;
  url: string;
  isCover: boolean;
  order: number;
}

export interface BusinessDocument {
  id: string;
  businessId: string;
  documentType: 'business_license' | 'tax_id' | 'owner_id' | 'address_proof' | 'bank_details';
  fileUrl: string;
  uploadedAt: string;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface CompleteBusinessProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessId: string | null;
  businessName: string | null;
  businessLogo: string;
  businessCategory: string;
  plan: SubscriptionPlan;
  planExpiry: string | null;
  onboarding_done: boolean;
  ownerPhone?: string;
  ownerPhotoUrl?: string;
  ownerBio?: string;
  businessDescription?: string;
  businessWebsite?: string;
  businessEmail?: string;
  businessPhone?: string;
  businessWhatsApp?: string;
  serviceRadius?: number;
  serviceAreas?: string[];
  mapLat?: number;
  mapLng?: number;
  documents?: Record<string, string>;
  acceptedPayments?: string[];
}
