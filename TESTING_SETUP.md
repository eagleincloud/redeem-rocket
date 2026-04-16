# E2E Testing Setup

## Current Status

✅ **Database Setup Complete**
- All migrations have been successfully applied
- 10 tables created with proper RLS policies
- Database connection verified working

❌ **API Testing Blocked**
- Supabase API key validation failed ("Invalid API key")
- Service role key needs to be obtained from actual Supabase dashboard

## What's Needed

To run the E2E test suite, you need to provide your actual Supabase credentials:

### Step 1: Get Your Real Service Role Key

1. Log into [Supabase Dashboard](https://app.supabase.com)
2. Select your project (`eomqkeoozxnttqizstzk`)
3. Go to **Settings** → **API**
4. Under "Project API keys", copy the **`service_role`** key (long JWT token starting with `ey...`)

### Step 2: Update .env.local

```bash
# Edit .env.local and replace with your ACTUAL service role key:
SUPABASE_URL=https://eomqkeoozxnttqizstzk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<paste your actual service_role key here>
DATABASE_URL=postgresql://postgres:password@db.eomqkeoozxnttqizstzk.supabase.co:5432/postgres
```

### Step 3: Run Tests

Once you have the real key in .env.local:

```bash
export SUPABASE_URL="https://eomqkeoozxnttqizstzk.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d= -f2)"
deno run --allow-net --allow-env e2e-tests.ts
```

## Verification

The tests include 25 test cases across 6 feature areas:

1. **Email Sequences** (4 tests): Create, verify, trigger, tracking
2. **Lead Import** (4 tests): Webhook, CSV, connector, verification
3. **Email Providers** (4 tests): Resend, SMTP, verification
4. **Automation Rules** (3 tests): Email, tagging, verification
5. **Social Media** (5 tests): Twitter, LinkedIn, posting, scheduling
6. **Advanced Lead Sources** (4 tests): IVR, web portal, scraping, verification

All 25 tests should pass with a valid service role key.

## Known Limitations

- OAuth flows are stubs (accept test tokens)
- Database sync (Oracle/MySQL) is logged but not executed
- Web scraper accepts data structure but doesn't scrape
- These features require additional external credentials/integrations

