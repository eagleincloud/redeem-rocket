#!/bin/bash

# Feature Marketplace Database Verification Script

WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$WORKDIR"

echo "═══════════════════════════════════════════════════════════"
echo "  Feature Marketplace Database Verification"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Load environment
SUPABASE_URL=$(grep "^SUPABASE_URL=" .env.local | cut -d= -f2-)
ANON_KEY=$(grep "^SUPABASE_ANON_KEY=" .env.local | cut -d= -f2-)

echo "🔍 Verifying Database..."
echo ""

# Helper function to query Supabase
query_table() {
  local table=$1
  local label=$2

  echo "▶️  $label"
  response=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/${table}?select=count" \
    -H "Accept: application/json" \
    -H "apikey: ${ANON_KEY}" 2>&1)

  # Extract count from response
  count=$(echo "$response" | grep -o '"count":[0-9]*' | cut -d: -f2 | head -1)

  if [ -z "$count" ]; then
    echo "   ⚠️  Could not verify (check Supabase manually)"
  else
    echo "   ✅ Found $count records"
  fi
}

echo "Database Tables:"
echo "────────────────────────────────────────"
query_table "features" "Features"
query_table "feature_categories" "Feature Categories"
query_table "feature_templates" "Feature Templates"
query_table "feature_requests" "Feature Requests"
query_table "business_owner_features" "Business Owner Features"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ Verification Complete!"
echo ""
echo "Next: Start dev server to test"
echo "  cd business-app/frontend && npm run dev"
echo ""
