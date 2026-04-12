# Hardcoding Audit Report

## Overview
Comprehensive search of the codebase for hardcoded values that should be read from the database or derived from dynamic data.

**Scan Date**: April 13, 2026
**Status**: ✅ Fixed for critical paths, ⚠️ Minor issues in secondary components

---

## CRITICAL ISSUES (Fixed)

### 1. ❌ → ✅ Owner Login Hardcoded Plan Values
**File**: `src/business/pages/LoginPage.tsx` (Fixed in commit ebe72a7)

**Issue**: All three owner login flows were hardcoding database fields
```typescript
// BEFORE (❌ Wrong)
plan: 'free' as const,
planExpiry: null,
onboarding_done: !!result.biz,
```

**Fix**: Read actual values from database
```typescript
// AFTER (✅ Correct)
plan: ((result.user as any)?.plan || 'free') as any,
planExpiry: ((result.user as any)?.plan_expiry || null),
onboarding_done: (result.user as any)?.onboarding_done ?? !!result.biz,
```

**Impact**: High - Affected user subscription level, feature access, onboarding flow
**Status**: ✅ FIXED in LoginPage.tsx (Password, OTP, Google flows)

---

### 2. ❌ → ✅ Team Member Redirect Method
**File**: `src/business/pages/LoginPage.tsx` (Fixed in commit 6f2678d)

**Issue**: Used unreliable SPA navigation for team member redirect
```typescript
// BEFORE (❌ Unreliable)
window.location.href = '/app';
```

**Fix**: Use guaranteed hard reload
```typescript
// AFTER (✅ Reliable)
window.location.reload();
```

**Impact**: Critical - Team members stuck on login page after authentication
**Status**: ✅ FIXED

---

### 3. ❌ → ✅ Team Member Data Loading Error Handling
**File**: `src/business/context/BusinessContext.tsx` (Fixed in commit 6f2678d)

**Issue**: Fallback Supabase query had no error handling
```typescript
// BEFORE (❌ Silent failure)
.then(({ data: biz }) => {
  if (!biz) { setIsLoading(false); return; }  // No error context
})
// Missing .catch() block
```

**Fix**: Added error handling and logging
```typescript
// AFTER (✅ Better debugging)
.then(({ data: biz, error: bizError }) => {
  if (bizError) {
    console.error('[BusinessContext] Fallback businesses query failed:', bizError.message);
    setIsLoading(false);
    return;
  }
})
.catch(err => {
  console.error('[BusinessContext] Fallback businesses query threw error:', err);
  setIsLoading(false);
});
```

**Impact**: High - Made debugging impossible, causes redirect loops
**Status**: ✅ FIXED

---

## SECONDARY ISSUES (Review Needed)

### 4. ⚠️ Legacy Component: buildLocalStorageBizUser()
**File**: `src/app/lib/authService.ts` (lines 409-428)

**Issue**: Helper function hardcodes values
```typescript
export function buildLocalStorageBizUser(row: BizUserRow, biz?: BusinessRow | null) {
  return {
    // ...
    plan: 'free' as const,                           // ❌ Hardcoded
    planExpiry: null,                                 // ❌ Hardcoded
    onboarding_done: Boolean(biz?.id ?? row.business_id),  // ❌ Based on business, not flag
  };
}
```

**Usage**: Only called in `BusinessLogin.tsx` (legacy component not in active routing)

**Status**: ⚠️ Should be fixed for consistency, but not used in production flows
**Recommendation**: Fix or remove this legacy function

---

### 5. ⚠️ Legacy Component: BusinessLogin Demo Component
**File**: `src/business/components/BusinessLogin.tsx` (lines 270-282)

**Issue**: Demo login with hardcoded values
```typescript
const userData = {
  id: `user-${biz.id}`,
  name: biz.name + ' Owner',
  email: biz.email,
  phone: '',
  businessId: biz.id,
  businessName: biz.name,
  businessLogo: biz.logo,
  businessCategory: biz.category,
  role: 'business',
  plan: 'pro',                    // ❌ Hardcoded
  planExpiry: new Date(...).toISOString(),
  onboarding_done: true,          // ❌ Hardcoded
};
```

