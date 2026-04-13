#!/bin/bash

# Supabase Edge Functions Deployment Script
# Deploys send-campaign-email and bulk-outreach-email functions
# Usage: bash scripts/deploy-edge-functions.sh [API_KEY]

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Supabase Edge Functions Deployment Script            ║${NC}"
echo -e "${BLUE}║   Functions: send-campaign-email, bulk-outreach-email  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}✗ .env file not found${NC}"
    echo "Create .env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

echo -e "${GREEN}✓ .env file found${NC}"

# Load environment variables
source "$PROJECT_ROOT/.env"

# Verify SUPABASE_URL and SERVICE_ROLE_KEY
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}✗ SUPABASE_URL not set in .env${NC}"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}✗ SUPABASE_SERVICE_ROLE_KEY not set in .env${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Supabase credentials configured${NC}"
echo ""

# Get API key from argument or prompt user
if [ -z "$1" ]; then
    echo -e "${YELLOW}Enter your Resend API key (format: re_XXXXXXXXXX):${NC}"
    read -r RESEND_API_KEY
    if [ -z "$RESEND_API_KEY" ]; then
        echo -e "${YELLOW}⚠ No API key provided. Functions will run in dev mode (no emails sent).${NC}"
    fi
else
    RESEND_API_KEY="$1"
fi

# Set Resend API key if provided
if [ ! -z "$RESEND_API_KEY" ]; then
    echo ""
    echo -e "${BLUE}Setting RESEND_API_KEY in Supabase...${NC}"
    supabase secrets set RESEND_API_KEY="$RESEND_API_KEY" || {
        echo -e "${YELLOW}⚠ Could not set RESEND_API_KEY via CLI${NC}"
        echo "   Set manually in Supabase Dashboard → Settings → Edge Function secrets"
    }
fi

# Deploy functions
echo ""
echo -e "${BLUE}Deploying Edge Functions...${NC}"
echo ""

echo -e "${BLUE}→ Deploying send-campaign-email...${NC}"
if supabase functions deploy send-campaign-email; then
    echo -e "${GREEN}✓ send-campaign-email deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy send-campaign-email${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}→ Deploying bulk-outreach-email...${NC}"
if supabase functions deploy bulk-outreach-email; then
    echo -e "${GREEN}✓ bulk-outreach-email deployed successfully${NC}"
else
    echo -e "${RED}✗ Failed to deploy bulk-outreach-email${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}✓ All Edge Functions deployed successfully!${NC}"
echo -e "${BLUE}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║ Next Steps:${NC}"
echo -e "${BLUE}║${NC}"
echo -e "${BLUE}║ 1. Verify database schema exists:${NC}"
echo -e "${BLUE}║    - supabase/migrations/20260413224528_resend_schema.sql${NC}"
echo -e "${BLUE}║${NC}"
echo -e "${BLUE}║ 2. Test the functions:${NC}"
echo -e "${BLUE}║    - Use src/app/lib/resendService.ts in your frontend${NC}"
echo -e "${BLUE}║    - Or use the test curl commands in EDGE_FUNCTIONS_DEPLOYMENT_GUIDE.md${NC}"
echo -e "${BLUE}║${NC}"
echo -e "${BLUE}║ 3. Monitor function logs:${NC}"
echo -e "${BLUE}║    - supabase logs pull --function=send-campaign-email${NC}"
echo -e "${BLUE}║    - supabase logs pull --function=bulk-outreach-email${NC}"
echo -e "${BLUE}║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════╝${NC}"
