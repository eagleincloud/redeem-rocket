# Smart Onboarding Context - Quick Start Guide

## What Was Added?

The BusinessContext now supports **Smart Onboarding** with three core features:

1. **Feature Preferences** - Control which features users can access based on their plan
2. **Theme Management** - Custom branding with primary/secondary colors and layouts
3. **Onboarding Status** - Track where users are in the onboarding process

## Installation

1. **Run the migration** in Supabase:
   ```bash
   # The migration file is ready to deploy
   supabase/migrations/20260422_smart_onboarding_context.sql
   ```

2. **No npm dependencies added** - Everything uses existing packages

## Basic Usage

### Feature Access Control

```typescript
import { useBusinessContext } from '@/business/context/BusinessContext';

export function MyComponent() {
  const { canAccessFeature, getEnabledFeatures } = useBusinessContext();

  // Check if user can access a specific feature
  if (!canAccessFeature('advancedAnalytics')) {
    return <UpgradePrompt />;
  }

  // Get all enabled features
  const features = getEnabledFeatures(); // ['basicAnalytics', 'teamManagement', ...]

  return <Dashboard />;
}
```

### Update Features

```typescript
const { updateFeaturePreferences } = useBusinessContext();

await updateFeaturePreferences({
  advancedAnalytics: true,
  apiAccess: true,
  customIntegrations: false,
});
```

### Theme Customization

```typescript
const { updateThemePreference, applyThemeToDOM } = useBusinessContext();

// Update and persist to database
await updateThemePreference({
  primaryColor: '#3b82f6',      // Blue
  secondaryColor: '#ec4899',    // Pink
  layout: 'grid',
  fontStyle: 'modern',
});

// Use CSS variables in your styles
// --biz-theme-primary
// --biz-theme-secondary
// --biz-theme-layout
// --biz-theme-font
```

### Onboarding Flow

```typescript
const { 
  isOnboardingRequired,
  getCurrentOnboardingPhase,
  updateOnboardingStatus 
} = useBusinessContext();

export function App() {
  if (isOnboardingRequired()) {
    const phase = getCurrentOnboardingPhase();
    return <OnboardingWizard initialPhase={phase} />;
  }

  return <Dashboard />;
}

// When user completes a step
async function handlePhaseComplete(phaseNumber: number) {
  await updateOnboardingStatus('in_progress', phaseNumber);
}

// When onboarding is complete
async function handleOnboardingComplete() {
  await updateOnboardingStatus('completed', 6);
}
```

## Default Behaviors

### Automatic Feature Enablement by Plan

| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| basicAnalytics | ❌ | ✅ | ✅ | ✅ |
| advancedAnalytics | ❌ | ❌ | ✅ | ✅ |
| auctionAccess | ❌ | ❌ | ✅ | ✅ |
| apiAccess | ❌ | ❌ | ❌ | ✅ |
| teamManagement | ❌ | ✅ | ✅ | ✅ |
| dedicatedManager | ❌ | ❌ | ❌ | ✅ |

### Default Theme Colors

```typescript
{
  layout: 'grid',
  primaryColor: '#f97316',    // Orange
  secondaryColor: '#6366f1',  // Indigo
  fontStyle: 'sans'
}
```

### Onboarding Phases

- **Phase 0**: Business Description
- **Phase 1**: Product Selection
- **Phase 2**: Location
- **Phase 3**: Service Area
- **Phase 4**: Business Hours
- **Phase 5**: Photos & Documents
- **Phase 6**: Website & Team

## Real-World Examples

### Conditional Feature UI

```typescript
function AnalyticsSection() {
  const { bizUser, canAccessFeature } = useBusinessContext();

  if (!canAccessFeature('basicAnalytics')) {
    return (
      <div className="p-4 bg-blue-50 rounded">
        <p>Upgrade to Basic plan to access analytics</p>
        <button onClick={() => navigateToUpgrade()}>
          Upgrade Now
        </button>
      </div>
    );
  }

  const showAdvanced = canAccessFeature('advancedAnalytics');

  return (
    <div>
      <BasicAnalytics />
      {showAdvanced && <AdvancedAnalytics />}
    </div>
  );
}
```

