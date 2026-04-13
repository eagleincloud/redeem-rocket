# 🚀 GeoDeals - Quick Start Guide

## Overview

GeoDeals is a modern, map-first deals and commerce application with multi-role support, real-time auctions, and gamification features.

## 📦 What's Included

✅ **Complete Implementation** - All core features from the master prompt  
✅ **7 Main Pages** - Map, Explore, Auctions, Requirements, Wallet, Nearby Deals, Profile  
✅ **Business Dashboard** - Full business management interface  
✅ **Authentication** - Multi-role login system (Customer/Business)  
✅ **Gamification** - Daily rewards, streaks, and points system  
✅ **Modern UI** - Glassmorphic design with smooth animations  

## 🏃‍♂️ Getting Started

### 1. First Launch

When you first open the app, you'll be taken to the **Login Page**.

**Demo Login:**
- **Email:** Any valid email format
- **Password:** Any password
- **Role:** Choose between Customer or Business
- Click **Login** to enter the app

### 2. Exploring the App

After login, you'll land on the **Map View**:
- See business pins color-coded by deal type
- Tap any pin to view business details in a bottom sheet
- Use the filter bar at the top to filter by category
- Tap the filter icon for advanced filters

### 3. Navigation

**Circular FAB Menu** (bottom-right corner):
- Tap the + button to expand the menu
- Select any page: Home, Explore, Auctions, Requirements, Wallet, Nearby Deals, Profile
- Active page is highlighted with a white ring

### 4. Key Features to Try

**For Customers:**
1. **Browse Deals** - View offers on the map with countdown timers
2. **Participate in Auctions** - Place bids on exclusive items
3. **Post Requirements** - Submit needs and get quotes from businesses
4. **Earn Rewards** - Daily login streaks and reward points
5. **Manage Wallet** - Track cashback, coupons, and transactions

**For Business Owners:**
1. **Business Dashboard** - Access from Profile or login as Business
2. **Create Offers** - Set up deals with expiry times
3. **Start Auctions** - Launch auctions for products
4. **Respond to Requirements** - Send quotes to customer requests
5. **View Analytics** - Track revenue and customer engagement

## 🗺️ Google Maps Setup

**IMPORTANT:** The app uses a demo Google Maps API key that has usage limits.

### To Add Your Own API Key:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Maps JavaScript API**
4. Create API credentials
5. Copy your API key

6. **Replace the key in the code:**
   - Open `/src/app/components/MapView.tsx`
   - Find line 10: `const GOOGLE_MAPS_API_KEY = '...'`
   - Replace with your key
   - Save the file

## 🎯 Page Overview

### 🏠 Home (Map View)
- **Purpose:** Main interface for discovering nearby deals
- **Features:** Interactive map, custom pins, filters, bottom sheets
- **Tip:** Zoom and pan to explore different areas

### 🔎 Explore
- **Purpose:** Browse businesses by category
- **Features:** Search, trending businesses, featured merchants
- **Tip:** Use the category cards to quickly filter results

### 🔥 Auctions
- **Purpose:** Participate in live auctions
- **Features:** Real-time countdown, bid placement, auction history
- **Tip:** Watch the timer and bid before it expires!

### 📋 Requirements
- **Purpose:** Post needs and receive business quotes
- **Features:** Form submission, status tracking, business responses
- **Tip:** Be specific about your budget and urgency

### 💰 Wallet
- **Purpose:** Manage rewards and transactions
- **Features:** Balance, reward points, cashback, coupons, referrals
- **Tip:** Earn points by logging in daily and referring friends

### 🎯 Nearby Deals
- **Purpose:** List view of all available deals
- **Features:** Sorting, filtering, map/list toggle
- **Tip:** Sort by "Expiring Soon" to catch deals before they end

### 👤 Profile
- **Purpose:** User settings and saved items
- **Features:** Stats, saved businesses, order history, settings
- **Tip:** Switch to Business Dashboard from here if you're a business owner

## 🎮 Gamification Features

### Daily Login Rewards
- Log in daily to maintain your streak
- Earn 50 points per day
- 7-day streak unlocks premium bonuses

