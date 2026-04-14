# Modern Theme Setup Guide

Beautiful dark premium theme for Redeem Rocket Business App with orange accents and glow effects.

---

## 📋 Theme Features

✨ **Premium Dark Design**
- Deep navy/purple background (#0F1426)
- Orange primary accent (#FF9E64)
- Professional, modern appearance
- Smooth transitions and glowing effects

🎨 **Complete Component Styling**
- Buttons (Primary, Secondary, Ghost)
- Form inputs with focus states
- Cards with hover effects
- Badges and labels
- Navigation and sidebar
- Tables with hover highlights

⚡ **Animations & Effects**
- Fade in/slide transitions
- Glow effects on interactive elements
- Smooth hover animations
- Elevation changes on interaction

🎯 **Accessibility**
- High contrast text
- Clear focus states
- Proper spacing and sizing
- Semantic color meanings

---

## 🚀 How to Use

### 1. Import Theme CSS in Main App File

In your main app component (usually `src/business/pages/App.tsx` or `src/business/main.tsx`):

```typescript
import '../theme/modern-theme.css';
```

### 2. Use Theme Variables in Components

All CSS custom properties are available globally:

```css
/* Example: Custom component using theme variables */
.my-component {
  background: var(--bg-card);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--space-4);
}

.my-component:hover {
  box-shadow: var(--shadow-glow-md);
  transform: translateY(-2px);
  transition: all var(--transition-base);
}
```

### 3. Use Predefined Classes

```html
<!-- Buttons -->
<button class="primary">Primary Button</button>
<button class="secondary">Secondary Button</button>
<button class="ghost">Ghost Button</button>

<!-- Text Colors -->
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-success">Success message</p>

<!-- Cards -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card content here</p>
</div>

<!-- Badges -->
<span class="badge success">Active</span>
<span class="badge warning">Pending</span>
<span class="badge danger">Failed</span>

<!-- Animations -->
<div class="fade-in">Fades in smoothly</div>
<div class="slide-in-right">Slides from right</div>
<div class="glow">Glowing effect</div>
```

### 4. Import Theme TypeScript

For TypeScript support in your components:

```typescript
import { modernTheme } from '../theme/modern-theme';

// Access theme values
const primaryColor = modernTheme.colors.primary[500]; // #FF9E64
const spacing = modernTheme.spacing[4]; // 1rem
const shadowGlow = modernTheme.shadows.glow.md; // 0 0 20px...
```

---

## 🎨 Color Palette

### Primary Colors
- **Main Orange:** #FF9E64
- **Hover:** #FF8C3A  
- **Active:** #E67E31

### Background
- **Darkest:** #0A0E1A
- **Dark:** #0F1426
- **Card:** #1A1E3F
- **Input:** #242B4D
- **Hover:** #2D3557

### Text
- **Primary:** #F8F9FA
- **Secondary:** #D1D5DB
- **Muted:** #9CA3AF
- **Placeholder:** #6B7280

### Semantic
- **Success:** #10B981
- **Warning:** #F59E0B
- **Danger:** #EF4444
- **Info:** #3B82F6

---

## 🛠️ Customization

To customize the theme, edit the CSS variables in `modern-theme.css`:

```css
:root {
  --color-primary: #FF9E64; /* Change primary color */
  --bg-dark: #0F1426; /* Change dark background */
  --text-primary: #F8F9FA; /* Change primary text color */
  /* ... modify other variables */
}
```

Or modify the TypeScript theme object in `modern-theme.ts`:

```typescript
export const modernTheme = {
  colors: {
    primary: {
      500: '#YOUR_COLOR_HERE', // Change here
    },
    // ... modify other values
  },
};
```

---

## 📝 Component Examples

### Button with Icon

```tsx
<button class="primary">
  <span>📧</span> Send Email
</button>
```

### Card with Content

```html
<div class="card">
  <h3>Email Campaign</h3>
  <p>Manage your outreach campaigns</p>
  <button class="primary">Start Campaign</button>
</div>
```

### Form with Validation

```html
<form>
  <label>Email Address</label>
  <input type="email" placeholder="your@email.com" />
  
  <label>Message</label>
  <textarea placeholder="Your message here..."></textarea>
  
  <button type="submit" class="primary">Send</button>
</form>
```

### Status Badges

```html
<div>
  <span class="badge success">✓ Delivered</span>
  <span class="badge warning">⏳ Pending</span>
  <span class="badge danger">✗ Failed</span>
</div>
```

---

## 🎯 Best Practices

### 1. Use Semantic Colors
```css
/* ✅ Good */
.error-message {
  color: var(--color-danger);
}

/* ❌ Avoid */
.error-message {
  color: #FF0000;
}
```

### 2. Use Spacing Variables
```css
/* ✅ Good */
.padding-standard {
  padding: var(--space-4); /* 1rem */
}

/* ❌ Avoid */
.padding-standard {
  padding: 16px;
}
```

### 3. Use Transitions
```css
/* ✅ Good */
.interactive {
  transition: all var(--transition-base);
}

/* ❌ Avoid */
.interactive {
  transition: all 0.3s;
}
```

### 4. Consistent Shadows
```css
/* ✅ Good */
.elevated {
  box-shadow: var(--shadow-lg);
}

/* ❌ Avoid */
.elevated {
  box-shadow: 0 10px 15px rgba(0,0,0,0.2);
}
```

---

## 🔄 Responsive Design

The theme includes mobile-first responsive breakpoints:

```css
@media (max-width: 768px) {
  /* Mobile styles */
  body {
    font-size: 0.95rem;
  }
  
  .card {
    padding: var(--space-4);
  }
  
  button {
    width: 100%;
  }
}
```

To add responsive classes to your components:

```tsx
<div style={{ 
  fontSize: 'var(--font-size-base)',
  '@media (max-width: 768px)': {
    fontSize: 'var(--font-size-sm)'
  }
}}>
  Responsive text
</div>
```

---

## 📚 Resources

- **Theme File:** `src/business/theme/modern-theme.ts`
- **CSS Styles:** `src/business/theme/modern-theme.css`
- **Color Tool:** https://colorhexa.com/#FF9E64
- **Tailwind Reference:** https://tailwindcss.com/docs

---

## ✅ Implementation Checklist

- [ ] Import `modern-theme.css` in main app file
- [ ] Import `modernTheme` in TypeScript files needing theme values
- [ ] Update button components to use new styles
- [ ] Update form inputs to use new styling
- [ ] Update card components with shadow and hover effects
- [ ] Test on mobile (768px breakpoint)
- [ ] Verify all interactive elements have proper focus states
- [ ] Check contrast ratios for accessibility

---

## 🎉 You're All Set!

Your app now has a beautiful, premium dark theme with professional styling. Enjoy the enhanced user experience!
