# Smart Onboarding Database Schema

## Overview

The Smart Onboarding system uses Supabase PostgreSQL to persist user preferences, theme configurations, and generated pipelines/automations across all phases.

**Migration File:** `/supabase/migrations/20260422_smart_onboarding_context.sql`
**Tables Modified:** `biz_users` (primary), `business_pipelines`, `automation_rules`

---

## Primary Table: biz_users

The `biz_users` table is the central data store for business user accounts and their onboarding progress.

### Columns Added for Smart Onboarding

#### 1. feature_preferences (JSONB)
**Purpose:** Stores Phase 1 feature selection decisions

**Type:** `jsonb`
**Default:** `NULL`
**Nullable:** Yes

**Schema:**
```json
{
  "product_catalog": true|false,
  "lead_management": true|false,
  "email_campaigns": true|false,
  "automation": true|false,
  "social_media": true|false
}
```

**Example Values:**
```json
{
  "product_catalog": true,
  "lead_management": true,
  "email_campaigns": false,
  "automation": true,
  "social_media": false
}
```

**Usage in Application:**
```typescript
// Store in Phase 1
await supabase
  .from('biz_users')
  .update({
    feature_preferences: {
      product_catalog: true,
      lead_management: true,
      email_campaigns: false,
      automation: true,
      social_media: false
    }
  })
  .eq('id', userId);

// Retrieve for Phase 2-6
const { data } = await supabase
  .from('biz_users')
  .select('feature_preferences')
  .eq('id', userId)
  .single();
```

**Indexing:** No index required (small object)
**Storage:** ~100-150 bytes per row

---

#### 2. theme_preference (JSONB)
**Purpose:** Stores Phase 3 theme customization settings

**Type:** `jsonb`
**Default:** `NULL`
**Nullable:** Yes

**Schema:**
```json
{
  "layout": "default"|"grid"|"sidebar",
  "primaryColor": "#ff4400",
  "secondaryColor": "#1f2937",
  "logoUrl": "https://..." | null,
  "fontStyle": "inter"|"poppins"|"roboto",
  "template": "modern-dashboard"|"minimal"|"professional"
}
```

**Example Values:**
```json
{
  "layout": "default",
  "primaryColor": "#ff4400",
  "secondaryColor": "#1f2937",
  "logoUrl": null,
  "fontStyle": "inter",
  "template": "modern-dashboard"
}
```

**Usage in Application:**
```typescript
// Update theme in Phase 3
await supabase
  .from('biz_users')
  .update({
    theme_preference: {
      layout: 'default',
      primaryColor: '#ff4400',
      secondaryColor: '#1f2937',
      logoUrl: null,
      fontStyle: 'inter',
      template: 'modern-dashboard'
    }
  })
  .eq('id', userId);

// Apply theme to UI
const theme = data.theme_preference;
document.documentElement.style.setProperty('--primary-color', theme.primaryColor);
```

**Indexing:** No index required
**Storage:** ~200-300 bytes per row

---

#### 3. onboarding_status (Text)
**Purpose:** Tracks current lifecycle state

**Type:** `text`
**Default:** `'pending'`
**Nullable:** No
**Constraint:** `CHECK (onboarding_status IN ('pending', 'in_progress', 'completed'))`

**Valid Values:**
- `'pending'` - User hasn't started onboarding
- `'in_progress'` - User is actively onboarding (can resume)
- `'completed'` - User finished all phases

**Usage in Application:**
```typescript
// Check if should show onboarding
if (user.onboarding_status === 'pending') {
  navigate('/onboarding');
}

// Resume if in progress
if (user.onboarding_status === 'in_progress') {
  setCurrentPhase(user.onboarding_phase);
}
```

**State Transitions:**
```
pending → in_progress (Phase 1 starts)
in_progress → in_progress (Phase 2-5)
in_progress → completed (Phase 6 finishes)
```

**Index:** `biz_users_onboarding_status_idx`
```sql
CREATE INDEX biz_users_onboarding_status_idx 
ON public.biz_users(onboarding_status);
```

---

#### 4. onboarding_phase (Integer)
**Purpose:** Tracks current phase for resumption

**Type:** `integer`
**Default:** `0`
**Nullable:** No
**Constraint:** `CHECK (onboarding_phase >= 0 AND onboarding_phase <= 6)`

