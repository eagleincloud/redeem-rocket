import { Business, Offer, Auction, CustomerRequirement, WalletTransaction, Product } from './types';

export const mockBusinesses: Business[] = [
  {
    id: '1',
    name: 'Urban Coffee House',
    category: 'Food & Beverage',
    logo: '☕',
    location: { lat: 40.7589, lng: -73.9851 },
    address: '123 Main St, New York, NY',
    rating: 4.5,
    isPremium: true,
    is_claimed: true,
    offers: [
      { id: 'o1', businessId: '1', title: '20% OFF on all drinks', description: 'Valid for dine-in only', discount: 20, price: 299, expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), category: 'Food & Beverage', isFlashDeal: true, status: 'approved' },
    ]
  },
  {
    id: '2',
    name: 'Fashion Boutique',
    category: 'Fashion',
    logo: '👗',
    location: { lat: 40.7614, lng: -73.9776 },
    address: '456 Fashion Ave, New York, NY',
    rating: 4.2,
    hasAuction: true,
    is_claimed: true,
    offers: [
      { id: 'o2', businessId: '2', title: 'Buy 1 Get 1 Free', description: 'On selected items', discount: 50, price: 1999, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), category: 'Fashion', status: 'approved' },
    ]
  },
  {
    id: '3',
    name: 'Tech Gadgets Pro',
    category: 'Electronics',
    logo: '📱',
    location: { lat: 40.7549, lng: -73.9840 },
    address: '789 Tech Blvd, New York, NY',
    rating: 4.7,
    isPremium: true,
    is_claimed: true,
    offers: [
      { id: 'o3', businessId: '3', title: '30% OFF on accessories', description: 'Limited time offer', discount: 30, price: 999, expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), category: 'Electronics', status: 'approved' },
    ]
  },
  {
    id: '4',
    name: 'Wellness Spa',
    category: 'Health & Beauty',
    logo: '💆',
    location: { lat: 40.7580, lng: -73.9855 },
    address: '321 Relax St, New York, NY',
    rating: 4.8,
    is_claimed: false,
    offers: [
      { id: 'o4', businessId: '4', title: '40% OFF first visit', description: 'New customers only', discount: 40, price: 2499, expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), category: 'Health & Beauty', isFlashDeal: true, status: 'approved' },
    ]
  },
  {
    id: '5',
    name: 'Gourmet Pizza',
    category: 'Food & Beverage',
    logo: '🍕',
    location: { lat: 40.7565, lng: -73.9810 },
    address: '555 Pizza Lane, New York, NY',
    rating: 4.4,
    hasAuction: true,
    is_claimed: false,
    offers: [
      { id: 'o5', businessId: '5', title: 'Free delivery on orders over ₹800', description: 'Use code: FREEDEL', discount: 15, price: 799, expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000), category: 'Food & Beverage', status: 'approved' },
    ]
  },
  {
    id: '6',
    name: 'Fitness Zone',
    category: 'Health & Fitness',
    logo: '💪',
    location: { lat: 40.7600, lng: -73.9820 },
    address: '888 Gym Street, New York, NY',
    rating: 4.6,
    isPremium: true,
    is_claimed: true,
    offers: [
      { id: 'o6', businessId: '6', title: '25% OFF monthly membership', description: 'Join today!', discount: 25, price: 1999, expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), category: 'Health & Fitness', status: 'approved' },
    ]
  },
];

export const mockAuctions: Auction[] = [
  {
    id: 'a1',
    businessId: '2',
    businessName: 'Fashion Boutique',
    title: 'Designer Handbag Collection',
    description: 'Authentic designer handbags at auction prices',
    startingBid: 4000,
    currentBid: 9500,
    endsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
    image: '👜',
    totalBids: 15,
  },
  {
    id: 'a2',
    businessId: '5',
    businessName: 'Gourmet Pizza',
    title: 'Pizza Party Package for 20',
    description: 'Complete party package with drinks and desserts',
    startingBid: 8000,
    currentBid: 14500,
    endsAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
    image: '🍕',
    totalBids: 22,
  },
  {
    id: 'a3',
    businessId: '3',
    businessName: 'Tech Gadgets Pro',
    title: 'Latest Wireless Earbuds',
    description: 'Brand new, sealed in box',
    startingBid: 2500,
    currentBid: 6800,
    endsAt: new Date(Date.now() + 8 * 60 * 60 * 1000),
    image: '🎧',
    totalBids: 18,
  },
];

