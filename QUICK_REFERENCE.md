# Smart Onboarding - Quick Reference

## What Was Built

Enhanced 3-phase onboarding flow replacing the original 5-question system:

| Phase | Component | Purpose |
|-------|-----------|---------|
| 1 | SmartOnboarding (existing) | 5 feature preference questions |
| 2 | FeatureShowcasePhase | Explore & select curated features |
| 3 | ThemeSelectionPhase | Customize theme, colors, logo, pipelines |

## New Files

```
src/business/components/
├── SmartOnboarding.tsx (updated)
└── onboarding/ (new directory)
    ├── FeatureShowcasePhase.tsx
    ├── FeatureDetailModal.tsx
    ├── ThemeSelectionPhase.tsx
    └── PipelineTemplateSelector.tsx
```

## Features at a Glance

### Phase 2: Feature Showcase
- Shows 6-10 features for user's business type
- Click "Explore" to see details in modal
- Select/deselect features
- View ROI metrics and available templates

### Phase 3: Theme Selection
- Choose dashboard layout (Minimalist, Data-Heavy, Visual-Focused)
- Set brand colors (primary & secondary)
- Upload business logo
- Select and customize pipelines (Sales, Support, Order)
- Live preview of your settings

## Testing URLs

```
http://localhost:5173/onboarding                  # Phase 1, Q1
http://localhost:5173/onboarding?onboardingPhase=4  # Phase 1, Q5
http://localhost:5173/onboarding?onboardingPhase=5  # Phase 2
http://localhost:5173/onboarding?onboardingPhase=6  # Phase 3
```

## Key Components

### FeatureShowcasePhase Props
```tsx
{
  onNext: () => void,
  onPrevious: () => void,
  selectedFeatures: string[],
  onFeatureToggle: (id: string) => void
}
```

### ThemeSelectionPhase Props
```tsx
{
  onNext: () => void,
  onPrevious: () => void,
  selectedTheme: string,
  onThemeChange: (id: string) => void,
  primaryColor: string,
  onPrimaryColorChange: (color: string) => void,
  secondaryColor: string,
  onSecondaryColorChange: (color: string) => void,
  logoUrl: string,
  onLogoUpload: (url: string) => void,
  selectedPipelines: string[],
  onPipelinesChange: (ids: string[]) => void
}
```

## What's Inside Phase 2

### Features by Category:
- **Technology**: Automation, Analytics, Team Collab, Mobile App
- **Retail**: Product Catalog, Reviews, POS Integration
- **Services**: Booking, Lead Management, Email Marketing

### Each Feature Includes:
- Icon and name
- Description
- ROI metric (e.g., "40% time savings")
- Use case details
- Available templates
- Applicable business types

## What's Inside Phase 3

### Dashboard Themes:
1. **Minimalist** - Clean, focused interface
2. **Data-Heavy** - Comprehensive metrics
3. **Visual-Focused** - Charts and graphs

### Customizations:
- Primary & secondary colors (hex input)
- Logo upload (PNG/JPG, max 2MB)
- Pipeline selection (Sales, Support, Order)
- Stage customization for each pipeline

### Live Preview Shows:
- Selected theme with your colors
- Your uploaded logo
- List of enabled pipelines

## Flow Diagram

```
Phase 1: Questions
    ↓ [Next]
Phase 2: Features
    ↓ [Next]
Phase 3: Theme & Pipelines
    ↓ [Next]
Complete: All Set!
    ↓
Dashboard
```

## State Variables

In SmartOnboarding:
```tsx
// Phase 1
const [featurePreferences, setFeaturePreferences] = useState<FeaturePreferences>({...});

// Phase 2
const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

// Phase 3
const [selectedTheme, setSelectedTheme] = useState<string>('minimalist');
const [primaryColor, setPrimaryColor] = useState<string>('#ffffff');
const [secondaryColor, setSecondaryColor] = useState<string>('#f3f4f6');
const [logoUrl, setLogoUrl] = useState<string>('');
const [selectedPipelines, setSelectedPipelines] = useState<string[]>([]);
```

## Colors (Design System)

All components use:
```
Background:    #0a0e27 (dark navy)
Cards:         #111827 (darker navy)
Borders:       #1f2937 (muted)
Text:          #ffffff (white)
Text Muted:    #9ca3af (gray)
Accent:        #ff4400 (orange)
Success:       #10b981 (green)
```

## Common Tasks

### Jump to Phase 2
```
window.location.href = '/onboarding?onboardingPhase=5'
```

### Jump to Phase 3
```
window.location.href = '/onboarding?onboardingPhase=6'
```

### Get all onboarding data
```tsx
{
  phase1: featurePreferences,
  phase2: selectedFeatures,
  phase3: {
    theme: selectedTheme,
    colors: { primary: primaryColor, secondary: secondaryColor },
    logo: logoUrl,
    pipelines: selectedPipelines
  }
}
```

## Documentation Files

1. **PHASE_2_3_IMPLEMENTATION.md** - Full technical docs
2. **ONBOARDING_USAGE_GUIDE.md** - Developer guide
3. **IMPLEMENTATION_SUMMARY.md** - Project summary

## Build Status

✓ Production build successful
✓ TypeScript: No errors
✓ Bundle size: ~1.7MB (gzip: ~446KB)

---
Ready to go! Happy onboarding!
