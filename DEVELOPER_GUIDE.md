# 👨‍💻 GeoDeals Developer Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- Git for version control
- Google Maps API key
- Text editor (VS Code recommended)

### First-Time Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Configure Google Maps**
   - Open `/src/app/components/MapView.tsx`
   - Line 10: Replace API key with your own
   - Get key from: https://console.cloud.google.com/

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   - Navigate to `http://localhost:5173`
   - You should see the login page

## 📂 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── components/        # All React components
│   │   │   ├── ui/           # Reusable UI components (40+)
│   │   │   └── *.tsx         # Page components
│   │   ├── utils/            # Utility functions
│   │   ├── App.tsx           # Main app component
│   │   ├── mockData.ts       # Demo data
│   │   ├── routes.tsx        # Route definitions
│   │   └── types.ts          # TypeScript types
│   ├── styles/
│   │   ├── theme.css         # Tailwind theme
│   │   └── fonts.css         # Font imports
│   └── imports/              # Figma imports (if any)
├── public/                   # Static assets
├── package.json              # Dependencies
└── Documentation files
```

## 🔧 Development Workflow

### Adding a New Page

1. **Create Component**
   ```tsx
   // /src/app/components/NewPage.tsx
   import { motion } from 'motion/react';
   
   export function NewPage() {
     return (
       <div className="h-full overflow-y-auto bg-gray-50 pb-24">
         <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
           <h1 className="text-3xl font-bold">New Page</h1>
         </div>
         {/* Content */}
       </div>
     );
   }
   ```

2. **Add Route**
   ```tsx
   // /src/app/routes.tsx
   import { NewPage } from './components/NewPage';
   
   // Add to children array:
   { path: "new-page", Component: NewPage }
   ```

3. **Add to FAB Menu** (optional)
   ```tsx
   // /src/app/components/CircularFABMenu.tsx
   { icon: IconName, label: 'New Page', path: '/new-page', color: 'bg-color-500' }
   ```

### Creating Reusable Components

```tsx
// /src/app/components/MyComponent.tsx
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-2xl p-4 shadow-lg"
    >
      <h3>{title}</h3>
      {onAction && (
        <button onClick={onAction}>Action</button>
      )}
    </motion.div>
  );
}
```

### Using TypeScript Types

```tsx
// Import existing types
import { Business, Offer, User } from '../types';

// Add new types to /src/app/types.ts
export interface NewType {
  id: string;
  name: string;
  // ...
}
```

## 🎨 Styling Guidelines

### Using Tailwind Classes

```tsx
// Good - Responsive, semantic classes
<div className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all">

// Avoid - Inline styles
<div style={{ display: 'flex', padding: '24px' }}>
```

### Common Patterns

**Card Component:**
```tsx
className="bg-white rounded-2xl p-6 shadow-lg"
```

**Gradient Button:**
```tsx
className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg"
```

**Glassmorphic Panel:**
```tsx
className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg"
```

### Animation Patterns

**Basic Fade In:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

**Stagger Children:**
```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
))}
```

**Hover & Tap:**
```tsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

## 🗄️ State Management

### Component State

```tsx
import { useState } from 'react';

function MyComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  
  // Use state
  return <div>{count}</div>;
}
```

### LocalStorage (Current Auth)

```tsx
// Save user
localStorage.setItem('user', JSON.stringify(userData));

// Get user
const user = JSON.parse(localStorage.getItem('user') || 'null');

// Remove user (logout)
localStorage.removeItem('user');
```

### Future: Add Redux/Zustand

For production, consider:
```bash
npm install zustand
# or
npm install @reduxjs/toolkit react-redux
```

## 🌐 API Integration

### Replace Mock Data

**Current (Mock):**
```tsx
import { mockBusinesses } from '../mockData';

function Page() {
  const [businesses] = useState(mockBusinesses);
}
```

**Future (Real API):**
```tsx
import { useState, useEffect } from 'react';

function Page() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/businesses');
        const data = await response.json();
        setBusinesses(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  if (loading) return <LoadingSpinner />;
  
  return <div>{/* Render businesses */}</div>;
}
```

### Environment Variables

Create `.env` file:
```env
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_API_BASE_URL=https://api.yourapp.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Use in code:
```tsx
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
```

## 🔐 Authentication Setup

### Connect to Supabase

1. **Install Supabase Client**
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Create Supabase Client**
   ```tsx
   // /src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';
   
   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
   
   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```

3. **Update Login Page**
   ```tsx
   import { supabase } from '../lib/supabase';
   
   const handleLogin = async (email: string, password: string) => {
     const { data, error } = await supabase.auth.signInWithPassword({
       email,
       password,
     });
     
     if (error) {
       console.error('Login error:', error);
     } else {
       // Navigate to app
     }
   };
   ```

## 📊 Database Integration

### Supabase Tables

Create tables in Supabase:

```sql
-- Users table
create table users (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text,
  role text default 'customer',
  created_at timestamp default now()
);

-- Businesses table
create table businesses (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  location point,
  rating numeric,
  created_at timestamp default now()
);

-- Offers table
create table offers (
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references businesses(id),
  title text,
  discount numeric,
  expires_at timestamp,
  created_at timestamp default now()
);
```

### Fetch Data

```tsx
// Get all businesses
const { data: businesses } = await supabase
  .from('businesses')
  .select('*')
  .eq('category', 'Food & Beverage');

