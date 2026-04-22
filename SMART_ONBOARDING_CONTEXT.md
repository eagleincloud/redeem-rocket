# Smart Onboarding Context Enhancement

## Overview

The `BusinessContext` has been enhanced to support Smart Onboarding features, including feature preferences, theme management, and onboarding status tracking. This document describes the new functionality and how to use it.

## What's New

### 1. Type Definitions

#### ThemePreference
Stores business branding and theme customization settings:
```typescript
export interface ThemePreference {
  layout?: string;           // e.g., 'grid', 'list', 'compact'
  primaryColor?: string;     // hex color, e.g., '#f97316'
  secondaryColor?: string;   // hex color, e.g., '#6366f1'
  logoUrl?: string;          // custom logo URL
  fontStyle?: string;        // e.g., 'sans', 'serif', 'modern'
}
```

#### OnboardingStatus
Tracks the lifecycle of business onboarding:
```typescript
export type OnboardingStatus = 'pending' | 'in_progress' | 'completed';
```

#### FeaturePreferences
A record mapping feature names to enabled/disabled boolean values:
```typescript
export type FeaturePreferences = Record<string, boolean>;
```

### 2. BizUser Extensions

The `BizUser` interface now includes:
```typescript
export interface BizUser {
  // ... existing fields ...

  // Smart Onboarding: Feature & Theme Management
  featurePreferences?: FeaturePreferences;  // which features are enabled
  themePreference?: ThemePreference;        // business theme/branding settings
  onboardingStatus?: OnboardingStatus;      // current onboarding status
  onboardingPhase?: number;                 // 0-6 phase indicator
}
```

### 3. New Context Methods

The `BusinessContextValue` now provides these methods:

#### Feature Management
```typescript
/**
 * Check if a specific feature is enabled for this business
 */
canAccessFeature(featureName: string): boolean;

/**
 * Get list of all enabled features
 */
getEnabledFeatures(): string[];

/**
 * Update feature preferences in context and persist to database
 */
updateFeaturePreferences(prefs: FeaturePreferences): Promise<void>;

/**
 * Get total count of enabled features
 */
getEnabledFeatureCount(): number;
```

#### Theme Management
```typescript
/**
 * Update theme preference in context and persist to database
 */
updateThemePreference(theme: ThemePreference): Promise<void>;

/**
 * Apply theme colors to DOM via CSS custom properties
 */
applyThemeToDOM(theme?: ThemePreference): void;
```

#### Onboarding Management
```typescript
/**
 * Update onboarding status and persist to database
 */
updateOnboardingStatus(status: OnboardingStatus, phase?: number): Promise<void>;

/**
 * Check if onboarding is required (status !== 'completed')
 */
isOnboardingRequired(): boolean;

/**
 * Get current onboarding phase (0-6)
 */
getCurrentOnboardingPhase(): number;
```

## Usage Examples

### Feature Access Control

```typescript
import { useBusinessContext } from '@/business/context/BusinessContext';

export function AnalyticsDashboard() {
  const { canAccessFeature, getEnabledFeatures } = useBusinessContext();

  if (!canAccessFeature('advancedAnalytics')) {
    return <UpgradePrompt feature="Advanced Analytics" />;
  }

  return <AdvancedAnalyticsUI />;
}
```

### Theme Customization

```typescript
import { useBusinessContext } from '@/business/context/BusinessContext';

export function ThemeCustomizer() {
  const { updateThemePreference, bizUser } = useBusinessContext();

  const handleColorChange = async (color: string) => {
    try {
      await updateThemePreference({
        ...bizUser?.themePreference,
        primaryColor: color,
      });
      console.log('Theme updated!');
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  return (
    <div>
      <input
        type="color"
        value={bizUser?.themePreference?.primaryColor || '#f97316'}
        onChange={(e) => handleColorChange(e.target.value)}
      />
    </div>
  );
}
```

### Onboarding Flow

```typescript
import { useBusinessContext } from '@/business/context/BusinessContext';

export function OnboardingWizard() {
  const { 
    updateOnboardingStatus, 
    getCurrentOnboardingPhase,
    isOnboardingRequired 
  } = useBusinessContext();

  const handlePhaseComplete = async (phaseNumber: number) => {
    try {
      await updateOnboardingStatus('in_progress', phaseNumber);
    } catch (error) {
      console.error('Failed to update onboarding phase:', error);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await updateOnboardingStatus('completed', 6);
      // Redirect or show success message
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  if (!isOnboardingRequired()) {
    return <Dashboard />;
  }

  const currentPhase = getCurrentOnboardingPhase();
  // Render appropriate phase component
  return <OnboardingPhase phase={currentPhase} onComplete={handlePhaseComplete} />;
}
```

## Database Schema

The following columns have been added to the `biz_users` table:

