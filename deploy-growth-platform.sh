#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║    GROWTH PLATFORM DEPLOYMENT AUTOMATION SCRIPT                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Supabase CLI
echo "🔍 Checking Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✓ Supabase CLI found${NC}"

# Check authentication
echo ""
echo "🔐 Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠ Not authenticated with Supabase${NC}"
    echo ""
    echo "To authenticate, run:"
    echo "  supabase login"
    echo ""
    echo "Then re-run this script."
    exit 1
fi
echo -e "${GREEN}✓ Authenticated with Supabase${NC}"

# Get project ref from .env.local
if [ -f .env.local ]; then
    SUPABASE_URL=$(grep SUPABASE_URL .env.local | cut -d= -f2)
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||;s|\.supabase\.co||')
    echo -e "${GREEN}✓ Project ref: $PROJECT_REF${NC}"
else
    echo -e "${RED}✗ .env.local not found${NC}"
    exit 1
fi

echo ""
echo "📦 Deploying growth platform edge functions..."
echo ""

# Array of functions to deploy
FUNCTIONS=(
    "process-email-sequences"
    "lead-ingest"
    "verify-email-provider"
    "execute-automation-rules"
    "publish-social-post"
    "ingest-advanced-leads"
)

DEPLOYED=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    echo -n "Deploying $func... "
    if supabase functions deploy "$func" --project-id "$PROJECT_REF" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        ((DEPLOYED++))
    else
        echo -e "${RED}✗${NC}"
        ((FAILED++))
    fi
done

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║    DEPLOYMENT SUMMARY                                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Deployed: ${GREEN}$DEPLOYED${NC}"
echo -e "Failed: ${FAILED}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All edge functions deployed successfully!${NC}"
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables in Supabase dashboard"
    echo "2. Configure cron jobs for automation"
    echo "3. Run E2E tests to verify deployment"
    echo ""
    echo "See DEPLOYMENT_GUIDE.md for detailed instructions."
else
    echo -e "${RED}✗ Some functions failed to deploy${NC}"
    echo "Run with --debug for more information:"
    echo "  supabase functions deploy <function-name> --debug"
fi

