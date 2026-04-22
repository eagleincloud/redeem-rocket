# useSmartOnboarding Hook Documentation

## Overview

`useSmartOnboarding` is a comprehensive custom React hook for managing the complete Smart Onboarding flow in the business application. It provides state management, phase navigation, validation logic, and API integration for a multi-phase onboarding experience.

**File Location:** `src/business/hooks/useSmartOnboarding.ts`

## State Interface

### OnboardingState

The complete state structure managed by the hook:

```typescript
interface OnboardingState {
  featurePreferences: Record<string, boolean>;    // User's feature selections
  featuredFeatures: string[];                     // Curated features for display
  themePreference: ThemePreference;              // Brand customization
  selectedPipelineTemplates: string[];           // Chosen pipeline templates
  journeyAnswers: Record<string, any>;           // Customer journey Q&A
  generatedPipelines: any[];                     // AI-generated pipelines
  generatedAutomations: any[];                   // AI-generated automations
  currentPhase: OnboardingPhase;                 // Current phase in flow
  isLoading: boolean;                            // Async operation status
  error: string | null;                          // Error message if any
}
```

### Onboarding Phases

The hook supports 6 sequential phases:

1. **discovery** - Feature selection and initial setup
2. **showcase** - Featured features presentation
3. **theme** - Brand customization and pipeline template selection
4. **journey** - Customer journey questionnaire
5. **setup** - AI-powered setup generation
6. **preview** - Review and completion

### ThemePreference

```typescript
interface ThemePreference {
  layout: string;              // Layout style (e.g., 'default', 'compact')
  primaryColor: string;        // Primary brand color (hex)
  secondaryColor: string;      // Secondary color (hex)
  logoUrl: string | null;      // Company logo URL
  fontStyle: string;           // Font family (e.g., 'inter', 'roboto')
}
```

## Hook Usage

### Basic Initialization

```typescript
import { useSmartOnboarding } from '@/business/hooks/useSmartOnboarding';

function MyComponent() {
  // Initialize with optional userId for localStorage persistence
  const { state, updateFeaturePreferences, goNext } = useSmartOnboarding('user-123');

  // Use the returned state and methods
}
```

### Complete API

The hook returns an object with the following sections:

## State Properties

```typescript
state.currentPhase              // Current OnboardingPhase
state.isLoading                 // Whether async operation is in progress
state.error                     // Current error message or null
state.featurePreferences        // Record of selected features
state.featuredFeatures          // Array of featured feature names
state.themePreference           // ThemePreference object
state.selectedPipelineTemplates // Array of template IDs
state.journeyAnswers            // Record of questionnaire answers
state.generatedPipelines        // Array of generated pipeline objects
state.generatedAutomations      // Array of generated automation objects
```

## Update Methods

All update methods are memoized with `useCallback` for performance.

### updateFeaturePreferences(prefs: Record<string, boolean>)

Updates feature preferences. Merges with existing preferences.

```typescript
updateFeaturePreferences({
  product_catalog: true,
  lead_management: true,
  email_campaigns: false,
});
```

### updateThemePreference(theme: Partial<ThemePreference>)

Updates theme settings. Merges with existing theme.

```typescript
updateThemePreference({
  primaryColor: '#ff0000',
  logoUrl: 'https://example.com/logo.png',
});
```

### updateSelectedPipelines(pipelines: string[])

Sets selected pipeline template IDs. Replaces existing selection.

```typescript
updateSelectedPipelines(['sales-pipeline', 'customer-journey']);
```

### updateJourneyAnswers(answers: Record<string, any>)

Updates customer journey questionnaire answers. Merges with existing answers.

```typescript
updateJourneyAnswers({
  'business-size': '21-50',
  'main-challenge': 'Lead generation',
});
```

### setGeneratedPipelines(pipelines: any[])

Sets the array of AI-generated pipelines.

```typescript
setGeneratedPipelines([
  { id: 'p1', name: 'Sales Pipeline', stages: [...] },
  { id: 'p2', name: 'Support Flow', stages: [...] },
]);
```

### setGeneratedAutomations(automations: any[])

Sets the array of AI-generated automations.

