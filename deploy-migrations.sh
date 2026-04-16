#!/bin/bash

# Feature Marketplace Migration Deployment Script
# This script deploys migrations to Supabase using SQL API

set -e

WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WORKDIR"

echo "═══════════════════════════════════════════════════════════"
echo "  Feature Marketplace Migration Deployment"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Load environment
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local not found"
  exit 1
fi

# Extract Supabase credentials
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env.local | cut -d= -f2-)
SERVICE_ROLE_KEY=$(grep "^SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d= -f2-)

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
  echo "❌ Error: Supabase credentials not found in .env.local"
  exit 1
fi

echo "📍 Supabase Project: ${SUPABASE_URL#*//}"
echo ""

# Function to execute SQL
execute_sql() {
  local sql_file=$1
  local description=$2

  echo "▶️  $description"
  echo "    Reading: $sql_file"

  # Read the SQL file
  local sql_content=$(cat "$sql_file")

  # Execute via Supabase API
  local response=$(curl -s -X POST \
    "${SUPABASE_URL}/rest/v1/rpc/pg_execute" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
    -d "{\"sql\": $(echo "$sql_content" | jq -Rs .)}" 2>&1 || echo "{\"error\": \"API call failed\"}")

  # Check if successful
  if echo "$response" | grep -q "error"; then
    echo "    ⚠️  Could not execute via API (expected - using direct method)"
    echo ""
    echo "    📋 To deploy manually:"
    echo "    1. Open: https://app.supabase.com"
    echo "    2. Select your project"
    echo "    3. Go to SQL Editor → New Query"
    echo "    4. Copy entire contents of: $sql_file"
    echo "    5. Click Run"
    echo ""
    return 1
  else
    echo "    ✅ Deployed successfully"
    return 0
  fi
}

echo "🚀 Starting Migration Deployment"
echo ""

# Try API method first
execute_sql "supabase/migrations/20250416_feature_marketplace.sql" "Deploying Feature Marketplace Schema" || {
  echo "ℹ️  API deployment not available. Using manual deployment instructions."
  echo ""
  echo "═══════════════════════════════════════════════════════════"
  echo "  MANUAL DEPLOYMENT REQUIRED"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  echo "Step 1: Deploy Main Schema"
  echo "────────────────────────────────────────"
  echo "1. Open https://app.supabase.com"
  echo "2. Select project: $(echo $SUPABASE_URL | sed 's/.*\///')"
  echo "3. Go to SQL Editor → New Query"
  echo "4. Copy file: supabase/migrations/20250416_feature_marketplace.sql"
  echo "5. Paste and click Run"
  echo "6. Wait for success message"
  echo ""
  echo "Step 2: Deploy Seed Data"
  echo "────────────────────────────────────────"
  echo "1. SQL Editor → New Query"
  echo "2. Copy file: supabase/migrations/20250416_seed_features.sql"
  echo "3. Paste and click Run"
  echo "4. Wait for success message"
  echo ""
  echo "Step 3: Verify Deployment"
  echo "────────────────────────────────────────"
  echo "Check Table Editor for:"
  echo "  • features (40+ rows)"
  echo "  • feature_categories (6 rows)"
  echo "  • feature_templates (5 rows)"
  echo "  • feature_requests (8+ rows)"
  echo ""
  exit 1
}

echo ""
echo "Step 2: Deploying Seed Data..."
execute_sql "supabase/migrations/20250416_seed_features.sql" "Deploying Feature Seed Data" || {
  exit 1
}

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Migrations Deployed Successfully!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Next Steps:"
echo "1. Verify tables in Supabase Table Editor"
echo "2. Run: npm run dev"
echo "3. Navigate to /features page"
echo "4. Test feature browsing and admin workflows"
echo ""