### Brand Customization

```typescript
function BrandSettings() {
  const { bizUser, updateThemePreference } = useBusinessContext();
  const [primaryColor, setPrimaryColor] = useState(
    bizUser?.themePreference?.primaryColor || '#f97316'
  );

  const handleSave = async () => {
    try {
      await updateThemePreference({
        ...bizUser?.themePreference,
        primaryColor,
      });
      showToast('Brand colors updated!');
    } catch (error) {
      showToast('Failed to update brand colors', 'error');
    }
  };

  return (
    <div>
      <input 
        type="color" 
        value={primaryColor} 
        onChange={(e) => setPrimaryColor(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Onboarding Progress Tracker

```typescript
function OnboardingProgress() {
  const { getCurrentOnboardingPhase } = useBusinessContext();
  const phase = getCurrentOnboardingPhase();
  const progress = ((phase + 1) / 7) * 100;

  return (
    <div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p>Step {phase + 1} of 7</p>
    </div>
  );
}
```

## API Reference (Quick Lookup)

### Feature Methods
```typescript
canAccessFeature(featureName: string): boolean
getEnabledFeatures(): string[]
getEnabledFeatureCount(): number
updateFeaturePreferences(prefs: Record<string, boolean>): Promise<void>
```

### Theme Methods
```typescript
updateThemePreference(theme: ThemePreference): Promise<void>
applyThemeToDOM(theme?: ThemePreference): void
```

### Onboarding Methods
```typescript
isOnboardingRequired(): boolean
getCurrentOnboardingPhase(): number
updateOnboardingStatus(status: 'pending'|'in_progress'|'completed', phase?: number): Promise<void>
```

## Common Patterns

### Check Multiple Features

```typescript
const { getEnabledFeatures } = useBusinessContext();
const features = getEnabledFeatures();
const hasTeamAndAnalytics = features.includes('teamManagement') && 
                            features.includes('advancedAnalytics');
```

### Fallback Theme Colors

```typescript
const { bizUser } = useBusinessContext();
const primaryColor = bizUser?.themePreference?.primaryColor || '#f97316';
```

### Skip Onboarding if Complete

```typescript
const { isOnboardingRequired } = useBusinessContext();

useEffect(() => {
  if (!isOnboardingRequired()) {
    navigate('/dashboard');
  }
}, [isOnboardingRequired]);
```

## Troubleshooting

### Features not showing as enabled?
1. Check that business has correct plan
2. Verify feature name matches the key (case-sensitive)
3. Look for error logs in browser console

### Theme colors not applying?
1. Check that CSS custom properties are set: `--biz-theme-primary`, etc.
2. Make sure component is within `<BusinessProvider>`
3. Verify `updateThemePreference()` resolved without error

### Onboarding status not saving?
1. Ensure you're calling `updateOnboardingStatus()` not just setting state
2. Check that business ID exists (not null)
3. Verify Supabase connection is working

## Next Steps

1. **Run the migration** - Apply database schema changes
2. **Update SmartOnboarding component** - Use new methods to track progress
3. **Add feature checks** - Conditionally show UI based on plan
4. **Integrate theme customizer** - Let businesses customize colors
5. **Add analytics** - Track which phases users complete

## Documentation

- Full API docs: `SMART_ONBOARDING_CONTEXT.md`
- Implementation details: `SMART_ONBOARDING_IMPLEMENTATION.md`
- Code: `src/business/context/BusinessContext.tsx`
- Database: `supabase/migrations/20260422_smart_onboarding_context.sql`

## Support

All methods include TypeScript types and JSDoc comments. Hover over methods in your IDE for inline documentation.
