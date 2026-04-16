#!/bin/bash

# Feature Marketplace Setup Validation Script
# This script verifies all components are properly configured

WORKDIR="/Users/adityatiwari/Downloads/App Creation Request-2/.claude/worktrees/jolly-herschel"
cd "$WORKDIR"

echo "🔍 Feature Marketplace Setup Validation"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASS=0
FAIL=0
WARN=0

# Helper functions
check_file() {
  if [ -f "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $2 (missing: $1)"
    ((FAIL++))
  fi
}

check_dir() {
  if [ -d "$1" ]; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASS++))
  else
    echo -e "${RED}✗${NC} $2 (missing: $1)"
    ((FAIL++))
  fi
}

check_command() {
  if command -v "$1" &> /dev/null; then
    echo -e "${GREEN}✓${NC} $2"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠${NC} $2 (optional)"
    ((WARN++))
  fi
}

# 1. Check Environment
echo "1️⃣  Environment Setup"
echo "---"
check_file ".env.local" "Environment file (.env.local)"
[ -f ".env.local" ] && {
  SUPABASE_URL=$(grep "^SUPABASE_URL=" .env.local | cut -d= -f2-)
  [ -n "$SUPABASE_URL" ] && echo -e "${GREEN}✓${NC} Supabase URL configured" && ((PASS++)) || {
    echo -e "${RED}✗${NC} Supabase URL missing"
    ((FAIL++))
  }
}
echo ""

# 2. Check Migrations
echo "2️⃣  Database Migrations"
echo "---"
check_file "supabase/migrations/20250416_feature_marketplace.sql" "Main schema migration"
check_file "supabase/migrations/20250416_seed_features.sql" "Seed data migration"
check_file "supabase/migrations/20250408_enhanced_onboarding.sql" "Onboarding migration"
echo ""

# 3. Check Frontend Components
echo "3️⃣  Frontend Components"
echo "---"
check_file "business-app/frontend/src/lib/supabase/features.ts" "Feature service (features.ts)"
check_file "business-app/frontend/src/hooks/useFeatures.ts" "Feature hooks (useFeatures.ts)"
check_file "business-app/frontend/src/business/components/FeatureBrowser.tsx" "Feature browser component"
check_file "business-app/frontend/src/business/components/PricingCalculator.tsx" "Pricing calculator component"
check_file "business-app/frontend/src/business/components/FeatureSelectionManager.tsx" "Feature selection manager"
check_file "business-app/frontend/src/business/components/TemplateBrowser.tsx" "Template browser component"
check_file "business-app/frontend/src/business/components/FeatureRequestForm.tsx" "Feature request form"
echo ""

# 4. Check Pages
echo "4️⃣  Frontend Pages"
echo "---"
check_file "business-app/frontend/src/business/pages/FeatureMarketplace.tsx" "Feature marketplace main page"
check_file "business-app/frontend/src/admin/AdminFeatureManagement.tsx" "Admin feature management"
check_file "business-app/frontend/src/admin/FeatureRequestQueue.tsx" "Feature request queue"
check_file "business-app/frontend/src/admin/FeatureRequestEditor.tsx" "Feature request editor"
check_file "business-app/frontend/src/admin/FeatureUsageStats.tsx" "Feature usage analytics"
echo ""

# 5. Check Types
echo "5️⃣  TypeScript Types"
echo "---"
if grep -q "interface Feature" "business-app/frontend/src/types/index.ts" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Feature types defined"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Feature types not found"
  ((FAIL++))
fi
echo ""

# 6. Check Routing
echo "6️⃣  Routing Configuration"
echo "---"
if grep -q "/features" "business-app/frontend/src/App.tsx" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Feature routes configured in App.tsx"
  ((PASS++))
else
  echo -e "${RED}✗${NC} Feature routes missing from App.tsx"
  ((FAIL++))
fi

if grep -q "🎯 Features" "business-app/frontend/src/components/Navigation.tsx" 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Feature link in Navigation"
  ((PASS++))
else
  echo -e "${YELLOW}⚠${NC} Feature link not in Navigation (optional)"
  ((WARN++))
fi
echo ""

# 7. Check Documentation
echo "7️⃣  Documentation"
echo "---"
check_file "FEATURE_MARKETPLACE_README.md" "README documentation"
check_file "FEATURE_MARKETPLACE_SETUP.md" "Setup guide"
check_file "FEATURE_MARKETPLACE_DEPLOYMENT.md" "Deployment guide"
check_file "MIGRATION_DEPLOYMENT_GUIDE.md" "Migration deployment guide"
echo ""

# 8. Check System Requirements
echo "8️⃣  System Requirements"
echo "---"
check_command "node" "Node.js"
check_command "npm" "npm"
check_command "git" "Git"
echo ""

# 9. Check Dependencies
echo "9️⃣  npm Dependencies"
echo "---"
if [ -f "business-app/frontend/package.json" ]; then
  if grep -q "@supabase" "business-app/frontend/package.json"; then
    echo -e "${GREEN}✓${NC} Supabase dependencies installed"
    ((PASS++))
  else
    echo -e "${YELLOW}⚠${NC} Supabase not in package.json (may need install)"
    ((WARN++))
  fi
else
  echo -e "${RED}✗${NC} package.json not found"
  ((FAIL++))
fi
echo ""

# 10. Check Build Files
echo "🔟 Build Configuration"
echo "---"
check_file "business-app/frontend/vite.config.ts" "Vite configuration"
check_file "business-app/frontend/tsconfig.json" "TypeScript configuration"
check_file "business-app/frontend/tailwind.config.js" "Tailwind CSS configuration"
echo ""

# Summary
echo "========================================"
echo "📊 Validation Summary"
echo "---"
echo -e "${GREEN}Passed:${NC}  $PASS"
echo -e "${RED}Failed:${NC}  $FAIL"
echo -e "${YELLOW}Warnings:${NC} $WARN"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ Setup validation successful!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Deploy migrations (see MIGRATION_DEPLOYMENT_GUIDE.md)"
  echo "2. Install dependencies: npm install"
  echo "3. Start dev server: npm run dev"
  echo "4. Test feature marketplace:"
  echo "   - Login to business app"
  echo "   - Navigate to Features page"
  echo "   - Browse and select features"
  exit 0
else
  echo -e "${RED}❌ Setup validation failed!${NC}"
  echo ""
  echo "Please fix the issues above and re-run validation."
  exit 1
fi
