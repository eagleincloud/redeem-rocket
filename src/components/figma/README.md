# Figma Design System - Redeem Rocket

A comprehensive, dark glassmorphic design system for the Redeem Rocket application, built to match the Figma design specifications.

## Overview

This design system provides a complete set of reusable components, CSS tokens, and layout utilities following the Figma specification for Redeem Rocket. The system uses:

- **8px spacing grid** for consistent spacing across all components
- **Dark glassmorphic theme** with transparency and blur effects
- **Color palette** with primary (blue), secondary (purple), accent (green), and error (red) colors
- **Responsive design** with mobile-first approach
- **Accessibility-first** component design with proper ARIA attributes

## Components

### Base Components

#### 1. **Card** (`Card.tsx`)
Reusable card container with glassmorphic styling.

```tsx
import { Card, CardHeader, CardBody } from '@/components/figma';

<Card>
  <CardHeader title="Title" subtitle="Subtitle" />
  <CardBody>Content here</CardBody>
</Card>
```

**Variants:**
- Default (padding: 16px)
- Compact (padding: 12px)
- Hover effect with elevation

#### 2. **Button** (`Button.tsx`)
Flexible button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/figma';

<Button variant="primary" size="md" fullWidth={false}>
  Click me
</Button>
```

**Variants:** `primary`, `secondary`, `ghost`, `danger`, `success`
**Sizes:** `sm`, `md`, `lg`
**Props:** `isLoading`, `leftIcon`, `rightIcon`, `disabled`

#### 3. **Input** (`Input.tsx`)
Form input with label, error message, and hint support.

```tsx
import { Input } from '@/components/figma';

<Input
  label="Email"
  placeholder="user@example.com"
  error="Invalid email"
  required={true}
  leftIcon={<EnvelopeIcon />}
/>
```

**Props:**
- `label`: Label text
- `error`: Error message
- `hint`: Helper text
- `required`: Required field indicator
- `leftIcon` / `rightIcon`: Icon elements

#### 4. **Select** (`Select.tsx`)
Dropdown select component with custom styling.

```tsx
import { Select } from '@/components/figma';

<Select
  label="Category"
  options={[
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'retail', label: 'Retail' },
  ]}
  placeholder="Choose a category"
/>
```

#### 5. **Toggle** (`Toggle.tsx`)
Switch/toggle component for boolean values.

```tsx
import { Toggle } from '@/components/figma';

<Toggle
  label="Enable notifications"
  defaultChecked={true}
/>
```

#### 6. **Tabs** (`Tabs.tsx`)
Tabbed interface for organizing content.

```tsx
import { Tabs } from '@/components/figma';

<Tabs
  tabs={[
    { id: 'tab1', label: 'Tab 1', content: <div>Content 1</div> },
    { id: 'tab2', label: 'Tab 2', content: <div>Content 2</div> },
  ]}
  defaultTabId="tab1"
/>
```

#### 7. **Modal** (`Modal.tsx`)
Dialog component with optional confirm variant.

```tsx
import { Modal, ConfirmModal } from '@/components/figma';

<Modal isOpen={true} title="Dialog" onClose={handleClose}>
  <p>Modal content</p>
</Modal>

<ConfirmModal
  isOpen={true}
  title="Confirm"
  message="Are you sure?"
  onConfirm={handleConfirm}
  onCancel={handleCancel}
  isDangerous={false}
/>
```

#### 8. **Badge** (`Badge.tsx`)
Status badge component with color variants.

```tsx
import { Badge } from '@/components/figma';

<Badge variant="success">Active</Badge>
<Badge variant="error">Error</Badge>
```

**Variants:** `default`, `success`, `error`, `warning`, `info`

#### 9. **Avatar** (`Avatar.tsx`)
User avatar with initials fallback and status indicator.

```tsx
import { Avatar } from '@/components/figma';

<Avatar
  src="/avatar.jpg"
  name="John Doe"
  size="md"
  status="online"
/>
```

**Sizes:** `sm`, `md`, `lg`, `xl`
**Status:** `online`, `offline`, `away`

### Layout Components

#### 1. **AppShell** (`layout/AppShell.tsx`)
Main application wrapper providing navigation and layout structure.

```tsx
import { AppShell } from '@/components/figma/layout';

<AppShell showNavigation={true}>
  <main>Page content</main>
</AppShell>
```

#### 2. **Navigation** (`layout/Navigation.tsx`)
Sidebar navigation component (automatically included in AppShell).

#### 3. **Header** (`layout/Header.tsx`)
Page header with title, subtitle, breadcrumbs, and action buttons.

```tsx
import { Header } from '@/components/figma/layout';

<Header
  title="Page Title"
  subtitle="Page description"
  breadcrumbs={[
    { label: 'Dashboard', href: '/app' },
    { label: 'Current Page' },
  ]}
  action={<Button>Action</Button>}
/>
```

## Design System CSS

The design system CSS is defined in `/src/styles/figma-design-system.css` and includes:

### CSS Variables

```css
/* Colors */
--color-primary-500: #3b82f6;
--color-secondary-500: #a855f7;
--color-accent-500: #22c55e;
--color-error-500: #ef4444;

