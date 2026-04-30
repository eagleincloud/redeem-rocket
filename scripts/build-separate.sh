#!/bin/bash

# Build Process for Separate Admin and Business Apps
# This script builds both apps independently to their respective directories
# and verifies both builds succeeded

set -e  # Exit on first error

echo "================================================================"
echo "Building dual-app project with separate outputs"
echo "================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track build status
BUILD_SUCCESS=true

# 1. Build business app
echo -e "${YELLOW}[1/3]${NC} Building business app to dist-business..."
if npm run build:business; then
  echo -e "${GREEN}✓ Business app built successfully${NC}\n"
else
  echo -e "${RED}✗ Business app build failed${NC}\n"
  BUILD_SUCCESS=false
fi

# 2. Build admin app
echo -e "${YELLOW}[2/3]${NC} Building admin app to dist-admin..."
if npm run build:admin; then
  echo -e "${GREEN}✓ Admin app built successfully${NC}\n"
else
  echo -e "${RED}✗ Admin app build failed${NC}\n"
  BUILD_SUCCESS=false
fi

# 3. Merge builds (copy admin HTML and assets to business output)
echo -e "${YELLOW}[3/3]${NC} Merging builds and organizing structure..."
if node scripts/merge-builds.mjs; then
  echo -e "${GREEN}✓ Builds merged successfully${NC}\n"
else
  echo -e "${RED}✗ Build merge failed${NC}\n"
  BUILD_SUCCESS=false
fi

echo "================================================================"
echo "Build Verification"
echo "================================================================"
echo ""

# Verify business app output
BUSINESS_DIR="dist-business"
if [ -d "$BUSINESS_DIR" ]; then
  echo -e "${GREEN}✓${NC} dist-business directory exists"

  # Check key files
  [ -f "$BUSINESS_DIR/index.html" ] && echo -e "  ${GREEN}✓${NC} index.html" || echo -e "  ${RED}✗${NC} index.html"
  [ -f "$BUSINESS_DIR/business.html" ] && echo -e "  ${GREEN}✓${NC} business.html" || echo -e "  ${RED}✗${NC} business.html"
  [ -d "$BUSINESS_DIR/assets" ] && echo -e "  ${GREEN}✓${NC} assets/" || echo -e "  ${RED}✗${NC} assets/"
else
  echo -e "${RED}✗${NC} dist-business directory not found"
  BUILD_SUCCESS=false
fi

# Verify admin app output
ADMIN_DIR="dist-admin"
if [ -d "$ADMIN_DIR" ]; then
  echo -e "${GREEN}✓${NC} dist-admin directory exists"

  # Check key files
  [ -f "$ADMIN_DIR/admin.html" ] && echo -e "  ${GREEN}✓${NC} admin.html" || echo -e "  ${RED}✗${NC} admin.html"
  [ -d "$ADMIN_DIR/assets" ] && echo -e "  ${GREEN}✓${NC} assets/" || echo -e "  ${RED}✗${NC} assets/"
else
  echo -e "${RED}✗${NC} dist-admin directory not found"
  BUILD_SUCCESS=false
fi

# Check merged admin files in business output
if [ -d "$BUSINESS_DIR" ]; then
  [ -f "$BUSINESS_DIR/admin/index.html" ] && echo -e "${GREEN}✓${NC} Merged: admin/index.html in dist-business" || echo -e "${RED}✗${NC} Missing: admin/index.html in dist-business"
  [ -d "$BUSINESS_DIR/admin/assets" ] && echo -e "${GREEN}✓${NC} Merged: admin/assets/ in dist-business" || echo -e "${RED}✗${NC} Missing: admin/assets/ in dist-business"
fi

echo ""
echo "================================================================"

# Final status
if [ "$BUILD_SUCCESS" = true ]; then
  echo -e "${GREEN}Build completed successfully!${NC}"
  echo ""
  echo "Output structure:"
  echo "  dist-business/          (deployed to /"
  echo "    index.html            (SPA entry, mirrors business.html)"
  echo "    business.html         (business app entry)"
  echo "    admin/index.html      (admin app entry, routed via /admin path)"
  echo "    assets/               (business app assets)"
  echo "    admin/assets/         (admin app assets)"
  echo ""
  echo "  dist-admin/             (for reference/backup)"
  echo "    admin.html"
  echo "    assets/"
  echo ""
  echo "Next: Deploy dist-business/ to Vercel"
  exit 0
else
  echo -e "${RED}Build failed. Please review errors above.${NC}"
  exit 1
fi
