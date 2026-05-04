#!/bin/bash

# Update GitHub secrets for CI/CD deployment
# NOTE: Never store actual secrets in this file!
# Always use GitHub UI to add secrets

echo "⚠️  GitHub Secrets Setup Required"
echo ""
echo "Instructions:"
echo "1. Go to: https://github.com/eagleincloud/redeem-rocket/settings/secrets/actions"
echo ""
echo "2. Click 'New repository secret' for each:"
echo ""
echo "   Secret Name: VERCEL_TOKEN"
echo "   Value: [Get from Vercel dashboard - https://vercel.com/account/tokens]"
echo ""
echo "   Secret Name: VERCEL_ORG_ID"
echo "   Value: team_mNwvarZv4qGfDMqPQ1k2rAzz"
echo ""
echo "   Secret Name: VERCEL_PROJECT_ID"
echo "   Value: prj_aB3XHWw5FKMHfp0jVz5zeFmeTqoL"
echo ""
echo "   Secret Name: VITE_SUPABASE_URL"
echo "   Value: https://wqrmhicdjwzfhcziqwyw.supabase.co"
echo ""
echo "   Secret Name: VITE_SUPABASE_ANON_KEY"
echo "   Value: [Get from Supabase dashboard]"
echo ""
echo "✅ Once configured, future pushes to main will auto-deploy via GitHub Actions"