**Valid Values:**
| Phase | Value | Name |
|-------|-------|------|
| 0 | 0 | Not started |
| 1 | 1 | Business Discovery |
| 2 | 2 | Feature Showcase |
| 3 | 3 | Theme Selection |
| 4 | 4 | Dynamic Journey |
| 5 | 5 | Smart Setup |
| 6 | 6 | Preview & Customize |

**Usage in Application:**
```typescript
// Update phase on completion
await supabase
  .from('biz_users')
  .update({
    onboarding_phase: 2,  // Completed Phase 1, moving to Phase 2
    onboarding_status: 'in_progress'
  })
  .eq('id', userId);

// Resume from saved phase
const startPhase = user.onboarding_phase;
setCurrentPhase(startPhase);
```

**Index:** `biz_users_onboarding_phase_idx`
```sql
CREATE INDEX biz_users_onboarding_phase_idx 
ON public.biz_users(onboarding_phase);
```

---

#### 5. onboarding_done (Boolean)
**Purpose:** Quick completion check flag

**Type:** `boolean`
**Default:** `false`
**Nullable:** No

**Usage in Application:**
```typescript
// After Phase 6 completion
await supabase
  .from('biz_users')
  .update({
    onboarding_done: true,
    onboarding_status: 'completed',
    onboarding_completed_at: new Date().toISOString()
  })
  .eq('id', userId);

// Check in middleware
if (!user.onboarding_done) {
  redirect('/onboarding');
}
```

---

#### 6. onboarding_completed_at (Timestamp)
**Purpose:** Records when onboarding was completed

**Type:** `timestamp with time zone`
**Default:** `NULL`
**Nullable:** Yes

**Usage in Application:**
```typescript
// Query completion time
const completedWithin7Days = new Date().getTime() - new Date(user.onboarding_completed_at).getTime() < 7 * 24 * 60 * 60 * 1000;

// Analytics
const avgTimeToCompletion = (new Date(user.onboarding_completed_at) - new Date(user.created_at)) / 1000 / 60;
```

---

## Related Tables

### business_pipelines

**Purpose:** Stores AI-generated or user-created sales pipelines

**Relevant Columns:**
```sql
CREATE TABLE public.business_pipelines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  stages jsonb NOT NULL,  -- Array of stage objects
  is_default boolean DEFAULT false,
  created_from_onboarding boolean DEFAULT false,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);
```

**Data from Phase 5 (Smart Setup):**
```json
{
  "user_id": "uuid...",
  "name": "Sales Pipeline",
  "description": "Generated from smart setup",
  "stages": [
    { "id": 1, "name": "Lead", "order": 0 },
    { "id": 2, "name": "Qualified", "order": 1 },
    { "id": 3, "name": "Proposal", "order": 2 },
    { "id": 4, "name": "Won", "order": 3 }
  ],
  "created_from_onboarding": true
}
```

**Insert During Phase 5:**
```typescript
const { error } = await supabase
  .from('business_pipelines')
  .insert({
    user_id: userId,
    name: 'Sales Pipeline',
    stages: generatedStages,
    created_from_onboarding: true
  });
```

---

### automation_rules

**Purpose:** Stores AI-generated or user-created automation workflows

**Relevant Columns:**
```sql
CREATE TABLE public.automation_rules (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger jsonb NOT NULL,     -- When rule fires
  actions jsonb NOT NULL,     -- What happens
  is_active boolean DEFAULT true,
  created_from_onboarding boolean DEFAULT false,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);
```

**Data from Phase 5 (Smart Setup):**
```json
{
  "user_id": "uuid...",
  "name": "Welcome Email on New Lead",
  "description": "Automatically send welcome email when new lead created",
  "trigger": {
    "type": "lead_created",
    "condition": "all"
  },
  "actions": [
    {
      "type": "send_email",
      "template": "welcome_email",
      "to": "${lead.email}"
    }
  ],
  "created_from_onboarding": true
}
```

**Insert During Phase 5:**
```typescript
const { error } = await supabase
  .from('automation_rules')
  .insert({
    user_id: userId,
    name: 'Welcome Email',
    trigger: { type: 'lead_created' },
    actions: [{ type: 'send_email' }],
    created_from_onboarding: true
  });
```

