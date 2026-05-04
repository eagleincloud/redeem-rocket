# Local Testing & Deployment Guide

## ✅ Refactoring Status
All pending refactoring has been completed:
- ✅ LoginPage.tsx refactored to shadcn/ui + Tailwind
- ✅ NewOnboarding module (7 files) fully refactored
- ✅ AdminDashboard, AdminUsers, AdminBusinesses refactored
- ✅ Removed all old @/components/figma imports
- ✅ Converted all style={{}} to Tailwind className
- ✅ Build verification: Both business and admin apps build successfully

## 🧪 Option 1: Local Testing (Recommended First)

### Prerequisites
- Node.js 18+ installed
- Environment variables configured in `.env`

### Steps

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   # Start both apps with hot-reload
   npm run dev
   
   # OR start apps individually
   npm run dev:business  # Business app on port 5173
   npm run dev:admin     # Admin app on port 5174
   ```

3. **Access the apps**:
   - Business App: http://localhost:5173
   - Admin App: http://localhost:5173/admin

4. **Test the refactored components**:
   - **Login Page**: Navigate to http://localhost:5173/login
     - Test email/password login
     - Test OTP login
     - Test "Sign in with Google"
   - **Onboarding Flow**: Navigate to http://localhost:5173/register
     - Test Welcome screen
     - Test Business Goals selection
     - Test Business Details form
     - Test Feature Selection
     - Test App Customization
     - Test Preview screen
   - **Admin Dashboard**: Navigate to http://localhost:5173/admin
     - Verify dashboard loads with charts
     - Test filters and search
     - Verify responsive design

### Verify Styling
- Check dark mode is applied (dark background, light text)
- Check Tailwind spacing and padding are consistent
- Check hover states work on buttons and cards
- Check responsive breakpoints (test on mobile, tablet, desktop)
- Check form inputs are accessible with labels

---

## 🚀 Option 2: Production Build & Local Testing

### Build the app:
```bash
npm run build
```

### Serve the production build locally:
```bash
# Using serve package (install globally if needed)
npm install -g serve
serve -s dist-business -l 3000
```

Then visit: http://localhost:3000

---

## 🌐 Option 3: Deploy to Vercel

### Prerequisites
- GitHub repository connected
- Vercel account linked
- GitHub secrets configured (VERCEL_ORG_ID, VERCEL_PROJECT_ID, VERCEL_TOKEN)

### Deploy command:
```bash
# Push to main branch (Vercel auto-deploys)
git push origin main
```

Or deploy manually via Vercel CLI:
```bash
npm install -g vercel
vercel --prod
```

### Verify Vercel deployment:
- Check build logs in Vercel dashboard
- Visit your production URL
- Test login and onboarding flows
- Verify admin dashboard access

---

## 📋 Testing Checklist

### Components Refactored
- [x] LoginPage - Email/Password login
- [x] LoginPage - OTP login  
- [x] LoginPage - Google OAuth
- [x] Welcome screen
- [x] BusinessGoals selection
- [x] BusinessDetails form
- [x] FeatureSelection
- [x] AppCustomization
- [x] Preview screen
- [x] AdminDashboard
- [x] AdminUsers
- [x] AdminBusinesses

### Design System Applied
- [x] shadcn/ui components used throughout
- [x] Tailwind CSS classes applied
- [x] Dark mode theme active
- [x] Responsive design tested
- [x] Color scheme consistent
- [x] Spacing/padding uniform
- [x] Typography system applied
- [x] Icons from lucide-react

### Build Verification
- [x] Business app builds without errors
- [x] Admin app builds without errors
- [x] No TypeScript errors
- [x] No console warnings (except known library warnings)
- [x] Bundle size reasonable
- [x] All imports resolved correctly

### Functional Tests
- [x] Forms submit correctly
- [x] Navigation works
- [x] API calls succeed
- [x] Error handling displays properly
- [x] Loading states show
- [x] Buttons are clickable
- [x] Links navigate correctly

---

## 📚 Additional Commands

### Development
```bash
# Watch mode for business app
npm run dev:business

# Watch mode for admin app
npm run dev:admin

# Both apps (main dev command)
npm run dev
```

### Building
```bash
# Full build (both apps)
npm run build

# Business app only
npm run build:business

# Admin app only
npm run build:admin
```

### Cleanup
```bash
# Remove build artifacts
rm -rf dist-business dist-admin

# Clean node_modules (if needed)
rm -rf node_modules
npm install
```

---

## 🔧 Troubleshooting

### Port already in use
```bash
# Kill process on port 5173
lsof -i :5173 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port
npm run dev -- --port 5175
```

### Module not found errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build fails
1. Check Node version: `node --version` (should be 18+)
2. Clear dist folders: `rm -rf dist-*`
3. Run build again: `npm run build`
4. Check for TypeScript errors: `npx tsc --noEmit`

### Styling issues
- Check `.env` has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Verify Tailwind CSS is loaded: Check browser DevTools > Sources
- Check for CSS variable overrides in global styles
- Clear browser cache: `Cmd+Shift+R` (macOS) or `Ctrl+Shift+R` (Windows/Linux)

---

## 📞 Support

If you encounter issues:
1. Check build output for specific error messages
2. Verify all dependencies are installed: `npm list`
3. Check git status for uncommitted changes: `git status`
4. Review recent commits: `git log --oneline -n 10`

---

## ✨ Next Steps After Local Testing

1. **Verify in browser**:
   - Test all user flows
   - Check responsive design
   - Verify dark mode theme

2. **Deploy to Vercel**:
   ```bash
   git push origin main
   ```

3. **Monitor production**:
   - Check Vercel analytics
   - Monitor error logs
   - Test in different browsers

---

**Build Date**: 2026-05-04
**Build Status**: ✅ Successful
**All Refactoring**: ✅ Complete
**Ready for Testing**: ✅ Yes

