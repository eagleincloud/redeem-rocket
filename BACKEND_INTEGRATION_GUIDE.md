# 🔗 Backend Integration Guide - Registration Flow

## Overview

The new registration flow is now fully connected with a complete backend API built on **Supabase Edge Functions** and **PostgreSQL**. This guide explains the architecture, API endpoints, database schema, and how everything works together.

## Architecture

```
Frontend (React)
    ↓
API Client (registrationAPI.ts)
    ↓
Supabase Edge Function (registration-api)
    ↓
PostgreSQL Database
    ├── businesses
    ├── business_registrations
    └── design_presets
```

## Backend API Endpoints

### Base URL
```
{SUPABASE_URL}/functions/v1/registration-api
```

### 1. Submit Registration
**POST** `/register/submit`

Saves complete registration data and creates business record.

**Request Body:**
```json
{
  "businessName": "My Restaurant",
  "email": "owner@restaurant.com",
  "phone": "+91-9876543210",
  "category": "restaurant",
  "location": "Mumbai, India",
  "teamSize": "2-10",
  "businessStage": "growing",
  "targetAudience": "regional",
  "goals": ["get-new-customers", "increase-sales"],
  "challenges": ["managing-customer-data"],
  "monthlyCustomers": "200-1000",
  "socialMedia": ["instagram", "whatsapp"],
  "selectedFeatures": ["lead-management", "whatsapp-marketing"],
  "appName": "My Restaurant",
  "stylePresetId": "restaurant-rustic",
  "primaryColor": "#8B4513",
  "accentColor": "#FFB347",
  "bgColor": "#FDF5E6",
  "theme": "light",
  "fontStyle": "classic",
  "layoutStyle": "card",
  "buttonStyle": "rounded"
}
```

**Response (Success):**
```json
{
  "success": true,
  "registrationId": "uuid-here",
  "businessId": "uuid-here",
  "message": "Registration submitted. Please verify your email."
}
```

**Response (Error):**
```json
{
  "error": "Email already registered"
}
```

---

### 2. Validate Email
**POST** `/register/validate-email`

Check if an email address is available.

**Request Body:**
```json
{
  "email": "owner@restaurant.com"
}
```

**Response:**
```json
{
  "available": true,
  "email": "owner@restaurant.com"
}
```

---

### 3. Create Business Account
**POST** `/register/create-business`

Create business account after email verification (call this after user verifies email).

**Request Body:**
```json
{
  "registrationId": "uuid-here",
  "userId": "auth.users.id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Business account created successfully",
  "businessId": "uuid-here"
}
```

---

### 4. Get Design Presets
**GET** `/register/presets/:category`

Fetch design presets for a specific category.

**URL Parameters:**
- `category` - Business category (e.g., "restaurant", "salon-spa", "fitness")

**Response:**
```json
{
  "category": "restaurant",
  "presets": [
    {
      "id": "restaurant-rustic",
      "name": "Rustic Kitchen",
      "tagline": "Warm, homey, and inviting",
      "primary": "#8B4513",
      "accent": "#FFB347",
      "theme": "light",
      "mood": "🏡 Warm & Cozy"
    },
    {
      "id": "restaurant-fine",
      "name": "Fine Dining",
      "tagline": "Midnight elegance, gold accents",
      "primary": "#C8A951",
      "accent": "#F5F5F0",
      "theme": "dark",
      "mood": "✦ Fine & Elegant"
    }
  ],
  "count": 2
}
```

## Database Schema

### businesses
Stores basic business information.

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  location VARCHAR(255),
  team_size VARCHAR(50),
  business_stage VARCHAR(50),
  target_audience VARCHAR(100),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### business_registrations
Stores complete registration data with all user inputs and preferences.

```sql
CREATE TABLE business_registrations (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  
  -- Goals & Challenges
  goals JSONB,
  challenges JSONB,
  monthly_customers VARCHAR(50),
  social_media JSONB,
  
  -- Features
  selected_features JSONB,
  
  -- Customization
  app_name VARCHAR(255),
  style_preset_id VARCHAR(100),
  primary_color VARCHAR(7),
  accent_color VARCHAR(7),
  bg_color VARCHAR(7),
  theme VARCHAR(20),
  font_style VARCHAR(50),
  layout_style VARCHAR(50),
  button_style VARCHAR(50),
  
  -- Status
  status VARCHAR(50), -- pending_email_verification | completed | cancelled
  
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### design_presets
Stores design presets for each business category.

```sql
CREATE TABLE design_presets (
  id UUID PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  tagline TEXT,
  primary_color VARCHAR(7),
  accent_color VARCHAR(7),
  background_color VARCHAR(7),
  theme VARCHAR(20),
  font_style VARCHAR(50),
  layout_style VARCHAR(50),
  button_style VARCHAR(50),
  grad_from VARCHAR(7),
  grad_to VARCHAR(7),
  mood VARCHAR(100),
  is_featured BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  
  UNIQUE(category, name)
);
```

## Frontend API Client

Located at: `src/business/lib/registrationAPI.ts`

### Usage Examples

**Submit Registration:**
```typescript
import { submitRegistration } from '@/business/lib/registrationAPI';

const result = await submitRegistration({
  businessName: 'My Restaurant',
  email: 'owner@example.com',
  // ... other fields
});

