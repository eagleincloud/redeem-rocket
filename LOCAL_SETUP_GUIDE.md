# 🚀 Local Development Setup Guide

## Issue: "Supabase not configured"

The app needs Supabase credentials to run locally. Here's how to fix it:

---

## Step 1: Get Your Supabase Credentials

### Option A: Use Existing Supabase Project (Recommended)

1. Go to: https://supabase.com/dashboard
2. Click on your project
3. Go to **Settings → API**
4. Copy the following:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **Anon Public Key** (long string starting with `eyJ...`)

### Option B: Create New Supabase Project

1. Go to: https://supabase.com
2. Click "Start your project"
3. Create a new project
4. Wait for setup (takes 1-2 minutes)
5. Get credentials from Settings → API

---

## Step 2: Update .env.local

Edit `.env.local` and add your Supabase credentials:

```bash
# Existing content
VERCEL_OIDC_TOKEN=...

# ADD THESE LINES:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```bash
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Restart Dev Server

```bash
# Kill current server
pkill -f "vite"

# Restart with new env variables
npm run dev:business
```

---

## Step 4: Reload Browser

Hard refresh to clear cache:
- **Mac**: Cmd + Shift + R
- **Windows/Linux**: Ctrl + Shift + R

---

## ✅ Verification

If working correctly, you should see:
- ✅ Landing page loads without "Supabase not configured" error
- ✅ Login and Get Started buttons are clickable
- ✅ No console errors in browser developer tools

---

## 🔍 Troubleshooting

### Still getting "Supabase not configured"?

1. **Check .env.local was saved:**
   ```bash
   cat .env.local | grep VITE_SUPABASE
   ```
   Should show your credentials

2. **Verify credentials are correct:**
   - URL should start with `https://`
   - Key should be a long JWT-like string
   - No extra spaces or quotes

3. **Hard restart dev server:**
   ```bash
   # Kill all node processes
   pkill -9 node
   
   # Clear node cache
   rm -rf node_modules/.vite
   
   # Restart
   npm run dev:business
   ```

4. **Check browser console:**
   - Open DevTools (F12)
   - Look for specific error messages
   - Share error details if still stuck

---

## 📱 Environment Variables Reference

### For Local Development (.env.local):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-key...
```

### For Production (GitHub Secrets):
These are set as GitHub repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

See `GITHUB_ACTIONS_SETUP.md` for production setup.

---

## 🎯 Next Steps After Setup

1. ✅ Local dev server running with Supabase
2. ✅ Landing page displays correctly
3. ✅ Click "Get Started" to test onboarding
4. ✅ Create a test business account
5. ✅ Explore the dashboard features

---

## 💡 Tips

- Keep `.env.local` in `.gitignore` (don't commit credentials)
- Each developer can have their own `.env.local`
- Use different Supabase projects for dev/staging/prod
- Never share API keys or secrets in code

---

## ❓ Common Issues

| Issue | Solution |
|-------|----------|
| "SyntaxError: Cannot use import statement" | Restart dev server, clear node_modules/.vite |
| Page loads blank | Hard refresh browser (Cmd+Shift+R) |
| Env vars not updating | Kill all node processes and restart |
| "Module not found" errors | Run `npm install` again |

---

## 📞 Need Help?

If you're still stuck:
1. Check that `.env.local` has both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
2. Verify credentials are correct in Supabase dashboard
3. Make sure dev server restarted after updating .env.local
4. Check browser console for specific error messages

Good luck! 🚀