// Insert offer
const { data, error } = await supabase
  .from('offers')
  .insert({
    business_id: businessId,
    title: 'Summer Sale',
    discount: 20,
  });

// Update business
await supabase
  .from('businesses')
  .update({ rating: 4.5 })
  .eq('id', businessId);
```

## 🧪 Testing

### Add Testing (Recommended)

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Example Test:**
```tsx
// MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders title', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates optimized files in `/dist`

### Deploy Options

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Custom Server:**
```bash
# Build files
npm run build

# Copy /dist to your server
scp -r dist/* user@server:/var/www/html
```

## 🐛 Debugging

### Common Issues

**1. Map Not Loading**
- Check Google Maps API key
- Verify API is enabled in Google Cloud Console
- Check browser console for errors

**2. Component Not Rendering**
- Check imports are correct
- Verify component is exported
- Check for TypeScript errors

**3. Animations Not Working**
- Ensure Motion is installed
- Check for conflicting CSS
- Verify proper Motion syntax

### Browser DevTools

**React DevTools:**
- Install React DevTools extension
- View component hierarchy
- Inspect props and state

**Console Logging:**
```tsx
// Debug state
useEffect(() => {
  console.log('Current state:', data);
}, [data]);

// Debug API calls
fetch('/api/data')
  .then(res => {
    console.log('Response:', res);
    return res.json();
  })
  .then(data => console.log('Data:', data))
  .catch(err => console.error('Error:', err));
```

## 📱 Mobile Development

### Test on Mobile

1. **Find Local IP:**
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. **Access from Mobile:**
   ```
   http://192.168.x.x:5173
   ```

3. **Mobile Debugging:**
   - Chrome DevTools → Remote Devices
   - Safari → Develop → Device Name

### PWA Setup (Progressive Web App)

Add to `vite.config.ts`:
```ts
import { VitePWA } from 'vite-plugin-pwa';

export default {
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'GeoDeals',
        short_name: 'GeoDeals',
        theme_color: '#3B82F6',
        // ...
      }
    })
  ]
}
```

## 🔒 Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` for reference
   - Add `.env` to `.gitignore`

2. **API Keys**
   - Restrict Google Maps API key by domain
   - Use backend for sensitive operations
   - Never expose private keys in frontend

3. **Authentication**
   - Use HTTPS in production
   - Implement proper session management
   - Validate user input
   - Sanitize data before display

## 📈 Performance Optimization

### Code Splitting

```tsx
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Image Optimization

```tsx
// Use WebP format
<img src="image.webp" alt="..." loading="lazy" />

// Or use ImageWithFallback component
import { ImageWithFallback } from './components/figma/ImageWithFallback';
```

### Bundle Analysis

```bash
npm install -D rollup-plugin-visualizer
```

## 📚 Useful Resources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Motion (Framer Motion)](https://www.framer.com/motion/)
- [React Router](https://reactrouter.com/)
- [Google Maps API](https://developers.google.com/maps)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Tailwind IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)
- [ES7+ React Snippets](https://marketplace.visualstudio.com/items?itemName=dsznajder.es7-react-js-snippets)

## 🎯 Next Steps

### Immediate Tasks
1. ✅ Replace Google Maps API key
2. ⬜ Set up backend (Supabase recommended)
3. ⬜ Replace mock data with real API calls
4. ⬜ Implement real authentication
5. ⬜ Add error handling and loading states

### Feature Enhancements
1. ⬜ Real-time updates (WebSockets)
2. ⬜ Push notifications
3. ⬜ Payment integration
4. ⬜ In-app messaging
5. ⬜ Advanced search & filters
6. ⬜ Review and rating system
7. ⬜ Admin dashboard

### Production Readiness
1. ⬜ Error boundaries
2. ⬜ Loading states
3. ⬜ Form validation
4. ⬜ Security audit
5. ⬜ Performance testing
6. ⬜ Accessibility audit
7. ⬜ SEO optimization
8. ⬜ Analytics setup

## 💡 Tips & Tricks

1. **Use TypeScript**
   - Define types for all data structures
   - Use interfaces for component props
   - Enable strict mode

2. **Keep Components Small**
   - Single responsibility principle
   - Extract reusable logic to hooks
   - Break down large components

3. **Optimize Re-renders**
   - Use React.memo for expensive components
   - Implement useMemo and useCallback
   - Avoid inline object/function definitions

4. **Consistent Naming**
   - Components: PascalCase
   - Functions: camelCase
   - Constants: UPPER_SNAKE_CASE
   - Files: match component names

5. **Git Best Practices**
   - Commit often with clear messages
   - Use feature branches
   - Review before merging
   - Keep main branch stable

## 🤝 Contributing

If working with a team:

1. **Branch Naming**
   ```
   feature/add-payment
   fix/map-loading-issue
   refactor/auth-system
   ```

2. **Commit Messages**
   ```
   feat: add payment integration
   fix: resolve map loading issue
   refactor: improve auth system
   docs: update developer guide
   ```

3. **Pull Request Template**
   - Description of changes
   - Screenshots (if UI changes)
   - Testing done
   - Breaking changes (if any)

## 🎉 Happy Coding!

You now have everything you need to develop, extend, and deploy GeoDeals. Build something amazing! 🚀

---

**Questions?** Check the documentation files or review the code comments.

**Last Updated:** March 4, 2026