console.log(result.registrationId); // UUID
console.log(result.businessId);     // UUID
```

**Validate Email:**
```typescript
import { validateEmail } from '@/business/lib/registrationAPI';

const result = await validateEmail('owner@example.com');
console.log(result.available); // true or false
```

**Create Business:**
```typescript
import { createBusiness } from '@/business/lib/registrationAPI';

const result = await createBusiness(registrationId, userId);
console.log(result.success); // true
```

**Get Presets:**
```typescript
import { getPresetsForCategory } from '@/business/lib/registrationAPI';

const result = await getPresetsForCategory('restaurant');
console.log(result.presets); // Array of design presets
```

## Frontend Integration

### Preview Component
The `Preview.tsx` component has been updated to:

1. **Collect registration data** from localStorage (via `appState.ts`)
2. **Call API on launch** - When user clicks "Go Live!" button
3. **Handle loading state** - Shows spinner during API call
4. **Handle errors** - Displays error message if submission fails
5. **Clear data & redirect** - On success, clears localStorage and navigates to dashboard

```typescript
const handleLaunch = async () => {
  try {
    const result = await submitRegistration(appData);
    clearAppData();
    navigate('/dashboard');
  } catch (error) {
    setError(error.message);
  }
};
```

## State Flow

```
Welcome Page
    ↓ (Save to localStorage via appState)
Business Details
    ↓ (Save to localStorage)
Feature Selection
    ↓ (Save to localStorage)
App Customization
    ↓ (Save to localStorage)
Preview
    ↓ (Click "Go Live!")
Submit to API
    ↓
Create Business Record
    ↓
Save Registration Data
    ↓
Send Verification Email (TODO)
    ↓
Redirect to Dashboard
```

## Data Persistence

### Client-Side (localStorage)
- Data is saved in localStorage with key: `redeem_rocket_data`
- Used during the registration flow for offline support
- Cleared after successful API submission

### Server-Side (PostgreSQL)
- All registration data is saved in `business_registrations` table
- Business info saved in `businesses` table
- Data is persistent and can be queried later
- RLS policies ensure data privacy

## Security

### Row Level Security (RLS)
All tables have RLS policies enabled:

1. **business_registrations**
   - Users can view/edit their own registration
   - Public can insert new registrations (for new signups)
   - Service role can manage all registrations (for API)

2. **design_presets**
   - Anyone can view (needed for feature selection)
   - Only service role can modify

3. **businesses**
   - Users can view their own business
   - Only service role can modify

### Email Verification
- New registrations are marked as `pending_email_verification`
- Email verification is required before full account creation
- TODO: Integrate email verification flow

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Required in Supabase:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Deployment Steps

### 1. Run Migrations
```bash
# Create database tables
supabase db push
```

### 2. Deploy Edge Function
```bash
# Deploy registration-api function
supabase functions deploy registration-api
```

### 3. Test Endpoints
```bash
# Test submit registration
curl -X POST https://your-project.supabase.co/functions/v1/registration-api/register/submit \
  -H "Content-Type: application/json" \
  -d '{...registration data...}'
```

## Error Handling

### Common Errors

| Error | Status | Solution |
|-------|--------|----------|
| "Email already registered" | 400 | Use a different email |
| "Missing required fields" | 400 | Ensure all required fields are filled |
| "Registration not found" | 404 | Check registrationId is correct |
| "Internal server error" | 500 | Check server logs |

### Client-Side Error Handling
```typescript
try {
  await submitRegistration(data);
} catch (error) {
  // Error message is displayed in Preview component
  console.error(error.message);
}
```

## Next Steps

### Immediate (Essential)
- [ ] Test all API endpoints with Postman/curl
- [ ] Test email validation during registration
- [ ] Test database queries return correct data
- [ ] Test RLS policies work correctly

### Short-term (Important)
- [ ] Implement email verification flow
- [ ] Send verification emails via Resend/SendGrid
- [ ] Create email templates
- [ ] Link email verification to account creation

### Medium-term (Enhancement)
- [ ] Add payment processing
- [ ] Add team member invites
- [ ] Create onboarding dashboard
- [ ] Add feature recommendations based on category
- [ ] Analytics for registration funnel

### Long-term (Advanced)
- [ ] OAuth integration for social signup
- [ ] Custom domain support
- [ ] Multi-language support
- [ ] A/B testing for registration flow

## Testing Checklist

- [ ] **Email Validation**
  - [ ] Valid email format is accepted
  - [ ] Duplicate email is rejected
  - [ ] Empty email shows error

- [ ] **Registration Submission**
  - [ ] All fields are saved to database
  - [ ] Registration status is "pending_email_verification"
  - [ ] Business record is created
  - [ ] Response contains correct IDs

- [ ] **Database Queries**
  - [ ] Can query registrations by email
  - [ ] Can query by business_id
  - [ ] Can query by user_id
  - [ ] RLS policies work correctly

- [ ] **Error Handling**
  - [ ] Missing fields show appropriate error
  - [ ] Database errors are logged
  - [ ] API returns correct status codes

## Support

For issues or questions:
1. Check the error message in Preview component
2. Review server logs in Supabase dashboard
3. Verify database tables were created via migrations
4. Check network requests in browser DevTools
5. Verify environment variables are set correctly

---

**Last Updated**: 2026-05-01
**Status**: Ready for testing ✅
