# ⚡ Quick Start: Testing New Registration Flow

## 🎯 What's New

Your business app now has a beautiful, modern 5-step registration flow integrated from the Figma design system. This replaces the basic onboarding with a comprehensive, category-aware registration experience.

## 🚀 Getting Started (30 seconds)

### 1. Start the Dev Server
```bash
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2
npm run dev:business
```

Server will be running on: **http://localhost:5174**

### 2. Access Registration Flow
Visit: **http://localhost:5174/register**

### 3. Complete the Flow
- **Step 1**: Welcome screen - Click "Start Building Your App"
- **Step 2**: Business Details - Fill business basics, category, goals
- **Step 3**: Feature Selection - Choose features or use bundles
- **Step 4**: Customize - Pick design preset and colors
- **Step 5**: Preview - Review and launch

## 📝 Sample Test Data

**Step 1 - Business Basics:**
```
Business Name: My Awesome Restaurant
Email: owner@restaurant.com
Phone: +91 9876543210
```

**Step 2 - Category & Profile:**
```
Category: Restaurant
Location: Mumbai, India
Team Size: 2–10 (Small team)
Business Stage: Growing
Target Audience: Regional
```

**Step 3 - Goals & Audience:**
```
Goals: 
  ✓ Get New Customers
  ✓ Increase Sales
  ✓ Run Marketing Campaigns
  ✓ Boost Customer Retention

Monthly Customers: 200–1,000
Social Media: Instagram, Facebook, WhatsApp
```

**Step 3 - Feature Selection:**
```
Option 1: Select "Growth" bundle (Recommended)
OR
Option 2: Toggle features individually:
  ✓ Lead Management CRM
  ✓ WhatsApp Marketing
  ✓ Coupons & Offers
  ✓ Loyalty Program
  ✓ Advanced Analytics
```

**Step 4 - Customization:**
```
Category: Restaurant
Choose Preset: "Rustic Kitchen" or "Fine Dining"
Primary Color: #8B4513 (or pick your own)
Theme: Light
```

## 🎨 Features to Explore

### Welcome Page
- 16 business category pills
- 4 feature highlights
- Beautiful gradient background

### Business Details
- 3-step form with progress indicator
- Smart validation
- Dynamic section display

### Feature Selection
- **3 Quick-Start Bundles**:
  - Starter: $499/month
  - Growth: $999/month (Most Popular)
  - Enterprise: Custom pricing

- **15+ Features** with:
  - Icons and descriptions
  - Pricing information
  - Benefits list (expandable)
  - Recommended for specific business types

### Customization
- **Design Presets** per category:
  - Each preset has unique colors, fonts, layouts
  - Live preview of your brand
  - Category-specific styles

### Preview
- Summary of selections
- Desktop & Mobile preview
- Final review before launch

## 🔄 Navigation

All pages are linked with navigation buttons:
- **Previous/Back** - Go to previous step
- **Next/Continue** - Go to next step
- **Submit/Launch** - Complete registration

## 💾 Data Persistence

- Form data is saved to **localStorage** automatically
- Refresh the page - data is preserved
- Close and reopen browser - data is still there
- Uses key: `redeem_rocket_data`

## 🐛 Testing Tips

### Test Different Categories
Try going through the flow with different categories:
- 🍽️ Restaurant
- 💆 Salon & Spa
- 💪 Fitness & Gym
- 🏥 Healthcare
- 🛍️ Retail
- 🏠 Real Estate
- 📚 Education
- 💻 Technology

Each category has different design presets!

### Test Feature Combinations
- Use Starter bundle
- Use Growth bundle
- Use Enterprise bundle
- Mix & match individual features

### Test Customization
- Change primary color
- Switch between light/dark themes
- Try different presets per category

## 📱 Test on Mobile

Open DevTools and use device emulation:
```
Chrome → DevTools → Ctrl+Shift+M → Select device
```

The registration flow is fully responsive!

## ✅ Checklist

- [ ] Welcome page loads correctly
- [ ] All 16 categories display
- [ ] Step 1 form validation works
- [ ] Step 2 form validation works
- [ ] Step 3 form validation works
- [ ] Feature bundles are selectable
- [ ] Individual features toggle correctly
- [ ] Feature count updates
- [ ] Design presets load correctly
- [ ] Color picker works
- [ ] Preview updates with selections
- [ ] Data persists on page refresh
- [ ] Navigation buttons work
- [ ] Responsive on mobile
- [ ] No console errors

## 🔗 Useful Links

- **Welcome**: http://localhost:5174/register
- **Business Details**: http://localhost:5174/register/details
- **Features**: http://localhost:5174/register/features
- **Customize**: http://localhost:5174/register/customize
- **Preview**: http://localhost:5174/register/preview

## 📚 Documentation

For complete documentation, see: `NEW_REGISTRATION_FLOW.md`

## 🆘 Troubleshooting

**Port already in use?**
```bash
# Kill the existing process
lsof -ti:5174 | xargs kill -9

# Restart the server
npm run dev:business
```

**Page doesn't load?**
- Check console for errors (F12)
- Verify server is running
- Try clearing browser cache
- Check localhost:5174 in address bar

**Form data not saving?**
- Check browser's localStorage
- DevTools → Application → LocalStorage
- Look for key: `redeem_rocket_data`

**Components not showing?**
- Check that all imports are correct
- Verify UI components are in `src/app/components/ui/`
- Check browser console for errors

## 🎉 Next Steps

After testing:

1. **Share feedback** on flow and design
2. **Test on different devices** (desktop, tablet, mobile)
3. **Integrate with authentication** (optional)
4. **Connect to Supabase** to save data (optional)
5. **Add email notifications** (optional)
6. **Enable payment collection** (optional)

---

**Status**: Ready for testing ✅
**Last Updated**: 2026-05-01
**Questions?** Check NEW_REGISTRATION_FLOW.md for complete documentation
