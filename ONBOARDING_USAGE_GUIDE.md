# Smart Onboarding Usage Guide

## Overview

The Smart Onboarding component now supports 3 phases:
- **Phase 1**: Feature preference questions (existing)
- **Phase 2**: Feature showcase and exploration
- **Phase 3**: Theme customization and pipeline setup

## Quick Start

### Using SmartOnboarding in Your App

```tsx
import { SmartOnboarding } from '@/business/components/SmartOnboarding';

export function OnboardingPage() {
  return <SmartOnboarding />;
}
```

### Testing Different Phases

Use URL query parameters to jump to specific phases during development:

```
# Phase 1 - Question 1 (default)
/onboarding

# Phase 1 - Question 3
/onboarding?onboardingPhase=2

# Phase 1 - Question 5
/onboarding?onboardingPhase=4

# Phase 2 - Feature Showcase
/onboarding?onboardingPhase=5

# Phase 3 - Theme Selection
/onboarding?onboardingPhase=6
```

## Phase Details

### Phase 1: Feature Questions

User answers 5 yes/no questions about feature preferences:
1. Product catalog
2. Lead management
3. Email campaigns
4. Automation
5. Social media

State saved in: `featurePreferences`

### Phase 2: Feature Showcase

Users explore and select features curated for their business type.

**Features displayed based on `bizUser.businessCategory`**:
- **Technology**: Automation, Analytics, Team Collab, Mobile App
- **Retail**: Product Catalog, Reviews, POS Integration
- **Services**: Booking, Lead Management, Email Marketing

**User actions**:
- Click "Explore" to see feature details in modal
- Select/deselect features
- View ROI metrics and templates

State saved in: `selectedFeatures` array

### Phase 3: Theme Selection

Users customize dashboard appearance and set up business pipelines.

**Dashboard Themes**:
1. **Minimalist** - Clean, focused interface
2. **Data-Heavy** - Comprehensive metrics view
3. **Visual-Focused** - Charts and graphs

**Customization Options**:
- Primary and secondary colors (hex input or color picker)
- Logo upload (PNG/JPG, up to 2MB)
- Pipeline template selection (Sales, Support, Order)
- Stage customization for each pipeline

**Live Preview**:
- Shows theme with selected colors and logo
- Displays enabled pipelines

State saved in: `selectedTheme`, `primaryColor`, `secondaryColor`, `logoUrl`, `selectedPipelines`

## Accessing Onboarding Data

After completion, user data is stored in:

```tsx
// In BusinessContext
bizUser.feature_preferences // Phase 1 answers
// Phase 2 and 3 data can be added to BizUser interface
```

## Component Props Reference

### FeatureShowcasePhase

```tsx
<FeatureShowcasePhase
  onNext={() => {}}                    // Navigate to Phase 3
  onPrevious={() => {}}                // Return to Phase 1
  selectedFeatures={[]}                // Selected feature IDs
  onFeatureToggle={(id) => {}}         // Toggle feature selection
/>
```

### ThemeSelectionPhase

```tsx
<ThemeSelectionPhase
  onNext={() => {}}                           // Complete onboarding
  onPrevious={() => {}}                       // Return to Phase 2
  selectedTheme="minimalist"                  // Current theme
  onThemeChange={(theme) => {}}              // Theme change handler
  primaryColor="#ffffff"                     // Primary color hex
  onPrimaryColorChange={(color) => {}}       // Primary color change
  secondaryColor="#f3f4f6"                   // Secondary color hex
  onSecondaryColorChange={(color) => {}}     // Secondary color change
  logoUrl=""                                 // Logo data URL
  onLogoUpload={(url) => {}}                // Logo upload handler
  selectedPipelines={[]}                     // Selected pipeline IDs
  onPipelinesChange={(ids) => {}}           // Pipeline change handler
/>
```

### FeatureShowcasePhase Feature Object

```tsx
interface Feature {
  id: string;                // 'product_catalog', 'automation', etc.
  name: string;              // 'Product Catalog'
  description: string;       // Short description
  icon: React.ReactNode;    // Lucide icon
  roiMetric: string;        // '50% more engagement'
  category: string;         // 'Sales', 'Productivity', etc.
  businessTypes: string[];  // ['Retail', 'E-commerce']
  useCase: string;          // Detailed use case description
  templates: string[];      // ['Basic Catalog', 'Fashion Showcase']
}
```

