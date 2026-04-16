# Credentials Setup Guide

## ⚠️ Security Notice

Hardcoded credentials were previously embedded in this repository. **You must:**

1. **Rotate all exposed credentials immediately** in Supabase dashboard
2. **Remove the credentials from git history** (they may be visible in commits)
3. **Set up proper environment variables** using the instructions below

## Setup Instructions

### Step 1: Create `.env.local` File

Copy `.env.example` to `.env.local` and fill in your actual credentials:

```bash
cp .env.example .env.local
```

### Step 2: Update `.env.local` with Real Credentials

Edit `.env.local` and add your Supabase credentials:

```bash
# Get these from Supabase dashboard
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-dashboard
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-dashboard

# Get this from Supabase dashboard under Project Settings → Database
DATABASE_URL=postgresql://postgres:your-password@db.your-project-ref.supabase.co:5432/postgres
```

### Step 3: Where to Find Credentials in Supabase

1. **SUPABASE_URL**: Go to Settings → API → Project URL
2. **SUPABASE_ANON_KEY**: Go to Settings → API → Project API keys → `anon` key
3. **SUPABASE_SERVICE_ROLE_KEY**: Go to Settings → API → Project API keys → `service_role` key
4. **DATABASE_URL**: Go to Settings → Database → Connection string → PostgreSQL (URI)

### Step 4: Running Tests and Migrations

```bash
# For E2E tests (requires Deno)
deno run --allow-net --allow-env e2e-tests.ts

# For migrations (requires Node.js)
node run-all-migrations.js
```

### Step 5: Verify `.env.local` is Ignored

Check that git ignores your `.env.local`:

```bash
git status
# Should NOT show .env.local or any .env files
```

## After Exposing Credentials

Since credentials were previously hardcoded:

1. **Revoke old credentials in Supabase dashboard**
   - Settings → Authentication → Policies
   - Settings → Database → Credentials
   
2. **Generate new API keys**
   - Settings → API → Regenerate keys

3. **Audit database access logs**
   - Check if the exposed credentials were used

4. **Monitor for suspicious activity**
   - Unusual API calls
   - Unauthorized database changes

## Additional Security Notes

- ✅ `.env.local` is in `.gitignore` and will not be committed
- ✅ `.env.example` shows the required format without sensitive values
- ✅ All files now read credentials from environment variables
- ✅ Use different credentials for dev, staging, and production environments

Never commit credential files or hardcode secrets in your codebase.
