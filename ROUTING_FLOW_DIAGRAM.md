# Business App Routing Flow Diagram

**Visual Guide to Login & Onboarding Flow**

---

## Complete User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      BUSINESS APP ROUTING FLOW                          │
└─────────────────────────────────────────────────────────────────────────┘

                          APPLICATION START
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                [/login]           [Stored biz_user?]
             Login/Register              YES
                    │                      │
                    │            ┌─────────┴─────────┐
                    │            │                   │
                    │        [onboarding_done = true?]
                    │            │           │
                    │           NO          YES
                    │            │           │
                    │      [/onboarding]  [/app]
                    │            │           │
                    │     Complete onboarding
                    │            │
                    └─────────────┴──→ [/app Dashboard]
```

---

## Detailed Step-by-Step Flow

### NEW USER JOURNEY

```
                    USER VISITS /login
                            │
                            ├─→ [Not in localStorage]
                            │   Show login form
                            │
                    ENTER EMAIL/PHONE
                            │
                    SEND & VERIFY OTP
                            │
              ┌─────────────┴──────────────┐
              │                            │
        [OTP Verified]            [User Found in DB]
              │                            │
         auth_service                     │
      getOrCreateBizUser()                │
              │                            │
         ┌────┴─────┐                     │
    [isNew = true]                        │
         │                                │
    ┌────┴────────────────────────────┐  │
    │                                 │  │
    │  setBizUser({                  │  │
    │    onboarding_done: FALSE       │  │
    │  })                             │  │
    │                                 │  │
    │  navigate('/onboarding')        │  │
    │                                 │  │
    └────┬──────────────────────────────┘
         │
    [/ONBOARDING PAGE LOADS]
         │
    ┌────┴────────────────────────────────┐
    │                                      │
    │  Step 1: Business Info               │
    │  - Name, Type, Logo                  │
    │                                      │
    │  Step 2: Location                    │
    │  - Address, City, Pincode            │
    │                                      │
    │  Step 3: Business Hours              │
    │  - Open/Close Times                  │
    │                                      │
    │  Step 4: Photos (Optional)           │
    │  - Upload business photos            │
    │                                      │
    │  Step 5: Team Setup                  │
    │  - Add team members                  │
    │                                      │
    │  Step 6: Plan Selection              │
    │  - Free/Basic/Pro/Enterprise         │
    │                                      │
    └────┬─────────────────────────────────┘
         │
    USER CLICKS "COMPLETE SETUP"
         │
    ┌────┴─────────────────────────────┐
    │                                  │
    │  setBizUser({                   │
    │    ...prevUser,                 │
    │    businessId: generated,       │
    │    businessName: user_input,    │
    │    onboarding_done: TRUE        │
    │  })                             │
    │                                 │
    │  Navigate('/app')               │
    │                                 │
    └────┬──────────────────────────────┘
         │
    [/APP DASHBOARD LOADS]
         │
    ┌────┴──────────────────────────┐
    │                               │
    │  User can now:                │
    │  - View Dashboard             │
    │  - Add Products               │
    │  - Create Offers              │
    │  - Manage Team                │
    │  - Track Orders               │
    │  - And more...                │
    │                               │
    └───────────────────────────────┘
```

---

## EXISTING USER JOURNEY

```
                    USER VISITS /login
                            │
                            ├─→ [In localStorage]
                            │   (from before)
                            │
                            ▼
            ┌──────────────────────────┐
            │  Check localStorage      │
            │  biz_user object         │
            └──────────────────────────┘
                        │
              ┌─────────┴──────────┐
              │                    │
        [onboarding_done?]    [businessId?]
              │                    │
             YES/YES           Redirect
              │                to /app
              │                immediately
              ▼                    │
        show_login_form           │
              │                    │
        ENTER EMAIL/PHONE          │
              │                    │
        SEND & VERIFY OTP          │
              │                    │
    ┌─────────┴──────────┐         │
    │                    │         │
[OTP Verified]   [User Found]      │
    │                    │         │
    ├─→ isNew = false ◄──┘         │
    │                             │
    ├─→ navigate('/app')          │
    │                             │
    └─────────────────────────────┤
                                  │
                        [/APP DASHBOARD]
                                  │
                    ✓ Dashboard loads immediately
                    ✓ No onboarding required
                    ✓ Existing data intact
```

---

## ROUTE PROTECTION LOGIC

```
USER TRIES TO ACCESS: /app

    ↓

[BusinessLayout Component Renders]

    ↓

    ┌─────────────────────┐
    │  if (!bizUser)      │  Unauthenticated?
    │  {                  │
    │    Navigate         ├──→ Redirect to /login
    │    to /login        │
    │  }                  │
    └─────────────────────┘

    ↓

    ┌─────────────────────┐
    │  if (!onboarding    │  Onboarding incomplete?
    │      _done)         │
    │  {                  │
    │    Navigate         ├──→ Redirect to /onboarding
    │    to /onboarding   │
    │  }                  │
    └─────────────────────┘

    ↓

    ┌─────────────────────┐
    │  else {             │  Everything OK?
    │    render <Outlet>  │
    │    (show page)      ├──→ Render dashboard
    │  }                  │
    └─────────────────────┘