```sql
-- Feature preferences (JSONB)
ALTER TABLE biz_users ADD COLUMN feature_preferences jsonb DEFAULT NULL;

-- Theme preference (JSONB)
ALTER TABLE biz_users ADD COLUMN theme_preference jsonb DEFAULT NULL;

-- Onboarding status (text)
ALTER TABLE biz_users ADD COLUMN onboarding_status text 
  DEFAULT 'pending' 
  CHECK (onboarding_status IN ('pending', 'in_progress', 'completed'));

-- Onboarding phase (integer)
ALTER TABLE biz_users ADD COLUMN onboarding_phase integer 
  DEFAULT 0 
  CHECK (onboarding_phase >= 0 AND onboarding_phase <= 6);
```

Indexes are created for query performance:
- `biz_users_onboarding_status_idx`
- `biz_users_onboarding_phase_idx`

## API Functions

Helper functions are provided in `src/app/api/supabase-data.ts`:

```typescript
// Feature preferences
export async function updateBizUserFeaturePreferences(
  bizUserId: string,
  featurePreferences: Record<string, boolean>
): Promise<any>;

export async function fetchBizUserFeaturePreferences(
  bizUserId: string
): Promise<Record<string, boolean> | null>;

// Theme preferences
export async function updateBizUserThemePreference(
  bizUserId: string,
  themePreference: ThemePreference
): Promise<any>;

export async function fetchBizUserThemePreference(
  bizUserId: string
): Promise<ThemePreference | null>;

// Onboarding status
export async function updateBizUserOnboardingStatus(
  bizUserId: string,
  status: OnboardingStatus,
  phase?: number
): Promise<any>;

export async function fetchBizUserOnboardingStatus(
  bizUserId: string
): Promise<{ status: OnboardingStatus; phase: number } | null>;
```

## Default Behaviors

### Feature Preferences by Plan

Features are automatically enabled based on the subscription plan:

- **Free Plan**: Basic features only
- **Basic Plan**: Basic + Priority listing + Full analytics
- **Pro Plan**: All basic + Advanced analytics + Auction access + Featured badge
- **Enterprise Plan**: All Pro features + Dedicated manager + API access + Custom integrations

### Default Theme Preference

If no theme is set, the following defaults apply:
```typescript
{
  layout: 'grid',
  primaryColor: '#f97316',      // Orange
  secondaryColor: '#6366f1',    // Indigo
  fontStyle: 'sans'
}
```

### Onboarding Phases

Onboarding is divided into phases 0-6:
- **Phase 0**: Business Description
- **Phase 1**: Product Selection
- **Phase 2**: Location
- **Phase 3**: Service Area
- **Phase 4**: Business Hours
- **Phase 5**: Photos & Documents
- **Phase 6**: Website & Team

## CSS Variables

Theme colors are applied to the DOM as CSS custom properties with the prefix `--biz-theme-`:

```css
--biz-theme-primary     /* primaryColor */
--biz-theme-secondary   /* secondaryColor */
--biz-theme-layout      /* layout */
--biz-theme-font        /* fontStyle */
```

You can use these in your CSS:
```css
.primary-button {
  background-color: var(--biz-theme-primary, #f97316);
}

.secondary-accent {
  color: var(--biz-theme-secondary, #6366f1);
}
```

## Error Handling

All async methods (`updateFeaturePreferences`, `updateThemePreference`, `updateOnboardingStatus`) throw errors if the update fails. Always wrap them in try-catch:

```typescript
try {
  await updateFeaturePreferences({ advancedAnalytics: true });
} catch (error) {
  console.error('Failed to update features:', error);
  // Show error message to user
}
```

## Backward Compatibility

All existing functionality remains unchanged. The enhancements are purely additive:
- Existing context methods work exactly as before
- Old code using `bizUser` will continue to work
- Feature preferences default to plan-based features if not explicitly set
- Onboarding defaults to 'pending' status if not set
- Theme defaults to standard colors if not customized

## Migration Guide

To use the new features in an existing component:

1. **Update imports** (if not already imported):
   ```typescript
   import { useBusinessContext } from '@/business/context/BusinessContext';
   ```

2. **Access new features**:
   ```typescript
   const { 
     canAccessFeature,
     updateThemePreference,
     isOnboardingRequired,
     // ... other methods
   } = useBusinessContext();
   ```

3. **Use in your component**:
   ```typescript
   if (!canAccessFeature('advancedAnalytics')) {
     return <UpgradeCTA />;
   }
   ```

## Testing

To test with the dev bypass:

Set `DEV_BYPASS = true` in `BusinessContext.tsx` to skip authentication and use predefined test data. The dev user has enterprise plan with all features enabled.

## Notes

- JSONB columns handle both object and string values (strings are parsed)
- All date/time values use ISO 8601 format
- Theme application is automatic whenever theme preference is updated
- Feature checks are fast (O(1)) using object property lookup
- All methods are properly typed for TypeScript safety
- Memoization ensures optimal re-render performance
