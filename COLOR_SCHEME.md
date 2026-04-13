# GeoDeals Color Scheme & Design System

## 🎨 Primary Color Palette

### Main Gradients
- **Primary**: `from-blue-500 to-purple-600` (#3B82F6 → #9333EA)
  - Used for: Main buttons, primary actions, hero sections
  
- **Secondary**: `from-pink-500 to-purple-600` (#EC4899 → #9333EA)
  - Used for: Nearby Deals, premium features

- **Accent**: `from-orange-500 to-red-600` (#F97316 → #DC2626)
  - Used for: Flash deals, urgent notifications

## 📍 Page-Specific Colors

### Home / Map View
- **Filter Pills**: Blue-500 to Purple-600 gradient
- **Pin Colors**:
  - Premium: Purple-500 (#8B5CF6)
  - Auction: Red-500 (#EF4444)
  - Flash Deal: Orange-500 (#F59E0B)
  - Standard: Blue-500 (#3B82F6)
- **Offer Badges**: Red-500 (#EF4444)

### Explore Page
- **Background**: Blue-50 to White gradient
- **Header**: Blue-500 to Purple-600
- **Categories**:
  - Food: Orange-100/Orange-600
  - Fashion: Pink-100/Pink-600
  - Electronics: Blue-100/Blue-600
  - Health: Purple-100/Purple-600
  - Fitness: Green-100/Green-600
  - Home: Yellow-100/Yellow-600

### Auctions Page
- **Background**: Red-50 to White
- **Header**: Red-500 to Orange-600
- **Timer**: Red-100 to Orange-100
- **Bid Button**: Red-500 to Orange-600
- **Stats**: Red/Orange/Purple-600

### Requirements Page
- **Background**: Green-50 to White
- **Header**: Green-500 to Teal-600
- **Urgency Badges**:
  - High: Red-100/Red-700
  - Medium: Orange-100/Orange-700
  - Low: Green-100/Green-700
- **Status Badges**:
  - Open: Green-100/Green-700
  - In Progress: Blue-100/Blue-700
  - Completed: Gray-100/Gray-700
- **Action Button**: Green-500 to Teal-600

### Wallet Page
- **Background**: Yellow-50 to White
- **Header**: Yellow-500 to Orange-600
- **Balance Card**: White/20 with backdrop blur
- **Income**: Green-50/Green-600
- **Expense**: Red-50/Red-600
- **Transaction Types**:
  - Reward: Purple-100/Purple-600
  - Cashback: Green-100/Green-600
  - Payment: Red-100/Red-600
  - Refund: Blue-100/Blue-600
- **Coupons**:
  - Coupon 1: Pink-100 to Purple-100
  - Coupon 2: Orange-100 to Yellow-100

### Nearby Deals Page
- **Background**: Pink-50 to White
- **Header**: Pink-500 to Purple-600
- **Stats**: Pink/Orange/Purple-600
- **Deal Cards**: Orange-50 to Pink-50
- **Claim Button**: Pink-500 to Purple-600

### Profile Page
- **Background**: Indigo-50 to White
- **Header**: Indigo-500 to Purple-600
- **Profile Card**: White/20 with backdrop blur
- **Menu Icons**:
  - Saved: Pink-100/Pink-600
  - Offers: Blue-100/Blue-600
  - Auctions: Orange-100/Orange-600
  - Requirements: Green-100/Green-600
  - Orders: Purple-100/Purple-600
  - Notifications: Yellow-100/Yellow-600
  - Payment: Indigo-100/Indigo-600
  - Settings: Gray-100/Gray-600
- **Premium Card**: Yellow-400 to Pink-500 (gold gradient)

### Business Dashboard
- **Background**: Blue-50 to White
- **Header**: Blue-600 to Indigo-700
- **Stats**:
  - Revenue: Green-100/Green-600
  - Customers: Blue-100/Blue-600
  - Offers: Orange-100/Orange-600
  - Requests: Purple-100/Purple-600
- **Quick Actions**:
  - Create Offer: Blue-500 to Indigo-600
  - Start Auction: Red-500 to Orange-600
  - View Requests: Green-500 to Teal-600
  - Analytics: Purple-500 to Pink-600

## 🔔 Notification & Alert Colors

### Notification Badge
- **Icon Background**: White with shadow
- **Unread Badge**: Red-500 (#EF4444)
- **Notification Types**:
  - Deal: Orange theme
  - Auction: Red theme
  - Requirement: Blue theme

### Gamification
- **Daily Reward Modal**: Purple-500 to Pink-500 to Orange-500 (triple gradient)
- **Streak Badge**: Orange-500 to Red-600
- **Fire Icon**: Orange-600 (with pulse animation)
- **Progress Circles**:
  - Complete: Orange-500
  - Incomplete: Gray-200

## 🎯 Status Colors

### Deal Status
- **Active**: Green
- **Expiring**: Orange
- **Flash**: Red (with pulse)
- **Premium**: Purple

### Urgency Levels
- **High**: Red-100/Red-700
- **Medium**: Orange-100/Orange-700
- **Low**: Green-100/Green-700

### Transaction Types
- **Positive** (Income, Reward, Cashback): Green-600
- **Negative** (Payment, Expense): Red-600
- **Neutral** (Refund, Transfer): Blue-600

## 🌓 Dark Mode Support

The app uses Tailwind's dark mode classes:
- Background: `dark:bg-gray-900`
- Text: `dark:text-white`
- Cards: `dark:bg-gray-800`
- Borders: `dark:border-gray-700`

## 📏 Design Tokens

### Border Radius
- **Small**: 8px (`rounded-lg`)
- **Medium**: 12px (`rounded-xl`)
- **Large**: 16px (`rounded-2xl`)
- **Extra Large**: 24px (`rounded-3xl`)
- **Full**: 9999px (`rounded-full`)

### Shadows
- **Small**: `shadow-md`
- **Medium**: `shadow-lg`
- **Large**: `shadow-xl`
- **Extra Large**: `shadow-2xl`

### Backdrop Effects
- **Blur**: `backdrop-blur-sm` to `backdrop-blur-lg`
- **Opacity**: `bg-white/95`, `bg-white/20`, `bg-black/50`

## 🎭 Glassmorphism Recipe

Standard glassmorphic card:
```css
bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg
```

Enhanced glassmorphic card:
```css
bg-white/20 backdrop-blur-lg rounded-3xl border border-white/30
```

## 🌈 Gradient Recipes

### Primary Action
```css
bg-gradient-to-r from-blue-500 to-purple-600
```

### Warning/Alert
```css
bg-gradient-to-r from-orange-500 to-red-600
```

### Success
```css
bg-gradient-to-r from-green-500 to-teal-600
```

### Premium/Luxury
```css
bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500
```

### Background Gradients
```css
bg-gradient-to-b from-{color}-50 to-white
bg-gradient-to-br from-{color}-100 to-{color2}-100
```

## 🎨 Typography Scale

### Font Sizes (via Tailwind)
- **xs**: 0.75rem (12px)
- **sm**: 0.875rem (14px)
- **base**: 1rem (16px)
- **lg**: 1.125rem (18px)
- **xl**: 1.25rem (20px)
- **2xl**: 1.5rem (24px)
- **3xl**: 1.875rem (30px)
- **4xl**: 2.25rem (36px)
- **5xl**: 3rem (48px)

### Font Weights
- **normal**: 400
- **medium**: 500
- **semibold**: 600
- **bold**: 700

## 🎯 Accessibility

### Contrast Ratios
All color combinations meet WCAG AA standards:
- Text on backgrounds: Minimum 4.5:1
- Large text: Minimum 3:1
- Interactive elements: Clear focus states

### Focus States
- Default: `focus:outline-none focus:ring-2 focus:ring-{color}-500`
- Ring offset: `focus:ring-offset-2`

## 💡 Color Usage Guidelines

1. **Consistency**: Use the same gradient for similar actions across the app
2. **Hierarchy**: Primary actions use bold gradients, secondary use subtle backgrounds
3. **Context**: Page-specific colors help users understand their location
4. **Accessibility**: Always test color combinations for sufficient contrast
5. **Motion**: Gradients can animate on hover for enhanced interactivity

## 🎨 Brand Colors Summary

| Color Name | Hex Code | Usage |
|------------|----------|--------|
| Primary Blue | #3B82F6 | Main brand color |
| Primary Purple | #9333EA | Accent brand color |
| Success Green | #10B981 | Success states |
| Warning Orange | #F97316 | Warnings, flash deals |
| Danger Red | #EF4444 | Errors, urgent items |
| Info Blue | #3B82F6 | Information |
| Premium Purple | #8B5CF6 | Premium features |
| Gold | #F59E0B | Rewards, premium |

This color system creates a vibrant, modern, and cohesive user experience throughout the GeoDeals application.