```typescript
setGeneratedAutomations([
  { id: 'a1', name: 'Welcome Email', trigger: 'new_lead' },
  { id: 'a2', name: 'Follow-up SMS', trigger: 'no_response' },
]);
```

### setFeaturedFeatures(features: string[])

Sets the array of featured feature names for display.

```typescript
setFeaturedFeatures(['product_catalog', 'lead_management']);
```

### setCurrentPhase(phase: OnboardingPhase)

Sets the current onboarding phase directly.

```typescript
setCurrentPhase('theme');
```

### setIsLoading(loading: boolean)

Sets the loading state for async operations.

```typescript
setIsLoading(true);
// ... async work
setIsLoading(false);
```

### setError(error: string | null)

Sets or clears error message.

```typescript
setError('Failed to generate setup');
setError(null); // Clear error
```

## Navigation Methods

### goNext(): boolean

Moves to the next phase after validating the current phase.

```typescript
if (goNext()) {
  console.log('Successfully moved to next phase');
} else {
  console.log('Validation failed, cannot proceed');
}
```

**Returns:** `true` if successfully moved, `false` if validation failed or already at last phase

### goBack(): boolean

Moves to the previous phase and clears any errors.

```typescript
if (goBack()) {
  console.log('Moved to previous phase');
} else {
  console.log('Already at first phase');
}
```

**Returns:** `true` if successfully moved, `false` if already at first phase

## Validation Methods

All validation methods return a boolean indicating success.

### canProceed(): boolean

Validates the current phase and checks if proceeding is allowed.

```typescript
if (canProceed()) {
  goNext();
}
```

This automatically calls the appropriate phase validator:

### Phase-Specific Validators

- **validateDiscoveryPhase()** - Requires at least one feature selected
- **validateShowcasePhase()** - Always passes (informational phase)
- **validateThemePhase()** - Requires at least one pipeline template selected
- **validateJourneyPhase()** - Requires at least one journey answer
- **validateSetupPhase()** - Requires generated pipelines to exist
- **validatePreviewPhase()** - Always passes (review phase)

```typescript
const isDiscoveryValid = validateDiscoveryPhase();
const isThemeValid = validateThemePhase();
```

## Getter Methods

### getPhaseProgress(): number

Returns the progress percentage (0-100) based on current phase position.

```typescript
const progress = getPhaseProgress();
// Returns: 16.67 for discovery, 33.33 for showcase, etc.
```

### getSelectedFeatureCount(): number

Returns the count of features with `true` preference.

```typescript
const count = getSelectedFeatureCount();
// Returns: 3 if 3 features are selected
```

### hasErrors(): boolean

Checks if an error is currently set.

```typescript
if (hasErrors()) {
  console.log('Current error:', state.error);
}
```

## Utility Methods

### reset(): void

Resets all state to defaults and clears localStorage.

```typescript
reset();
// State returns to initial values
// localStorage is cleared
```

### restoreFromStorage(): boolean

Attempts to restore previously saved state from localStorage.

```typescript
const restored = restoreFromStorage();
if (restored) {
  console.log('State restored from storage');
  console.log('Resuming from:', state.currentPhase);
}
```

**Returns:** `true` if state was restored, `false` otherwise

## API Methods

### generateSmartSetup(businessType: string, businessName: string): Promise<boolean>

Calls backend API to generate customized pipelines and automations based on user selections.

**Parameters:**
- `businessType` - Type of business (e.g., 'ecommerce', 'services', 'saas')
- `businessName` - Name of the business

**Returns:** `Promise<boolean>` - `true` on success, `false` on failure

**Side Effects:**
- Sets `isLoading` to `true` during request
- Updates `generatedPipelines` and `generatedAutomations` on success
- Sets `error` message on failure
- Sets `isLoading` to `false` when complete

```typescript
const success = await generateSmartSetup('ecommerce', 'My Store');
if (success) {
  console.log('Pipelines:', state.generatedPipelines);
  console.log('Automations:', state.generatedAutomations);
} else {
  console.log('Error:', state.error);
}
```

**API Endpoint:** `/api/smart-onboarding` (POST)