### Reward Points
- Earn points through:
  - Daily logins
  - Deal claims
  - Auction participation
  - Referrals
- Use points for discounts and special offers

### Notifications
- Top-right bell icon shows unread notifications
- Get alerts for:
  - Flash deals nearby
  - Auction endings
  - Requirement responses
  - Special promotions

## 🎨 Design Features

### Color Coding
- **Blue Pins:** Standard businesses
- **Purple Pins:** Premium merchants
- **Orange Pins:** Flash deals
- **Red Pins:** Active auctions

### Animations
- Smooth page transitions
- Bounce effects on buttons
- Slide-up bottom sheets
- Radial FAB menu expansion
- Pulse effects on urgent items

## 📱 Mobile Experience

The app is optimized for mobile devices:
- Touch-friendly buttons and controls
- Swipeable bottom sheets
- Scrollable horizontal filters
- Full-screen map experience

## 🔐 Authentication

### Current Implementation
- **Demo Mode:** Uses localStorage for session management
- **Supports:** Email/password login (UI only)
- **Social Login:** Google and GitHub buttons (UI ready, requires backend)

### For Production
To implement real authentication:
1. Connect to Supabase or your backend
2. Replace localStorage with real auth tokens
3. Implement social OAuth flows
4. Add password reset functionality

## 🛠️ Technical Details

### Tech Stack
- React 18.3.1 with TypeScript
- React Router 7.13.0 for navigation
- Google Maps (@vis.gl/react-google-maps)
- Motion (Framer Motion) for animations
- Tailwind CSS v4 for styling
- Lucide React for icons

### Mock Data
The app uses mock data in `/src/app/mockData.ts`:
- 6 sample businesses
- 6+ active offers
- 3 live auctions
- 2 customer requirements
- 4 wallet transactions

To replace with real data:
1. Connect to your backend API
2. Update components to fetch from API
3. Remove mock data imports

## 🐛 Troubleshooting

### Map Not Loading
- **Issue:** Blank white screen where map should be
- **Solution:** Replace the Google Maps API key with your own

### Pins Not Showing
- **Issue:** Map loads but no business pins appear
- **Solution:** Check browser console for errors, verify mock data is loading

### Navigation Not Working
- **Issue:** Can't switch between pages
- **Solution:** Clear browser cache and localStorage, refresh page

### Login Loop
- **Issue:** Keeps redirecting to login page
- **Solution:** Check localStorage (`user` key should exist after login)

## 📚 Additional Resources

### Documentation Files
- **GEO_DEALS_README.md** - Comprehensive technical documentation
- **FEATURES_IMPLEMENTED.md** - Complete feature checklist
- **COLOR_SCHEME.md** - Design system details
- **QUICK_START.md** - This file

### Code Structure
```
/src/app/
├── components/       # React components
├── types.ts         # TypeScript interfaces
├── mockData.ts      # Demo data
├── routes.tsx       # App routing
└── utils/          # Helper functions
```

## 🚀 Next Steps

### To Make It Production-Ready:
1. ✅ Replace Google Maps API key
2. ⬜ Connect to real backend (Supabase recommended)
3. ⬜ Implement real authentication
4. ⬜ Add error boundaries and loading states
5. ⬜ Implement payment gateway
6. ⬜ Add push notifications
7. ⬜ Optimize performance and bundle size
8. ⬜ Conduct security audit
9. ⬜ Add analytics tracking
10. ⬜ Deploy to production

### Recommended Enhancements:
- Real-time updates via WebSockets
- Geolocation for auto-centering map
- Push notifications for deal alerts
- Payment integration (Stripe/PayPal)
- Email/SMS notifications
- Advanced search with filters
- Chat system between users and businesses
- Reviews and ratings functionality
- Admin dashboard for platform management

## 💬 Support

For issues or questions:
1. Check the documentation files
2. Review the code comments
3. Check browser console for errors
4. Verify all packages are installed

## 🎉 Enjoy GeoDeals!

You now have a fully functional geo-based deals and commerce app. Explore the features, customize the design, and build on top of this foundation to create your perfect marketplace experience!

---

**Version:** 1.0.0  
**Last Updated:** March 4, 2026  
**Status:** Ready for Development