```

---

## DECISION TREE: AFTER SUCCESSFUL AUTH

```
                  OTP/Google Auth Successful
                            │
                    ┌───────┴────────┐
                    │                │
              [Check isNew]    [Check business_id]
                    │                │
        ┌───────────┴────────┐      │
        │                    │      │
    [isNew=true]        [isNew=false]
        │                    │
    Explicit            Check if
    onboarding          business_id
    required            exists
        │                    │
        │            ┌───────┴────────┐
        │            │                │
        │      [businessId=null]   [businessId=set]
        │            │                │
        └────────────┼────────────────┘
                     │
              ┌──────┴──────┐
              │             │
         Route to      Route to
       /onboarding      /app
             │             │
         (new user)   (existing user)
```

---

## LOCALSTORAGE STATE CHANGES

```
BEFORE LOGIN:
┌─────────────────────┐
│ localStorage empty  │
└─────────────────────┘

         │
         ▼ (User logs in, OTP verified)

DURING OTP VERIFICATION:
┌────────────────────────────┐
│ biz_user: {                │
│   id: "user-xxx",          │
│   email: "user@biz.com",   │
│   businessId: null,        │
│   onboarding_done: false   │
│ }                          │
└────────────────────────────┘

         │
         ▼ (User completes onboarding)

AFTER ONBOARDING:
┌────────────────────────────┐
│ biz_user: {                │
│   id: "user-xxx",          │
│   email: "user@biz.com",   │
│   businessId: "biz-12345", │
│   businessName: "My Store",│
│   onboarding_done: true    │
│ }                          │
└────────────────────────────┘

         │
         ▼ (User returns next session)

NEXT LOGIN (localStorage persists):
┌────────────────────────────┐
│ biz_user: {                │
│   ... (same as above)      │
│   onboarding_done: true    │
│ }                          │
└────────────────────────────┘

Detected in useEffect →
Check onboarding_done = true →
Navigate to /app immediately!
```

---

## ROUTING TABLE

| Route | Purpose | Who Can Access | Notes |
|-------|---------|---|---|
| `/` | Landing page | Everyone | Public |
| `/login` | Sign in / Register | Unauthenticated | Show form |
| `/signup` | Registration form | Unauthenticated | Alternative flow |
| `/onboarding` | Multi-step setup | Authenticated, incomplete | 6-step wizard |
| `/app` | Dashboard + all features | Authenticated, complete | Protected route |
| `/app/products` | Product management | Authenticated, complete | Nested in /app |
| `/app/offers` | Offer management | Authenticated, complete | Nested in /app |
| ... | ... | ... | All nested under /app |

---

## STATUS CODES & CHECKS

```
┌──────────────────┬──────────────────┬──────────────────┐
│ Check            │ Result           │ Action           │
├──────────────────┼──────────────────┼──────────────────┤
│ bizUser = null   │ Not logged in     │ → /login         │
│ onboarding_done  │ = false           │ → /onboarding    │
│ onboarding_done  │ = true            │ → /app           │
│ businessId       │ = null            │ → /onboarding    │
│ businessId       │ = set             │ → /app           │
└──────────────────┴──────────────────┴──────────────────┘
```

---

## LOCALSTORAGE CORRUPTION HANDLING

```
User has corrupted localStorage

         │
         ▼

useEffect tries to parse:
JSON.parse(storedUser)

         │
         ▼

    ┌────────────┐
    │ Throws!    │
    └────────────┘
         │
         ▼

  ┌──────────────────┐
  │ catch block      │
  │ (do nothing)     │  Allow user to
  │                  │  login again
  └──────────────────┘
         │
         ▼

Show login form normally
```

---

## CODE EXECUTION FLOW

```
1. User navigates to http://localhost:5174/business.html

2. React renders BusinessLogin component

3. useEffect (line 129) executes immediately:
   ├─ Check localStorage for 'biz_user'
   ├─ If found: Parse and check onboarding_done
   ├─ If incomplete: navigate('/onboarding')
   └─ If complete: navigate('/app')

4. If not in localStorage:
   ├─ Show login form
   └─ Wait for user input

5. User enters email/phone, clicks "Send OTP"

6. OTP sent, UI advances to OTP entry step

7. User enters 6 digits, clicks "Verify"

8. handleVerifyOtp() executes:
   ├─ Call verifyOtp() auth service
   ├─ Call getOrCreateBizUser()
   ├─ Receives isNew flag
   ├─ Save to context + localStorage
   ├─ Show success animation
   └─ Navigate based on isNew (line 242-245)

9. Redirect happens (1.4 second timeout)

10. User lands on destination:
    ├─ /onboarding (new users)
    └─ /app (existing users)

11. If /app access:
    ├─ BusinessLayout checks bizUser
    ├─ Checks onboarding_done
    └─ Renders dashboard if all OK
```

---

## AUTHENTICATION STATE MACHINE

```
State Transitions:

[UNAUTHENTICATED]
       │
       ├─ User enters credentials
       │
       ▼
[AUTHENTICATING]
       │
       ├─ OTP sent
       ├─ User verifies
       │
       ▼
[AUTHENTICATED_INCOMPLETE]
       │
       ├─ User completes onboarding
       │
       ▼
[AUTHENTICATED_COMPLETE]
       │
       ├─ User logs out
       │
       ▼
[UNAUTHENTICATED] (back to start)
```

---

## FINAL CHECKLIST

- ✅ New users → login → onboarding → dashboard
- ✅ Existing users → login → dashboard (skip onboarding)
- ✅ Returning users → localStorage check → correct route
- ✅ Unauthorized access → redirect to login
- ✅ Incomplete onboarding → redirect from /app
- ✅ Error handling → corrupted localStorage recovery
- ✅ Animations → success screen before redirect
- ✅ Persistence → localStorage + Supabase sync

---

**Last Updated:** April 7, 2026
**Status:** ✅ Implementation Complete
