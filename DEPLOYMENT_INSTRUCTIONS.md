# 🚀 Deployment Instructions

## Prerequisites

Ensure you have:
- `supabase-cli` installed: `npm install -g supabase`
- A Supabase project created at https://supabase.com
- Access token from Supabase dashboard

## Step 1: Authenticate with Supabase

### Option A: Interactive Login (Recommended)

```bash
supabase login
```

This will:
1. Open browser to Supabase login page
2. Generate an access token
3. Save token locally in `~/.supabase/config.json`

### Option B: Set Environment Variable

```bash
export SUPABASE_ACCESS_TOKEN=<your-access-token>
```

To get your access token:
1. Go to https://supabase.com/dashboard
2. Click your avatar → Preferences
3. Click "Access Tokens" in sidebar
4. Create new token (or copy existing)
5. Set environment variable with token value

## Step 2: Link Your Project

```bash
# Navigate to project directory
cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Find your-project-ref at https://supabase.com/dashboard
# It looks like: abcdefghijklmnop
```

## Step 3: Run Database Migrations

```bash
# Create tables in your database
supabase db push

# You should see output like:
# Applying migration 20250501_registration_tables.sql...
# ✓ Migration applied successfully
```

Verify tables were created:

```bash
# Check in Supabase dashboard:
# 1. Go to SQL Editor
# 2. Run: SELECT * FROM businesses;
# 3. Run: SELECT * FROM design_presets;
```

## Step 4: Deploy Edge Function

```bash
# Deploy the registration-api function
supabase functions deploy registration-api

# Expected output:
# ✓ Function deployed successfully
# Deployed function: registration-api
# Function URL: https://your-project.supabase.co/functions/v1/registration-api
```

## Step 5: Verify Deployment

```bash
# List all deployed functions
supabase functions list

# Check function details
supabase functions list registration-api --full

# View function logs
supabase functions logs registration-api
```

## Step 6: Update Frontend Environment Variables

Update your `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from https://supabase.com/dashboard → Settings → API

## Step 7: Test the API

### Quick Test with curl

```bash
# Test email validation endpoint
curl -X POST https://your-project.supabase.co/functions/v1/registration-api/register/validate-email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Expected response:
# {"available":true,"email":"test@example.com"}
```

### Full Registration Test

```bash
curl -X POST https://your-project.supabase.co/functions/v1/registration-api/register/submit \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Restaurant",
    "email": "owner@test.com",
    "phone": "+91-9876543210",
    "category": "restaurant",
    "location": "Mumbai",
    "teamSize": "2-10",
    "businessStage": "growing",
    "targetAudience": "regional",
    "goals": ["get-new-customers", "increase-sales"],
    "challenges": ["managing-customer-data"],
    "monthlyCustomers": "200-1000",
    "socialMedia": ["instagram", "whatsapp"],
    "selectedFeatures": ["lead-management", "whatsapp-marketing"],
    "appName": "Test Restaurant",
    "stylePresetId": "restaurant-rustic",
    "primaryColor": "#8B4513",
    "accentColor": "#FFB347",
    "bgColor": "#FDF5E6",
    "theme": "light",
    "fontStyle": "classic",
    "layoutStyle": "card",
    "buttonStyle": "rounded"
  }'
```

## Step 8: Test in Browser

1. Start the dev server:
   ```bash
   npm run dev:business
   ```

2. Open http://localhost:5174/register

3. Complete all 5 steps of registration

4. Click "Go Live!" button

5. You should see:
   - Loading spinner appears
   - Data is submitted to API
   - Redirect to dashboard
   - localStorage data is cleared

6. Verify in Supabase dashboard:
   - Go to SQL Editor
   - Query: `SELECT * FROM business_registrations ORDER BY created_at DESC LIMIT 1;`
   - You should see your registration data

## Troubleshooting

### Error: "Access token not provided"

**Solution**: Run `supabase login` to authenticate

```bash
supabase login
```

### Error: "Project not linked"

**Solution**: Link your project:

```bash
supabase link --project-ref your-project-ref
```

### Error: "Function deployment failed"

**Solution**: 
1. Check TypeScript errors: `npx tsc --noEmit`
2. Check function logs: `supabase functions logs registration-api`
3. Verify function file exists: `ls -la supabase/functions/registration-api/index.ts`

### Error: "Database tables don't exist"

**Solution**: Run migrations:

```bash
supabase db push --dry-run  # See what will be applied
supabase db push            # Actually apply migrations
```

### Error: "CORS error in browser"

**Solution**: The cors headers are already configured in the function. If you still get CORS errors:
1. Check browser console for actual error
2. Verify Origin header in request
3. Check Supabase function logs

## Verifying Everything Works

### Checklist

- [ ] Authenticated with Supabase (`supabase login`)
- [ ] Project linked (`supabase link`)
- [ ] Migrations ran successfully (`supabase db push`)
- [ ] Function deployed (`supabase functions deploy`)
- [ ] Tables exist in database (check SQL Editor)
- [ ] API endpoint responds to curl request
- [ ] Frontend environment variables updated
- [ ] Can complete registration flow in browser
- [ ] Data appears in database after submission
- [ ] No errors in browser console
- [ ] No errors in function logs

## Next Steps

After successful deployment:

1. **Test all registration steps** - See DEPLOYMENT_AND_TESTING.md
2. **Add email verification** - Implement email sending
3. **Set up monitoring** - Configure Supabase alerts
4. **Monitor performance** - Check function logs and metrics
5. **Scale if needed** - Monitor and optimize as traffic grows

## Support

If you encounter issues:

1. Check function logs:
   ```bash
   supabase functions logs registration-api --tail
   ```

2. Check database:
   ```bash
   supabase db shell
   SELECT * FROM business_registrations;
   ```

3. Check Supabase dashboard:
   - Functions page for deployment status
   - Logs page for errors
   - SQL Editor for data

4. Review error messages carefully - they usually point to the exact issue

---

**Status**: Ready for deployment ✅
**Last Updated**: 2026-05-01