export const mockRequirements: CustomerRequirement[] = [
  {
    id: 'r1',
    customerId: 'user1',
    title: 'Need AC Repair Today',
    description: 'My AC stopped working and its very hot. Need urgent repair.',
    category: 'Home Services',
    budget: 1500,
    urgency: 'high',
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    responses: [
      {
        id: 'res1',
        businessId: 'b1',
        businessName: 'Cool Air Solutions',
        message: 'We can send a technician within 2 hours',
        price: 1200,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      }
    ]
  },
  {
    id: 'r2',
    customerId: 'user1',
    title: 'Catering for Birthday Party',
    description: 'Need catering for 30 people, vegetarian options preferred',
    category: 'Food & Beverage',
    budget: 15000,
    urgency: 'medium',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

/** Products per business for full business page / cart — MRP + selling_price for cashback calculation */
export const mockProductsByBusiness: Record<string, Product[]> = {
  '1': [
    { id: 'p1-1', businessId: '1', name: 'Latte', description: 'Espresso with steamed milk', mrp: 350, selling_price: 250, price: 350, category: 'Drinks' },
    { id: 'p1-2', businessId: '1', name: 'Cappuccino', description: 'Espresso with foamed milk', mrp: 320, selling_price: 230, price: 320, category: 'Drinks' },
    { id: 'p1-3', businessId: '1', name: 'Croissant', description: 'Fresh butter croissant', mrp: 180, selling_price: 130, price: 180, category: 'Food' },
  ],
  '2': [
    { id: 'p2-1', businessId: '2', name: 'Summer Dress', description: 'Light cotton dress', mrp: 1999, selling_price: 1400, price: 1999, category: 'Clothing' },
    { id: 'p2-2', businessId: '2', name: 'Designer Handbag', description: 'Leather handbag', mrp: 4999, selling_price: 3500, price: 4999, category: 'Accessories' },
  ],
  '3': [
    { id: 'p3-1', businessId: '3', name: 'Phone Case', description: 'Protective case', mrp: 599, selling_price: 400, price: 599, category: 'Accessories' },
    { id: 'p3-2', businessId: '3', name: 'Wireless Earbuds', description: 'Noise cancelling', mrp: 7999, selling_price: 6000, price: 7999, category: 'Electronics' },
  ],
  '4': [
    { id: 'p4-1', businessId: '4', name: '60-min Massage', description: 'Full body massage', mrp: 2999, selling_price: 2200, price: 2999, category: 'Services' },
    { id: 'p4-2', businessId: '4', name: 'Facial Treatment', description: 'Cleansing and moisturizing', mrp: 1999, selling_price: 1500, price: 1999, category: 'Services' },
  ],
  '5': [
    { id: 'p5-1', businessId: '5', name: 'Margherita Pizza', description: 'Large 14"', mrp: 499, selling_price: 380, price: 499, category: 'Food' },
    { id: 'p5-2', businessId: '5', name: 'Pepperoni Pizza', description: 'Large 14"', mrp: 599, selling_price: 450, price: 599, category: 'Food' },
  ],
  '6': [
    { id: 'p6-1', businessId: '6', name: 'Monthly Membership', description: 'Gym access', mrp: 2499, selling_price: 1800, price: 2499, category: 'Membership' },
  ],
};

const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
const nineMonthsFromNow = new Date(Date.now() + 270 * 24 * 60 * 60 * 1000).toISOString();
const twentyDaysFromNow = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

export const mockTransactions: WalletTransaction[] = [
  {
    id: 't1',
    type: 'cashback',
    amount: 45,
    description: 'Cashback from Urban Coffee House',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    expiry_date: oneYearFromNow,
  },
  {
    id: 't2',
    type: 'cashback',
    amount: 125,
    description: 'Cashback from Fashion Boutique',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    expiry_date: nineMonthsFromNow,
  },
  {
    id: 't3',
    type: 'payment',
    amount: -200,
    description: 'Used for purchase at Tech Gadgets Pro',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
  },
  {
    id: 't4',
    type: 'cashback',
    amount: 80,
    description: 'Cashback from Gourmet Pizza',
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
    expiry_date: twentyDaysFromNow,
  },
];