### PipelineTemplateSelector Pipeline Object

```tsx
interface PipelineTemplate {
  id: string;              // 'sales', 'support', 'order'
  name: string;            // 'Sales Pipeline'
  description: string;     // 'Track deals from lead to close'
  icon: string;            // '💰'
  stages: string[];        // ['Lead', 'Qualified', 'Proposal', ...]
}
```

## Styling

All components use inline styles with consistent color variables:

```tsx
const colors = {
  bg: '#0a0e27',           // Dark background
  card: '#111827',         // Card background
  border: '#1f2937',       // Border color
  text: '#ffffff',         // Primary text
  textMuted: '#9ca3af',    // Secondary text
  accent: '#ff4400',       // Action color (orange)
  success: '#10b981',      // Success color (green)
};
```

To customize colors, modify the `colors` object in each component.

## Adding Custom Features

To add new features, edit the `FEATURES_BY_CATEGORY` object in `FeatureShowcasePhase.tsx`:

```tsx
const FEATURES_BY_CATEGORY: Record<string, Feature[]> = {
  'Technology': [
    {
      id: 'new_feature',
      name: 'New Feature Name',
      description: 'Feature description',
      icon: <YourIcon size={28} />,
      roiMetric: 'Impact metric',
      category: 'Category',
      businessTypes: ['Technology'],
      useCase: 'Use case description',
      templates: ['Template 1', 'Template 2'],
    },
    // ... more features
  ],
};
```

## Adding Custom Pipeline Templates

To add new pipeline templates, edit the `PIPELINE_TEMPLATES` array in `PipelineTemplateSelector.tsx`:

```tsx
const PIPELINE_TEMPLATES: PipelineTemplate[] = [
  {
    id: 'custom_pipeline',
    name: 'Custom Pipeline',
    description: 'Description',
    icon: '🎯',
    stages: ['Stage 1', 'Stage 2', 'Stage 3'],
  },
  // ... more templates
];
```

## Common Tasks

### Skip a Phase (for testing)

Use the `?onboardingPhase=N` parameter:

```
# Jump to Phase 2
/onboarding?onboardingPhase=5

# Jump to Phase 3
/onboarding?onboardingPhase=6
```

### Get Feature Selection Data

```tsx
// In finishOnboarding or after completion
const featureData = {
  phase1: featurePreferences,  // {product_catalog: true, ...}
  phase2: selectedFeatures,     // ['automation', 'analytics']
  phase3: {
    theme: selectedTheme,
    colors: { primary: primaryColor, secondary: secondaryColor },
    logo: logoUrl,
    pipelines: selectedPipelines,
  }
};
```

### Customize Theme Preview

Modify the "Live Preview" section in `ThemeSelectionPhase.tsx` to show more details:

```tsx
<div
  style={{
    background: selectedThemeObj?.colors.primary,
    borderRadius: '8px',
    padding: '16px',
    minHeight: '100px',
    // Add more styles or content here
  }}
>
  {/* Custom preview content */}
</div>
```

## Troubleshooting

### Features not showing for my business type

Check `bizUser.businessCategory` matches one of the keys in `FEATURES_BY_CATEGORY`:
- 'Technology'
- 'Retail'
- 'Services'

If not found, it defaults to 'Technology' features.

### Logo preview not showing

Ensure the file is:
- PNG or JPG format
- Under 2MB
- Being properly converted to data URL by FileReader

### Phases not transitioning

Check that `setStageInternal()` is being called with correct stage name ('phase_1', 'phase_2', 'phase_3', 'complete').

### Colors not updating in preview

Ensure hex color format is valid (e.g., '#ffffff', not 'white').

## Future Enhancements

- [ ] Integration with template system for quick-start dashboards
- [ ] Feature recommendation engine based on business type and industry
- [ ] A/B testing different theme presets
- [ ] Custom stage workflow builder
- [ ] Feature toggle management in settings
- [ ] Onboarding analytics and completion tracking
- [ ] Re-run onboarding from settings
