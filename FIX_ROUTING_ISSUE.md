# Onboarding Routing Issue - Diagnostic & Fix

## Problem Confirmed
- After signup: redirects to `/onboarding` ❌
- Should redirect to: `/business/onboarding` ✅
- Result: 500 Error (Unknown Error)

## Root Cause Analysis

The 500 error on `/onboarding` suggests:
1. `/onboarding` route DOES exist (in app router)
2. It's being rendered but crashing
3. Navigation is stripping the `/business` prefix

## Immediate Fix

Remove or disable the `/onboarding` route from app router that's interfering:

**File**: `src/app/routes.tsx` (Line 39)

**Current:**
```typescript
{
  path: "/onboarding",
  Component: OnboardingPage,
},
```

**Should be:**
```typescript
{
  path: "/onboarding",
  Component: () => <Navigate to="/business/onboarding" replace />,
},
```

This redirects any `/onboarding` requests to the correct `/business/onboarding` route.

## Why This Happens

The app has TWO onboarding routes:
- `src/app/routes.tsx`: `/onboarding` (customer app)
- `src/business/routes.tsx`: `/business/onboarding` (business app)

When signup navigates to `/business/onboarding`, something is stripping the prefix and rendering the wrong route.

## Testing After Fix

1. Go to https://redeemrocket.in/signup
2. Fill in signup form
3. URL should show: `https://redeemrocket.in/business/onboarding`
4. Should see: 5-question onboarding (not 500 error)

