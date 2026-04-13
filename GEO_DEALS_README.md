# GeoDeals - Geo-Based Multi-User Deals & Commerce App

A modern, map-first deals and commerce application built with React, TypeScript, and Google Maps.

## 🎯 Features

### Core Functionality
- **Map-First Interface**: Interactive Google Maps with custom business pins showing live offers
- **Multi-Role Authentication**: Support for Customer, Business Owner, Manager, and Admin roles
- **Smart Business Pins**: Color-coded pins based on deal type (premium, auction, flash deals)
- **Real-Time Auctions**: Live bidding system with countdown timers
- **Customer Requirements**: Post needs and receive business responses
- **Digital Wallet**: Manage rewards, cashback, coupons, and transactions
- **Nearby Deals**: Discover and filter deals by distance, discount, and category

### Pages & Navigation
1. **Home (Map View)**: Full-screen map with filterable business markers
2. **Explore**: Browse by category, trending businesses, and featured merchants
3. **Auctions**: Live auction cards with real-time bidding
4. **Customer Requirements**: Post requirements and receive quotes from businesses
5. **Wallet**: View balance, reward points, transactions, and coupons
6. **Nearby Deals**: List view of all deals with sorting options
7. **Profile**: User settings, saved items, order history, and subscription
8. **Business Dashboard**: For business users to manage offers, auctions, and analytics

### UI/UX Features
- **Circular Expandable FAB Menu**: Smooth radial animation for main navigation
- **Bottom Sheets**: Glassmorphic panels for business details
- **Modern Design**: Rounded cards (16-20px radius), soft shadows, smooth animations
- **Responsive Filters**: Category-based filtering and advanced search
- **Flash Deal Indicators**: Urgency badges and countdown timers
- **Rating & Review System**: Display business ratings and distances

## 🛠 Technology Stack

- **React 18** with TypeScript
- **React Router 7** for navigation
- **Google Maps API** (@vis.gl/react-google-maps)
- **Motion** (Framer Motion) for animations
- **Tailwind CSS v4** for styling
- **Lucide React** for icons
- **Date-fns** for date formatting

## 📁 Project Structure

```
/src/app/
├── components/
│   ├── MapView.tsx              # Main map interface
│   ├── CircularFABMenu.tsx      # Expandable navigation menu
│   ├── LoginPage.tsx            # Authentication page
│   ├── ExplorePage.tsx          # Browse businesses & categories
│   ├── AuctionsPage.tsx         # Live auctions
│   ├── CustomerRequirementPage.tsx  # Post & manage requirements
│   ├── WalletPage.tsx           # Digital wallet & transactions
│   ├── NearbyDealsPage.tsx      # Deals list view
│   ├── ProfilePage.tsx          # User profile & settings
│   ├── BusinessDashboard.tsx    # Business management
│   ├── BusinessBottomSheet.tsx  # Business details popup
│   ├── Root.tsx                 # Layout wrapper
│   └── SetupInfo.tsx            # Setup instructions
├── types.ts                     # TypeScript interfaces
├── mockData.ts                  # Demo data
├── routes.tsx                   # App routing
└── utils/
    └── formatTime.ts            # Time formatting utilities
```

## 🚀 Getting Started

### Prerequisites
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Maps JavaScript API
   - Enable Places API (optional, for enhanced features)

### Setup
1. Replace the Google Maps API key in `/src/app/components/MapView.tsx`:
   ```typescript
   const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY_HERE';
   ```

2. The app uses mock data for demonstration. To connect to a real backend:
   - Implement API calls in each component
   - Replace mock data with actual API responses
   - Set up Supabase or your preferred backend

### Login
- **Default Login**: The app uses localStorage for demo authentication
- **Roles**: Switch between Customer and Business roles on the login screen
- **Social Login**: Google and GitHub login UI included (requires backend setup)

## 🎨 Design System

### Color Scheme
- **Primary Gradient**: Blue to Purple (`from-blue-500 to-purple-600`)
- **Success**: Green tones
- **Warning**: Orange/Yellow tones
- **Danger**: Red tones
- **Premium**: Purple tones

### Component Patterns
- **Cards**: White background, rounded-2xl (16px), shadow-lg
- **Buttons**: Gradient backgrounds, rounded-xl, hover effects
- **Inputs**: Border-2, rounded-xl, focus ring
- **Badges**: Rounded-full, colored backgrounds

## 🔧 Customization

### Adding New Business Categories
Edit `/src/app/mockData.ts` and add categories to businesses.

### Modifying Map Markers
Update `getPinColor()` function in `/src/app/components/MapView.tsx`

### Changing Navigation Items
Edit `menuItems` array in `/src/app/components/CircularFABMenu.tsx`

## 📱 Responsive Design
The app is designed mobile-first but works across all screen sizes:
- Mobile: Optimized touch interactions, full-screen map
- Tablet: Enhanced layouts with more visible information
- Desktop: Multi-column layouts, hover states

## 🎯 Key User Flows

### Customer Flow
1. Login → Map View (see nearby deals)
2. Tap business pin → View details in bottom sheet
3. Navigate to business or claim deal
4. Post requirements → Receive quotes from businesses
5. Participate in auctions → Place bids
6. Manage wallet → Track rewards and cashback

### Business Flow
1. Login as Business → Business Dashboard
2. Create offers → Set discounts and expiry
3. Start auctions → Manage bidding
4. Respond to requirements → Send quotes
5. View analytics → Track performance

## 🔮 Future Enhancements
- AI-powered deal recommendations
- Geo-fenced push notifications
- Heatmap visualization of popular businesses
- In-app messaging between customers and businesses
- Real-time auction updates via WebSockets
- Payment gateway integration
- Advanced analytics dashboard
- Multi-language support

## 📝 Notes

- Replace demo Google Maps API key with your own
- Mock data is used for demonstration purposes
- Social login requires additional backend configuration
- For production, implement proper authentication and data persistence
- Consider adding error boundaries for better error handling
- Implement proper state management (Redux/Zustand) for larger scale

## 🙏 Credits

- UI Components: shadcn/ui
- Icons: Lucide React
- Maps: Google Maps Platform
- Animations: Motion (Framer Motion)