---

## Row-Level Security (RLS) Policies

All onboarding data is protected by RLS to ensure users can only access their own data.

### biz_users RLS Policies

**Policy: Users can view own record**
```sql
CREATE POLICY "Users can view own record"
  ON public.biz_users
  FOR SELECT
  USING (auth.uid() = id);
```

**Policy: Users can update own record**
```sql
CREATE POLICY "Users can update own record"
  ON public.biz_users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**Policy: Admins can view all**
```sql
CREATE POLICY "Admins can view all records"
  ON public.biz_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid()
    )
  );
```

### business_pipelines RLS Policies

**Policy: Users can view own pipelines**
```sql
CREATE POLICY "Users can view own pipelines"
  ON public.business_pipelines
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Policy: Users can manage own pipelines**
```sql
CREATE POLICY "Users can manage own pipelines"
  ON public.business_pipelines
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### automation_rules RLS Policies

**Policy: Users can view own rules**
```sql
CREATE POLICY "Users can view own rules"
  ON public.automation_rules
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Policy: Users can manage own rules**
```sql
CREATE POLICY "Users can manage own rules"
  ON public.automation_rules
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## Data Examples

### Complete User Record After Phase 1

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "hello@example.com",
  "business_name": "My E-commerce Store",
  "created_at": "2026-04-23T10:00:00+00:00",
  "updated_at": "2026-04-23T10:05:00+00:00",
  
  "feature_preferences": {
    "product_catalog": true,
    "lead_management": true,
    "email_campaigns": false,
    "automation": true,
    "social_media": false
  },
  "theme_preference": null,
  "onboarding_status": "in_progress",
  "onboarding_phase": 1,
  "onboarding_done": false,
  "onboarding_completed_at": null
}
```

### Complete User Record After Phase 6

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "hello@example.com",
  "business_name": "My E-commerce Store",
  "created_at": "2026-04-23T10:00:00+00:00",
  "updated_at": "2026-04-23T10:35:00+00:00",
  
  "feature_preferences": {
    "product_catalog": true,
    "lead_management": true,
    "email_campaigns": false,
    "automation": true,
    "social_media": false
  },
  "theme_preference": {
    "layout": "default",
    "primaryColor": "#ff4400",
    "secondaryColor": "#1f2937",
    "logoUrl": "https://storage.example.com/logo.png",
    "fontStyle": "inter",
    "template": "modern-dashboard"
  },
  "onboarding_status": "completed",
  "onboarding_phase": 6,
  "onboarding_done": true,
  "onboarding_completed_at": "2026-04-23T10:35:00+00:00"
}
```

### Generated Pipeline Record (Phase 5 Output)

```json
{
  "id": "a1b2c3d4-e5f6-4789-0abc-def123456789",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Sales Pipeline",
  "description": "Generated from smart setup based on e-commerce profile",
  "stages": [
    {
      "id": "stage_1",
      "name": "Lead",
      "description": "Initial contact",
      "color": "#3b82f6",
      "order": 0
    },
    {
      "id": "stage_2",
      "name": "Qualified",
      "description": "Verified interest",
      "color": "#8b5cf6",
      "order": 1
    },
    {
      "id": "stage_3",
      "name": "Proposal",
      "description": "Quote sent",
      "color": "#ec4899",
      "order": 2
    },
    {
      "id": "stage_4",
      "name": "Won",
      "description": "Customer acquired",
      "color": "#10b981",
      "order": 3
    }
  ],
  "is_default": true,
  "created_from_onboarding": true,
  "created_at": "2026-04-23T10:28:00+00:00",
  "updated_at": "2026-04-23T10:28:00+00:00"
}
```

### Generated Automation Rule Record (Phase 5 Output)

```json
{
  "id": "x9y8z7w6-v5u4-t3s2-r1q0-ponmlkjihgfe",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Welcome Email Campaign",
  "description": "Automatically send welcome sequence to new leads",
  "trigger": {
    "type": "lead_created",
    "condition": "all",
    "filters": []
  },
  "actions": [
    {
      "id": "action_1",
      "type": "send_email",
      "template_id": "welcome_email_1",
      "delay_minutes": 0,
      "subject": "Welcome to My E-commerce Store!"
    },
    {
      "id": "action_2",
      "type": "send_email",
      "template_id": "welcome_email_2",
      "delay_minutes": 1440,
      "subject": "Here are our top products"
    },
    {
      "id": "action_3",
      "type": "send_email",
      "template_id": "welcome_email_3",
      "delay_minutes": 2880,
      "subject": "Need help? We're here for you"
    }
  ],
  "is_active": true,
  "created_from_onboarding": true,
  "created_at": "2026-04-23T10:28:00+00:00",
  "updated_at": "2026-04-23T10:28:00+00:00"
}
```

---

## Query Examples

### Fetch User with All Onboarding Data

```typescript
const { data: user } = await supabase
  .from('biz_users')
  .select(`
    id,
    email,
    business_name,
    feature_preferences,
    theme_preference,
    onboarding_status,
    onboarding_phase,
    onboarding_done,
    onboarding_completed_at
  `)
  .eq('id', userId)
  .single();