**Request Body:**
```json
{
  "businessType": "ecommerce",
  "businessName": "My Store",
  "selectedFeatures": ["product_catalog", "lead_management"],
  "selectedTemplates": ["sales-pipeline"],
  "journeyAnswers": { "business-size": "21-50" },
  "themePreference": { "primaryColor": "#ff4400", ... }
}
```

**Expected Response:**
```json
{
  "pipelines": [...],
  "automations": [...]
}
```

### saveOnboarding(userId: string): Promise<boolean>

Saves all onboarding data to the database and marks onboarding as complete.

**Parameters:**
- `userId` - User ID to save for

**Returns:** `Promise<boolean>` - `true` on success, `false` on failure

**Side Effects:**
- Sets `isLoading` to `true` during request
- Clears localStorage on success
- Sets `error` message on failure
- Sets `isLoading` to `false` when complete

```typescript
const saved = await saveOnboarding('user-123');
if (saved) {
  navigate('/app/dashboard');
} else {
  console.log('Error:', state.error);
}
```

**API Endpoint:** `/api/complete-onboarding` (POST)

**Request Body:**
```json
{
  "userId": "user-123",
  "featurePreferences": { ... },
  "themePreference": { ... },
  "selectedPipelineTemplates": [...],
  "journeyAnswers": { ... },
  "generatedPipelines": [...],
  "generatedAutomations": [...]
}
```

## Error Handling

The hook provides comprehensive error handling:

1. **Validation Errors** - Set when phase validation fails
   - "Please select at least one feature to continue"
   - "Please select at least one pipeline template to continue"
   - "Please answer the journey questions to continue"

2. **API Errors** - Set when API calls fail
   - Network errors
   - Invalid response format
   - Server errors

3. **User-Friendly Messages** - All errors are user-facing strings

```typescript
if (state.error) {
  return <div className="error">{state.error}</div>;
}
```

## localStorage Persistence

The hook automatically persists state to localStorage when `userId` is provided:

- **Storage Key:** `smart_onboarding_${userId}` or `smart_onboarding`
- **Persistence:** Automatic on state changes
- **Recovery:** Use `restoreFromStorage()` to load saved state
- **Cleanup:** Cleared after successful `saveOnboarding()` call

## Performance Considerations

- All methods are memoized with `useCallback`
- Prevents unnecessary re-renders in child components
- Efficient state updates using functional setState
- localStorage operations are wrapped in try-catch for safety

## Complete Example

See `useSmartOnboarding.example.tsx` for comprehensive usage patterns including:

1. Basic feature selection
2. Theme customization with validation
3. Journey questionnaire handling
4. Async API integration
5. Preview and completion
6. Resume incomplete onboarding
7. Full component integration

## TypeScript Support

The hook is fully typed with TypeScript:

```typescript
const {
  state,
  updateFeaturePreferences,
  goNext,
}: ReturnType<typeof useSmartOnboarding> = useSmartOnboarding('user-123');

// Types are inferred throughout
state.currentPhase // OnboardingPhase
state.featurePreferences // Record<string, boolean>
```

## Integration with Existing Code

### With useBusinessContext

```typescript
function SmartOnboardingComponent() {
  const { bizUser } = useBusinessContext();
  const onboarding = useSmartOnboarding(bizUser?.id);

  // Use both contexts together
}
```

### With React Router Navigation

```typescript
import { useNavigate } from 'react-router-dom';

function OnboardingFlow() {
  const navigate = useNavigate();
  const { state, saveOnboarding } = useSmartOnboarding('user-123');

  async function handleComplete() {
    if (await saveOnboarding('user-123')) {
      navigate('/app/dashboard');
    }
  }
}
```

## Browser Compatibility

- localStorage support required for persistence
- TypeScript 4.5+
- React 16.8+ (hooks support)
- All modern browsers

## Debugging

Enable logging by monitoring state changes:

```typescript
useEffect(() => {
  console.log('Current phase:', state.currentPhase);
  console.log('Progress:', getPhaseProgress(), '%');
}, [state.currentPhase]);
```

## API Implementation Notes

The hook expects two API endpoints to be implemented:

1. **POST /api/smart-onboarding** - Generate pipelines and automations
2. **POST /api/complete-onboarding** - Save onboarding completion

Refer to examples in the hook for expected request/response formats.
