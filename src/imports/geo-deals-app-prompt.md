Here is a **high-quality, structured product prompt** you can use for AI-based app generation (Lovable, Cursor, Bolt, v0, Replit AI, etc.) or to brief a design + dev team.

---

# 🚀 MASTER PROMPT — Geo-Based Multi-User Deals & Commerce App

---

## 🧠 Product Vision

Create a **modern, scalable, multi-user geo-commerce application** where the **Map is the core interface** and all business discovery, offers, auctions, and engagement revolve around it.

The experience must be:

* Map-first
* Clean and intuitive
* Offer-focused
* Gamified but not confusing
* Designed for daily engagement

The goal is to allow customers to visually discover nearby affiliated businesses and instantly see **live offers directly on the map pins**.

---

# 🏗 1. Core Architecture

Build a **multi-login / multi-role application** with:

### User Roles

* Customer
* Business Owner
* Manager (optional for B2B growth)
* Admin

Each role must have role-based access control (RBAC).

---

# 🗺 2. Main Screen (Primary Experience)

## 📍 Map-Centric Home Page (Default After Login)

When a user logs in, they must land on:

> A full-screen interactive Google Map centered on their current GPS location.

### Map Requirements

* Use Google Maps SDK
* Auto-detect current location (with permission)
* Show affiliated businesses as interactive pins
* Cluster pins when zoomed out
* Smooth zoom & pan experience
* Dark mode support

---

## 📌 Smart Business Pins

Each business pin must:

* Display business logo as pin marker
* Show live offer badge overlay (e.g., "20% OFF Today")
* Show auction badge if active
* Change color based on:

  * Live deals
  * Expiring soon
  * Premium merchant

### On Tap of Pin:

Open bottom sheet with:

* Business name
* Distance from user
* Today’s offers
* Flash deals
* Auction status
* “Navigate” button
* “Save Business” option
* “View Details” CTA

---

# 🎁 3. Offer Display Logic

Offers must:

* Appear visually above the pin
* Show urgency indicator (e.g., "Ends in 2h")
* Allow quick tap-to-view
* Support filters:

  * Nearby Deals
  * Expiring Soon
  * Highest Discount
  * Category-based (Food, Fashion, Electronics)

---

# ➕ 4. Floating Action Button (FAB) Circular Expandable Menu

Bottom-right corner:

A **modern circular FAB menu** that expands with smooth animation.

### Menu Items:

* 🏠 Home (Map View)
* 🔎 Explore
* 🔥 Auctions
* 📋 Customer Requirement
* 💰 Wallet
* 🎯 Nearby Deals
* 👤 Profile

Expandable animation should be:

* Smooth radial expansion
* Micro-interactions
* Haptic feedback on tap

---

# 📄 5. Secondary Pages (Each Opens as Separate Page)

## 🏠 Home

* Returns to Map View
* Default landing page

---

## 🔎 Explore Page

Purpose: Structured browsing beyond map

Features:

* Category browsing
* Search bar (business or offer)
* Trending businesses
* Featured merchants
* Recommended for you (future AI-ready)

---

## 🔥 Auctions Page

Features:

* Live auction cards
* Countdown timers
* Real-time bid updates
* Bid history
* Auto-bid support
* Auction map integration (highlighted pins)

---

## 📋 Customer Requirement Page

Allow users to:

* Post a requirement (e.g., “Need AC repair today”)
* Select category
* Add budget
* Add urgency
* Attach photos
* Allow businesses to respond

Include:

* Status tracking
* Chat option

---

## 💰 Wallet Page

Features:

* Reward points
* Cashback history
* Coupons
* Transaction history
* Referral bonuses
* In-app payment integration
* QR code scanner for merchant payments

---

## 🎯 Nearby Deals Page

* List-based deals sorted by distance
* Toggle map/list view
* Filter by:

  * Highest discount
  * Trending
  * Expiring
  * Category

---

## 👤 Profile Page

* User info
* Saved businesses
* Saved offers
* My auctions
* My requirements
* Order history
* Notification settings
* Subscription plan
* Logout

---

# 🧩 6. Additional Essential Features (Add These)

These are important for production-grade app experience:

---

## 🔔 Notifications System

* Offer expiring alerts
* Auction bid alerts
* Requirement response alerts
* Nearby hot deal alerts (geo-triggered)

---

## 💬 In-App Chat

* Customer ↔ Business messaging
* Push notifications
* Read receipts

---

## ⭐ Ratings & Reviews

* Business ratings
* Review submission
* Verified customer badges

---

## 🧭 Smart Navigation

* One-tap Google Maps redirect
* Distance & ETA display

---

## 🏆 Gamification

* Daily login rewards
* Deal streaks
* Referral leaderboard
* Reward tiers

---

## 🔐 Authentication System

* Email login
* Google login
* OTP login (mobile-first option)
* Role-based dashboards

---

## 📊 Business Side (If Role-Based)

Business dashboard:

* Create offers
* Start auctions
* Respond to customer requirements
* View analytics
* Boost listing
* Manage wallet earnings

---

# 🎨 Design Guidelines (Very Important)

Design must be:

* Modern (2026 UI standard)
* Clean minimal layout
* Rounded cards (16–20px radius)
* Soft shadows
* Smooth animations
* Floating glassmorphism panels for bottom sheets
* Dark/light mode
* Bottom-sheet first navigation
* Non-cluttered UI (map remains dominant)

---

# ⚙️ Technical Recommendations

Frontend:

* Flutter / React Native (cross-platform)
* Google Maps SDK

Backend:

* Firebase or Supabase
* Real-time database for auctions
* Push notifications via FCM

Infra:

* AWS / GCP scalable backend
* CDN for assets

---

# 📈 Future-Ready Features (Architectural Consideration)

Design with scalability for:

* AI deal recommendations
* Geo-fenced promotions
* Heatmap of popular businesses
* Dynamic surge offers
* ONDC-style integration
* Subscription tiers for businesses

---

# 🎯 UX Principle

> The map must always feel like the center of gravity.
> Users should never feel lost.
> Everything must be reachable in ≤ 2 taps from the map.

---

# 🧠 Final Product Outcome

The app should:

* Encourage daily usage
* Increase merchant visibility
* Help users discover nearby value instantly
* Reduce confusion via map-first navigation
* Blend commerce + discovery + engagement

---

If you want, I can now:

* Convert this into a **technical architecture diagram**
* Create a **product requirement document (PRD)**
* Design a **monetization strategy**
* Or generate a **pitch deck outline for investors**