```

### Fetch User with Pipelines and Automations

```typescript
const { data } = await supabase
  .from('biz_users')
  .select(`
    id,
    feature_preferences,
    business_pipelines(id, name, stages),
    automation_rules(id, name, trigger, actions)
  `)
  .eq('id', userId)
  .single();
```

### Get All Users in Onboarding

```typescript
const { data: onboardingUsers } = await supabase
  .from('biz_users')
  .select('id, email, onboarding_phase')
  .eq('onboarding_status', 'in_progress');
```

### Get Recently Completed Onboarding

```typescript
const { data: completedUsers } = await supabase
  .from('biz_users')
  .select('id, email, onboarding_completed_at')
  .eq('onboarding_status', 'completed')
  .gte('onboarding_completed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  .order('onboarding_completed_at', { ascending: false });
```

### Update Onboarding Progress

```typescript
const { error } = await supabase
  .from('biz_users')
  .update({
    feature_preferences: newPreferences,
    onboarding_phase: 2,
    onboarding_status: 'in_progress',
    updated_at: new Date().toISOString()
  })
  .eq('id', userId);
```

---

## Storage Estimates

### Per-User Storage

| Data | Size | Example |
|------|------|---------|
| feature_preferences | 150 bytes | 5 booleans |
| theme_preference | 250 bytes | Colors, fonts, urls |
| onboarding metadata | 50 bytes | Status, phase, dates |
| **Total per user** | **450 bytes** | **~ 450 KB per 1M users** |

### Growth Projections (1M Users)

| Phase | Users | Pipeline Records | Automation Records | Total Size |
|-------|-------|------|------|---|
| Phase 1 | 1,000,000 | 450 KB | 0 | 450 KB |
| Phase 6 | 500,000 | 450 KB + 5 MB | 2.5 MB | 7.95 MB |

**Conclusion:** Storage is negligible. Focus on query performance via indexes.

---

## Performance Optimization

### Recommended Indexes

```sql
-- Already created by migration
CREATE INDEX biz_users_onboarding_status_idx 
ON public.biz_users(onboarding_status);

CREATE INDEX biz_users_onboarding_phase_idx 
ON public.biz_users(onboarding_phase);

-- Additional recommended
CREATE INDEX business_pipelines_user_id_idx 
ON public.business_pipelines(user_id);

CREATE INDEX automation_rules_user_id_idx 
ON public.automation_rules(user_id);

CREATE INDEX automation_rules_is_active_idx 
ON public.automation_rules(is_active);
```

### Query Performance Tips

1. **Always filter by user_id first** (indexed)
2. **Use `.single()` for single row** (better than array)
3. **Select only needed columns** (reduce payload)
4. **Use `.limit(1)` for status checks** (fast)
5. **Batch updates** when possible

---

## Migration History

### 20260422_smart_onboarding_context.sql
**Date:** April 22, 2026
**Changes:**
- Added feature_preferences (jsonb)
- Added theme_preference (jsonb)
- Added onboarding_status (text with check)
- Added onboarding_phase (integer with check)
- Created indexes for status and phase
- Added column comments

**Backwards Compatibility:** Yes (all columns nullable or have defaults)

---

**Last Updated:** 2026-04-23
**Version:** 1.0
**Status:** Production Ready
