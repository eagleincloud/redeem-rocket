# Smart Onboarding Hook - Implementation Index

## Quick Reference

### Files Created

| File | Location | Size | Purpose |
|------|----------|------|---------|
| Main Hook | `src/business/hooks/useSmartOnboarding.ts` | 677 lines | Core implementation |
| Examples | `src/business/hooks/useSmartOnboarding.example.tsx` | 455 lines | 7 example components |
| API Docs | `src/business/hooks/USESMARTBOARDING.md` | 516 lines | Complete reference |
| Summary | `SMART_ONBOARDING_HOOK_SUMMARY.md` | 9.2KB | Implementation overview |

### Quick Start

```typescript
import { useSmartOnboarding } from '@/business/hooks/useSmartOnboarding';

function MyComponent() {
  const onboarding = useSmartOnboarding('user-123');
  
  // Use state and methods
  const { state, updateFeaturePreferences, goNext } = onboarding;
}
```

## API Overview

### State Properties
- `currentPhase` - Current OnboardingPhase
- `isLoading` - Async operation status
- `error` - Error message or null
- `featurePreferences` - Selected features
- `featuredFeatures` - Featured feature list
- `themePreference` - Brand customization
- `selectedPipelineTemplates` - Pipeline templates
- `journeyAnswers` - Questionnaire answers
- `generatedPipelines` - AI-generated pipelines
- `generatedAutomations` - AI-generated automations

### Update Methods (10)
- `updateFeaturePreferences(prefs)`
- `updateThemePreference(theme)`
- `updateSelectedPipelines(pipelines)`
- `updateJourneyAnswers(answers)`
- `setGeneratedPipelines(pipelines)`
- `setGeneratedAutomations(automations)`
- `setFeaturedFeatures(features)`
- `setCurrentPhase(phase)`
- `setIsLoading(loading)`
- `setError(error)`

### Navigation Methods (4)
- `goNext()` - Move to next phase
- `goBack()` - Move to previous phase
- `canProceed()` - Validate current phase
- `reset()` - Reset all state

### Validation Methods (7)
- `validateDiscoveryPhase()`
- `validateShowcasePhase()`
- `validateThemePhase()`
- `validateJourneyPhase()`
- `validateSetupPhase()`
- `validatePreviewPhase()`
- `canProceed()`

### Getter Methods (3)
- `getPhaseProgress()` - Returns 0-100%
- `getSelectedFeatureCount()` - Returns count
- `hasErrors()` - Returns boolean

### API Methods (2 async)
- `generateSmartSetup(businessType, businessName)` - Generate setup
- `saveOnboarding(userId)` - Save to database

### Utility Methods (2)
- `restoreFromStorage()` - Load saved state
- `reset()` - Reset all state

## Phases

```
discovery → showcase → theme → journey → setup → preview
```

1. **discovery** - Select features (1+ required)
2. **showcase** - View featured features
3. **theme** - Customize brand + select templates (1+ required)
4. **journey** - Answer questionnaire (1+ required)
5. **setup** - Generate AI setup (requires generation)
6. **preview** - Review and save

## Key Features

### State Management
- ✓ React hooks (useState, useCallback)
- ✓ Memoized functions (25+ callbacks)
- ✓ localStorage persistence
- ✓ Error state tracking

### Validation
- ✓ Phase-specific validators
- ✓ Pre-flight checks before transitions
- ✓ User-friendly error messages
- ✓ State transition protection

### Performance
- ✓ useCallback memoization
- ✓ Efficient re-renders
- ✓ Proper dependency arrays
- ✓ localStorage batching

### Error Handling
- ✓ Validation errors
- ✓ API errors
- ✓ Storage errors
- ✓ Network errors

## Complete Example

```typescript
import { useSmartOnboarding } from '@/business/hooks/useSmartOnboarding';

function SmartOnboardingFlow() {
  const onboarding = useSmartOnboarding('user-123');
  const { state, updateFeaturePreferences, goNext, canProceed } = onboarding;

  // Discovery Phase
  const handleSelectFeature = (feature: string) => {
    updateFeaturePreferences({
      [feature]: !state.featurePreferences[feature]
    });
  };

  const handleNext = () => {
    if (canProceed()) {
      goNext();
    }
  };

  return (
    <div>
      <h2>Select Features</h2>
      {Object.keys(state.featurePreferences).map(feature => (
        <input
          key={feature}
          type="checkbox"
          checked={state.featurePreferences[feature]}
          onChange={() => handleSelectFeature(feature)}
        />
      ))}
      {state.error && <div className="error">{state.error}</div>}
      <button onClick={handleNext} disabled={!canProceed()}>
        Continue
      </button>
    </div>
  );
}
```

## Integration with Existing Code

### With useBusinessContext
```typescript
const { bizUser } = useBusinessContext();
const onboarding = useSmartOnboarding(bizUser?.id);
```

### With React Router
```typescript
const navigate = useNavigate();

async function handleComplete() {
  const saved = await onboarding.saveOnboarding('user-123');
  if (saved) {
    navigate('/app/dashboard');
  }
}
```

## Documentation Links

- **Main Documentation**: See `src/business/hooks/USESMARTBOARDING.md`
- **Usage Examples**: See `src/business/hooks/useSmartOnboarding.example.tsx`
- **Implementation Summary**: See `SMART_ONBOARDING_HOOK_SUMMARY.md`

## API Endpoints Required

1. **POST /api/smart-onboarding**
   - Generate pipelines and automations
   - Input: businessType, businessName, selectedFeatures, etc.
   - Output: { pipelines, automations }

2. **POST /api/complete-onboarding**
   - Save all onboarding data
   - Input: userId, all onboarding state
   - Output: { success: boolean }

## Requirements Coverage

| Requirement | Status | Location |
|------------|--------|----------|
| OnboardingState interface | ✓ | Line 22-33 |
| Default state initialization | ✓ | Line 35-59 |
| Update methods (10) | ✓ | Lines 104-262 |
| Navigation methods (4) | ✓ | Lines 282-380 |
| Validation logic (7) | ✓ | Lines 389-491 |
| Getter methods (3) | ✓ | Lines 511-535 |
| API handlers (2) | ✓ | Lines 548-633 |
| useCallback memoization | ✓ | Throughout |
| Error handling | ✓ | All methods |
| TypeScript types | ✓ | Full coverage |
| JSDoc comments | ✓ | All functions |
| localStorage persistence | ✓ | Lines 97-101 |

## Testing Checklist

- [ ] Unit test validators
- [ ] Test state updates
- [ ] Test phase navigation
- [ ] Test localStorage persistence
- [ ] Test API integration
- [ ] Test error handling
- [ ] Test with useBusinessContext
- [ ] Test with React Router
- [ ] E2E test complete flow
- [ ] Performance profiling

## Next Steps

1. Create backend API endpoints
2. Create phase-specific components
3. Integrate with login/signup flow
4. Add unit and E2E tests
5. Deploy to production

## Support & Questions

For detailed documentation, see:
- `USESMARTBOARDING.md` - Complete API reference
- `useSmartOnboarding.example.tsx` - 7 complete examples
- `SMART_ONBOARDING_HOOK_SUMMARY.md` - Implementation overview