/* Spacing (8px grid) */
--space-4: 0.5rem;   /* 8px */
--space-8: 1rem;     /* 16px */
--space-16: 2rem;    /* 32px */

/* Typography */
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-weight-medium: 500;

/* Shadows and Effects */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--glass-blur: blur(10px);

/* Transitions */
--transition-base: 200ms ease-in-out;
```

### Utility Classes

Common utility classes are available:

```tsx
<div className="flex flex-between gap-4">
  <h1 className="text-2xl font-bold">Title</h1>
  <Button>Action</Button>
</div>
```

Available utilities:
- **Spacing**: `p-4`, `m-4`, `mb-8`, `mt-6`, `gap-4`
- **Display**: `flex`, `flex-col`, `flex-center`, `grid`, `grid-cols-2`
- **Text**: `text-lg`, `font-bold`, `text-primary`, `text-secondary`
- **Visibility**: `hidden`, `visible`

## Usage Examples

### Form Example

```tsx
import { Card, CardHeader, CardBody, Input, Button, Select, Toggle } from '@/components/figma';

export function SettingsForm() {
  const [data, setData] = useState({});
  const [errors, setErrors] = useState({});

  return (
    <Card>
      <CardHeader title="Settings" />
      <CardBody>
        <Input
          label="Business Name"
          placeholder="Enter name"
          error={errors.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
        />
        <Select
          label="Category"
          options={[...]}
          onChange={(e) => setData({ ...data, category: e.target.value })}
        />
        <Toggle
          label="Email notifications"
          onChange={(e) => setData({ ...data, notifications: e.target.checked })}
        />
        <Button variant="primary" fullWidth={true}>
          Save
        </Button>
      </CardBody>
    </Card>
  );
}
```

### Dashboard Example

```tsx
import { Header, AppShell } from '@/components/figma/layout';
import { Card, CardHeader, Badge } from '@/components/figma';

export function DashboardPage() {
  return (
    <AppShell>
      <Header
        title="Dashboard"
        subtitle="Overview of your business"
        breadcrumbs={[{ label: 'Home', href: '/app' }, { label: 'Dashboard' }]}
      />
      <main style={{ padding: 'var(--space-20)' }}>
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader title="Total Leads" />
            <div style={{ padding: 'var(--space-16)', fontSize: 'var(--font-size-2xl)', fontWeight: 'bold' }}>
              1,234 <Badge variant="success">↑ 12%</Badge>
            </div>
          </Card>
          {/* More cards... */}
        </div>
      </main>
    </AppShell>
  );
}
```

## Color Palette

### Primary Colors (Blue)
- `--color-primary-600`: #2563eb (Button backgrounds)
- `--color-primary-500`: #3b82f6 (Links, focus states)
- `--color-primary-400`: #60a5fa (Hover states)

### Secondary Colors (Purple)
- `--color-secondary-600`: #9333ea
- `--color-secondary-500`: #a855f7

### Accent Colors (Green - Success)
- `--color-accent-500`: #22c55e (Success states)
- `--color-accent-600`: #16a34a

### Status Colors
- **Error**: `--color-error-500` (#ef4444)
- **Warning**: `--color-warning-500` (#f59e0b)
- **Info**: `--color-info-500` (#4180ff)

### Neutral Colors (Gray)
- `--color-gray-50` to `--color-gray-900`
- `--color-dark-bg`: #0f1419 (Background)
- `--color-text-primary`: #f9fafb (Primary text)
- `--color-text-secondary`: #d1d5db (Secondary text)

## Responsive Design

All components are mobile-first and responsive. Breakpoints:
- **Mobile**: < 768px (single column layouts)
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

Example:

```tsx
<div className="grid grid-cols-4" style={{ 
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' 
}}>
  {/* Cards automatically wrap on mobile */}
</div>
```

## Accessibility

All components include proper ARIA attributes:

- **Buttons**: `type="button"` for non-submit buttons, `aria-label` for icon buttons
- **Inputs**: `<label htmlFor="id">` associations, `aria-required`, `aria-invalid`
- **Modals**: `aria-modal="true"`, `role="dialog"`, focus management
- **Tabs**: `role="tablist"`, `aria-selected`, proper tab semantics
- **Navigation**: `role="navigation"`, proper link semantics, `aria-current="page"`

## Import Patterns

```tsx
// Import individual components
import { Button, Input, Card } from '@/components/figma';

// Import layout components
import { AppShell, Navigation, Header } from '@/components/figma/layout';

// Or import all at once
import * as Figma from '@/components/figma';
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari 15+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Components use React.forwardRef for direct DOM access
- CSS uses custom properties (variables) for fast re-theming
- Transitions use GPU acceleration
- Modal uses fixed positioning for proper layering

## Next Steps (Phase 2-8)

Phase 2+ will involve updating the following screens to use this design system:

1. **Onboarding Screens**: Welcome, Business Details, Feature Selection, Customization, Preview
2. **Dashboard**: Stats cards, graphs, quick actions
3. **Leads Module**: List view with filters, detail view with timeline
4. **Marketing**: Campaign builder, analytics
5. **Automation**: Rule builder, flow visualization
6. **Settings & AI**: AI chat, settings pages
7. **Admin**: Admin panels and utilities

See the main FIGMA_REDESIGN.md plan for detailed implementation roadmap.
