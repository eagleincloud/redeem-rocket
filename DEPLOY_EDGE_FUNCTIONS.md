# Deploy Edge Functions Guide

The `biz-onboarding-ai` Edge Functions need to be deployed to Supabase before the smart onboarding feature can work.

## Quick Deploy (Option 1 - Recommended)

### Prerequisites
- Supabase CLI installed (`supabase --version` to verify)
- Authentication token from Supabase dashboard

### Steps

1. **Get your Supabase access token:**
   - Go to https://app.supabase.com/
   - Click your profile icon (top right) → Settings
   - Copy your "Personal API Key" (or create a new one)

2. **Set the environment variable:**
   ```bash
   export SUPABASE_ACCESS_TOKEN="your_access_token_here"
   ```

3. **Deploy the functions:**
   ```bash
   cd /Users/adityatiwari/Downloads/App\ Creation\ Request-2/.claude/worktrees/jolly-herschel
   supabase functions deploy biz-onboarding-ai
   ```

4. **Verify deployment:**
   ```bash
   supabase functions list
   ```
   
   You should see `biz-onboarding-ai` in the list with status "Active"

## Manual Deploy (Option 2 - Using API)

If CLI authentication is not available, you can deploy directly via the Supabase API:

```bash
# Set up variables
SUPABASE_URL="https://eomqkeoozxnttqizstzk.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_from_.env.local"
FUNCTION_NAME="biz-onboarding-ai"

# Deploy (requires packaging the function as a zip file)
# This is more complex and requires additional setup
```

## Verify Functions Work

After deployment, test the functions:

```bash
curl -X POST https://eomqkeoozxnttqizstzk.supabase.co/functions/v1/biz-onboarding-ai \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/describe",
    "businessType": "coffee_shop",
    "businessName": "Morning Brew",
    "websiteText": ""
  }'
```

Expected response: A JSON object with 3 business descriptions

## Troubleshooting

### "Function not found" error
- The function hasn't been deployed yet
- Run the deploy command above

### "Unauthorized" error
- Your SUPABASE_ACCESS_TOKEN is invalid
- Get a new one from https://app.supabase.com/

### "Invalid function code" error
- Check that all 5 files exist in `supabase/functions/biz-onboarding-ai/`:
  - index.ts
  - llm.ts
  - extractors.ts
  - parsers.ts
  - product-builder.ts

## Files Included

The following Edge Function files are ready for deployment:

```
supabase/functions/biz-onboarding-ai/
├── index.ts              # Main request handler
├── llm.ts                # Claude Haiku 4.5 integration
├── extractors.ts         # Website content extraction
├── parsers.ts            # Natural language parsing
└── product-builder.ts    # AI product generation
```

## Environment Requirements

- `ANTHROPIC_API_KEY` must be set in Supabase project secrets
  - Go to https://app.supabase.com/project/eomqkeoozxnttqizstzk/settings/functions
  - Add secret: `ANTHROPIC_API_KEY` = your Anthropic API key

## Next Steps

After successful deployment:
1. Run database migrations (DEPLOY_MIGRATIONS.md)
2. Test onboarding flow in browser
3. Add conditional navigation
4. Add feature re-customization feature
