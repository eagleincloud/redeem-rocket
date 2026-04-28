#!/bin/bash

##############################################################################
# BUSINESS OS v1.0 - PRE-DEPLOYMENT VERIFICATION SCRIPT
##############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENVIRONMENT=${1:-production}
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    BUSINESS OS v1.0 - PRE-DEPLOYMENT VERIFICATION         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

check_pass() { echo -e "${GREEN}✅ $1${NC}"; ((CHECKS_PASSED++)); }
check_fail() { echo -e "${RED}❌ $1${NC}"; ((CHECKS_FAILED++)); }
check_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; ((CHECKS_WARNING++)); }

##############################################################################
# 1. VERIFY CLI TOOLS
##############################################################################

echo -e "${BLUE}1. VERIFYING CLI TOOLS${NC}"
command -v git &> /dev/null && check_pass "git installed" || check_fail "git not installed"
command -v node &> /dev/null && check_pass "node installed" || check_fail "node not installed"
command -v npm &> /dev/null && check_pass "npm installed" || check_fail "npm not installed"
command -v supabase &> /dev/null && check_pass "supabase CLI installed" || check_fail "supabase CLI not installed"
command -v vercel &> /dev/null && check_pass "vercel CLI installed" || check_fail "vercel CLI not installed"
echo ""

##############################################################################
# 2. VERIFY ENVIRONMENT FILES
##############################################################################

echo -e "${BLUE}2. VERIFYING ENVIRONMENT CONFIGURATION${NC}"
if [ -f ".env.production" ]; then
    check_pass ".env.production file exists"
    grep -q "VITE_SUPABASE_URL" .env.production && check_pass "VITE_SUPABASE_URL is set" || check_fail "VITE_SUPABASE_URL not set"
    grep -q "VITE_SUPABASE_ANON_KEY" .env.production && check_pass "VITE_SUPABASE_ANON_KEY is set" || check_fail "VITE_SUPABASE_ANON_KEY not set"
else
    check_fail ".env.production file not found"
fi
echo ""

##############################################################################
# 3. VERIFY PROJECT STRUCTURE
##############################################################################

echo -e "${BLUE}3. VERIFYING PROJECT STRUCTURE${NC}"
[ -d "business-app" ] && check_pass "business-app directory exists" || check_fail "business-app missing"
[ -d "admin-app" ] && check_pass "admin-app directory exists" || check_fail "admin-app missing"
[ -d "supabase" ] && check_pass "supabase directory exists" || check_fail "supabase missing"
[ -f "scripts/deploy.sh" ] && check_pass "deploy.sh found" || check_fail "deploy.sh missing"
[ -f "scripts/smoke-tests.js" ] && check_pass "smoke-tests.js found" || check_fail "smoke-tests.js missing"
echo ""

##############################################################################
# 4. VERIFY GIT STATUS
##############################################################################

echo -e "${BLUE}4. VERIFYING GIT STATUS${NC}"
BRANCH=$(git rev-parse --abbrev-ref HEAD)
check_pass "Current branch: $BRANCH"
if [ -z "$(git status --porcelain)" ]; then
    check_pass "Working directory is clean"
else
    check_warn "Uncommitted changes detected (may need to commit before deploying)"
fi
echo ""

##############################################################################
# SUMMARY
##############################################################################

echo "╔════════════════════════════════════════════════════════════╗"
echo "║                   VERIFICATION SUMMARY                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Passed: $CHECKS_PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $CHECKS_WARNING${NC}"
echo -e "${RED}❌ Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CRITICAL CHECKS PASSED - READY FOR DEPLOYMENT${NC}"
    exit 0
else
    echo -e "${RED}❌ DEPLOYMENT BLOCKED - FIX ERRORS ABOVE FIRST${NC}"
    exit 1
fi