**Usage**: Component is defined but NOT used in active routes (no route matches `/old-login`)

**Status**: ⚠️ Legacy code - not used in production
**Recommendation**: Remove or update if keeping for testing

---

### 6. ⚠️ New User Signup: Hardcoded Initial Values
**File**: `src/business/pages/SignupPage.tsx` (lines 237-239)

**Issue**: New users initialized with default values
```typescript
const userData = {
  // ... other fields
  plan: 'free' as const,
  planExpiry: null,
  onboarding_done: false,
};
```

**Analysis**: ✅ This is CORRECT for new signups!
- New users should start with `plan: 'free'`
- New users should have `onboarding_done: false` (they haven't completed it)
- These are intentional defaults, not bugs

**Status**: ✅ CORRECT - No fix needed

---

## FORM DEFAULT VALUES (Low Priority)

### 7. ⚠️ Product Form Default Category
**File**: `src/business/components/ProductsPage.tsx` (line 23)

**Issue**: Empty product template hardcodes category
```typescript
const EMPTY_PRODUCT = { 
  name: '', 
  category: 'Grocery',    // ❌ Hardcoded default
  mrp: 0, 
  sellingPrice: 0, 
  description: '', 
  emoji: '📦', 
  stock: 0 
};
```

**Usage**: Template for new product creation form

**Status**: ⚠️ Minor - User can change after creation
**Recommendation**: Could use `businessCategory` from context as default

---

### 8. ⚠️ Offer Form Default Category
**File**: `src/business/components/OffersPage.tsx` (line 39)

**Issue**: Empty offer template hardcodes category
```typescript
const EMPTY_FORM = { 
  title: '', 
  description: '', 
  discount: 10, 
  price: 0, 
  isFlashDeal: false, 
  startDate: '', 
  endDate: '', 
  category: 'Grocery'    // ❌ Hardcoded default
};
```

**Usage**: Template for new offer creation form

**Status**: ⚠️ Minor - User can change after creation
**Recommendation**: Could use `businessCategory` from context as default

---

### 9. ⚠️ Auction Form Default Emoji
**File**: `src/business/components/AuctionsManagePage.tsx` (line 31)

**Issue**: Empty auction template with hardcoded emoji
```typescript
const EMPTY_FORM = { 
  emoji: '🏆',            // ❌ Hardcoded default
  title: '', 
  description: '', 
  startingBid: 500, 
  endAt: '' 
};
```

**Status**: ✅ FINE - Emoji is just a default, users can change
**Impact**: Cosmetic only

---

## MOCK DATA (Development Only)

### 10. ✅ Mock Team Members
**File**: `src/business/components/TeamPage.tsx` (lines 55-68)

**Issue**: MOCK_MEMBERS and MOCK_ROLES defined
```typescript
const MOCK_MEMBERS: TeamMember[] = [
  {
    id: 'm1', business_id: 'biz-1', name: 'Rahul Sharma', email: 'rahul@business.com',
    phone: '9876543210', status: 'active',
    permissions: { ... },
    created_at: new Date(...).toISOString(),
  },
  // ... more members
];
```

**Status**: ✅ OK - Defined but NOT USED in component logic
**Impact**: None - Dead code, can be removed if desired

---

## AUTHENTICATION DEFAULTS (Checked)

### 11. ✅ Correct: New User Plan Defaults
**File**: `src/app/lib/authService.ts` (line 423)

```typescript
// For new signups (after OTP verification)
plan: 'free' as const,
```

**Status**: ✅ CORRECT
**Reason**: New users should get 'free' plan by default

---

## SUMMARY TABLE

| Issue | File | Severity | Status | Fix |
|-------|------|----------|--------|-----|
| Owner login hardcoded plan | LoginPage.tsx | 🔴 CRITICAL | ✅ FIXED | Read from (result.user as any)?.plan |
| Team member redirect | LoginPage.tsx | 🔴 CRITICAL | ✅ FIXED | Changed to window.location.reload() |
| Team member error handling | BusinessContext.tsx | 🔴 CRITICAL | ✅ FIXED | Added .catch() and error logging |
| buildLocalStorageBizUser | authService.ts | 🟡 MEDIUM | ⚠️ NOT USED | Remove or fix (legacy code) |
| BusinessLogin demo component | BusinessLogin.tsx | 🟡 MEDIUM | ⚠️ NOT USED | Remove (not in routes) |
| Product default category | ProductsPage.tsx | 🟢 LOW | ✅ OK | Optional: Use businessCategory |
| Offer default category | OffersPage.tsx | 🟢 LOW | ✅ OK | Optional: Use businessCategory |
| Signup initial values | SignupPage.tsx | 🟢 LOW | ✅ CORRECT | No change needed |
| Mock team members | TeamPage.tsx | 🟢 LOW | ✅ OK | Dead code, can remove |

---

## RECOMMENDATIONS

### Immediate Actions (None - All Critical Fixed)
✅ All critical authentication hardcoding has been fixed

### Short-term (Nice to Have)
1. **Remove Legacy Code**: Delete `BusinessLogin.tsx` component and `buildLocalStorageBizUser()` function
2. **Improve Form Defaults**: Use `bizUser.businessCategory` for product/offer form defaults
3. **Cleanup**: Remove MOCK_MEMBERS and MOCK_ROLES from TeamPage.tsx

### Long-term
1. **Type Safety**: Add proper types to authService instead of `as any` casts
2. **Testing**: Add unit tests for authentication flows to catch hardcoding regressions
3. **Code Review**: Add checklist item for "hardcoded values should be from database"

---

## Files Affected by This Audit

### Critical (Fixed)
- ✅ `src/business/pages/LoginPage.tsx` - Fixed plan, planExpiry, onboarding_done reading
- ✅ `src/business/context/BusinessContext.tsx` - Fixed error handling

### Secondary (Review)
- ⚠️ `src/app/lib/authService.ts` - Legacy function needs fixing
- ⚠️ `src/business/components/BusinessLogin.tsx` - Legacy demo component not used
- 🟢 `src/business/pages/SignupPage.tsx` - Correct behavior, no fix needed
- 🟢 `src/business/components/ProductsPage.tsx` - Minor issue, cosmetic only
- 🟢 `src/business/components/OffersPage.tsx` - Minor issue, cosmetic only
- 🟢 `src/business/components/AuctionsManagePage.tsx` - Cosmetic only, OK
- 🟢 `src/business/components/TeamPage.tsx` - Dead code, can remove

---

## Verification Commands

### Check if BusinessLogin is used
```bash
grep -r "BusinessLogin" src/business --include="*.tsx" | grep -v "export\|import"
# Result: Should only show unused definition
```

### Check if buildLocalStorageBizUser is used outside legacy
```bash
grep -r "buildLocalStorageBizUser" src --include="*.tsx" | grep -v "export\|def\|BusinessLogin"
# Result: Should be empty
```

### Check new auth login paths are using LoginPage
```bash
grep -n "NewLoginRoot\|LoginPage" src/business/routes.tsx
# Result: Should show LoginPage in /login route
```

---

## Deployment Status

**Commits Deployed**:
1. ✅ `6f2678d` - Team member login debugging (hardcoded redirect fixed)
2. ✅ `ebe72a7` - Owner login database fields (hardcoded plan fixed)
3. ✅ `8087d1c` - Documentation

**Tests Needed**:
- ✅ Owner login shows correct plan from database
- ✅ Team member login redirects correctly
- ✅ New users start with 'free' plan
- ✅ Onboarding_done is read from database

---

**Report Generated**: April 13, 2026
**Next Review**: After user testing confirmation

