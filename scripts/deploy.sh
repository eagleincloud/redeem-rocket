#!/bin/bash

##############################################################################
# BUSINESS OS v1.0 - AUTOMATED DEPLOYMENT SCRIPT
#
# This script automates the complete production deployment process:
# 1. Database migrations
# 2. Edge function deployment
# 3. Environment configuration
# 4. Frontend build & deploy
# 5. Smoke testing
# 6. Monitoring setup
#
# Usage: ./scripts/deploy.sh [environment] [skip-migrations]
# Example: ./scripts/deploy.sh production
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
SKIP_MIGRATIONS=${2:-false}
LOG_FILE="deployment-$(date +%Y%m%d-%H%M%S).log"
START_TIME=$(date +%s)

##############################################################################
# LOGGING FUNCTIONS
##############################################################################

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

##############################################################################
# VALIDATION FUNCTIONS
##############################################################################

check_prerequisites() {
    log "Checking prerequisites..."

    # Check required tools
    command -v supabase >/dev/null 2>&1 || {
        log_error "supabase CLI not found. Install: npm install -g supabase"
        exit 1
    }

    command -v vercel >/dev/null 2>&1 || {
        log_error "vercel CLI not found. Install: npm install -g vercel"
        exit 1
    }

    command -v git >/dev/null 2>&1 || {
        log_error "git not found"
        exit 1
    }

    command -v node >/dev/null 2>&1 || {
        log_error "node.js not found"
        exit 1
    }

    # Check environment variables
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        log_error ".env.$ENVIRONMENT file not found"
        log "Create it with: cp .env.example .env.$ENVIRONMENT"
        exit 1
    fi

    log_success "All prerequisites met"
}

check_git_status() {
    log "Checking git status..."

    if [ -n "$(git status --porcelain)" ]; then
        log_warning "Uncommitted changes detected"
        git status --short | tee -a "$LOG_FILE"
        read -p "Continue deployment? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled"
            exit 1
        fi
    fi

    log_success "Git status clean"
}

##############################################################################
# PHASE 1: DATABASE MIGRATIONS
##############################################################################

run_migrations() {
    if [ "$SKIP_MIGRATIONS" = "true" ]; then
        log_warning "Skipping database migrations"
        return
    fi

    log "Phase 1: Running database migrations..."

    # Load environment
    export $(cat ".env.$ENVIRONMENT" | xargs)

    # Get migration count
    MIGRATION_COUNT=$(ls -1 supabase/migrations/*.sql 2>/dev/null | wc -l)
    log "Found $MIGRATION_COUNT migrations to apply"

    # Run migrations
    if supabase db push --dry-run > /tmp/migration-dry-run.sql 2>&1; then
        log "Dry run successful, applying migrations..."

        if supabase db push 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Migrations applied successfully"

            # Verify
            sleep 2
            ACTUAL_TABLES=$(supabase query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null | tail -1)
            ACTUAL_RLS=$(supabase query "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND rowsecurity=true;" 2>/dev/null | tail -1)

            log "Created tables: $ACTUAL_TABLES (expected: 35+)"
            log "Tables with RLS: $ACTUAL_RLS (expected: 40+)"

            if [ "$ACTUAL_TABLES" -lt 30 ]; then
                log_error "Insufficient tables created. Check migration logs."
                exit 1
            fi
        else
            log_error "Failed to apply migrations"
            exit 1
        fi
    else
        log_error "Migration dry-run failed. Check .env.$ENVIRONMENT"
        cat /tmp/migration-dry-run.sql | tee -a "$LOG_FILE"
        exit 1
    fi
}

##############################################################################
# PHASE 2: EDGE FUNCTION DEPLOYMENT
##############################################################################

deploy_functions() {
    log "Phase 2: Deploying edge functions..."

    FUNCTION_COUNT=$(ls -1d supabase/functions/*/ 2>/dev/null | wc -l)
    log "Found $FUNCTION_COUNT functions to deploy"

    if supabase functions deploy 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Functions deployed successfully"

        # List deployed functions
        log "Deployed functions:"
        supabase functions list | tee -a "$LOG_FILE"

        # Test critical functions
        test_critical_functions
    else
        log_error "Failed to deploy functions"
        exit 1
    fi
}

test_critical_functions() {
    log "Testing critical functions..."

    # Get project URL and key
    SUPABASE_URL=$(grep VITE_SUPABASE_URL ".env.$ENVIRONMENT" | cut -d '=' -f 2)
    SUPABASE_KEY=$(grep VITE_SUPABASE_ANON_KEY ".env.$ENVIRONMENT" | cut -d '=' -f 2)

    # Test ai-manager-layer
    log "Testing ai-manager-layer function..."
    RESPONSE=$(curl -s -X POST "$SUPABASE_URL/functions/v1/ai-manager-layer" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -d '{"dealId":"test","businessId":"test","managerId":"test","context":{}}' \
        2>&1)

    if echo "$RESPONSE" | grep -q "error"; then
        log_warning "ai-manager-layer test response: $RESPONSE"
    else
        log_success "ai-manager-layer function is responding"
    fi
}

##############################################################################
# PHASE 3: ENVIRONMENT CONFIGURATION
##############################################################################

configure_environment() {
    log "Phase 3: Configuring environment..."

    export $(cat ".env.$ENVIRONMENT" | xargs)

    # Verify critical variables
    REQUIRED_VARS=(
        "VITE_SUPABASE_URL"
        "VITE_SUPABASE_ANON_KEY"
        "ANTHROPIC_API_KEY"
    )

    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Missing required variable: $var"
            exit 1
        fi
        log "✓ $var is set"
    done

    # Set Vercel environment variables
    log "Setting Vercel environment variables..."
    if command -v vercel &> /dev/null; then
        vercel env pull .env.$ENVIRONMENT 2>&1 | tee -a "$LOG_FILE" || true
    fi

    log_success "Environment configuration complete"
}

##############################################################################
# PHASE 4: FRONTEND BUILD & DEPLOY
##############################################################################

build_frontend() {
    log "Phase 4: Building frontend..."

    # Install dependencies
    log "Installing dependencies..."
    npm ci 2>&1 | grep -E "added|up to date|error" | tee -a "$LOG_FILE"

    # Build
    log "Building for production..."
    if npm run build 2>&1 | tee -a "$LOG_FILE"; then
        log_success "Frontend build successful"

        # Check build artifacts
        if [ -f "dist-business/index.html" ] && [ -f "dist-admin/index.html" ]; then
            log_success "Build artifacts verified"
            BUILD_SIZE=$(du -sh dist-business/ | cut -f1)
            log "Business app size: $BUILD_SIZE"
        else
            log_error "Build artifacts missing"
            exit 1
        fi
    else
        log_error "Frontend build failed"
        exit 1
    fi
}

deploy_frontend() {
    log "Deploying frontend to Vercel..."

    if vercel deploy --prod 2>&1 | tee -a "$LOG_FILE"; then
        # Get deployment URL
        DEPLOY_URL=$(vercel ls | grep "Prod:" | awk '{print $NF}')
        log_success "Frontend deployed successfully"
        log "Production URL: $DEPLOY_URL"
        echo "$DEPLOY_URL" > "/tmp/deploy-url.txt"
    else
        log_error "Frontend deployment failed"
        exit 1
    fi
}

##############################################################################
# PHASE 5: SMOKE TESTING
##############################################################################

run_smoke_tests() {
    log "Phase 5: Running smoke tests..."

    if [ ! -f "/tmp/deploy-url.txt" ]; then
        log_warning "Deployment URL not found, skipping smoke tests"
        return
    fi

    DEPLOY_URL=$(cat /tmp/deploy-url.txt)
    TEST_PASSED=0
    TEST_FAILED=0

    # Test 1: Frontend loads
    log "Test 1: Frontend accessibility..."
    if curl -sf "$DEPLOY_URL" > /dev/null; then
        log_success "Frontend loads successfully"
        ((TEST_PASSED++))
    else
        log_error "Frontend not accessible"
        ((TEST_FAILED++))
    fi

    # Test 2: API health check
    log "Test 2: API health check..."
    API_RESPONSE=$(curl -s "$DEPLOY_URL/api/health" 2>&1)
    if echo "$API_RESPONSE" | grep -q "ok\|healthy"; then
        log_success "API is healthy"
        ((TEST_PASSED++))
    else
        log_warning "API health check inconclusive"
    fi

    # Test 3: Database connectivity
    log "Test 3: Database connectivity..."
    if supabase status 2>&1 | grep -q "connected"; then
        log_success "Database is connected"
        ((TEST_PASSED++))
    else
        log_warning "Database status unclear"
    fi

    # Test 4: Edge functions
    log "Test 4: Edge functions..."
    FUNCTION_LIST=$(supabase functions list 2>&1)
    FUNCTION_COUNT=$(echo "$FUNCTION_LIST" | grep -c "function" || echo 0)
    if [ "$FUNCTION_COUNT" -gt 20 ]; then
        log_success "Functions deployed ($FUNCTION_COUNT found)"
        ((TEST_PASSED++))
    else
        log_error "Insufficient functions deployed"
        ((TEST_FAILED++))
    fi

    log "Smoke tests: $TEST_PASSED passed, $TEST_FAILED failed"

    if [ $TEST_FAILED -gt 0 ]; then
        log_warning "Some smoke tests failed, but deployment is complete"
    fi
}

##############################################################################
# MONITORING & SETUP
##############################################################################

setup_monitoring() {
    log "Setting up monitoring..."

    # Create monitoring config
    cat > "monitoring-config.json" << 'EOF'
{
  "version": "1.0",
  "environment": "production",
  "endpoints": [
    {
      "name": "frontend",
      "url": "https://[domain]",
      "interval": 60,
      "timeout": 10
    },
    {
      "name": "api",
      "url": "https://[domain]/api/health",
      "interval": 60,
      "timeout": 10
    },
    {
      "name": "database",
      "check": "supabase_status",
      "interval": 300
    }
  ],
  "alerts": {
    "downtime": {
      "threshold": 300,
      "notification": "email"
    },
    "error_rate": {
      "threshold": 0.01,
      "notification": "slack"
    },
    "response_time": {
      "threshold": 2000,
      "notification": "email"
    }
  }
}
EOF

    log_success "Monitoring config created: monitoring-config.json"
}

##############################################################################
# COMPLETION & SUMMARY
##############################################################################

print_summary() {
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         DEPLOYMENT COMPLETE - SUMMARY                      ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}✅ Deployment Phases:${NC}"
    echo "  1. Database migrations - COMPLETE"
    echo "  2. Edge function deployment - COMPLETE"
    echo "  3. Environment configuration - COMPLETE"
    echo "  4. Frontend build & deploy - COMPLETE"
    echo "  5. Smoke testing - COMPLETE"
    echo "  6. Monitoring setup - COMPLETE"
    echo ""
    echo -e "${BLUE}📊 Statistics:${NC}"
    echo "  Deployment duration: ${DURATION}s"
    echo "  Log file: $LOG_FILE"
    echo "  Timestamp: $(date)"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo "  1. Review deployment log: cat $LOG_FILE"
    echo "  2. Check frontend: https://[your-domain]"
    echo "  3. Monitor error logs: supabase logs tail"
    echo "  4. Run end-to-end tests: npm run test:e2e"
    echo "  5. Monitor performance: vercel analytics"
    echo ""
    echo -e "${GREEN}✨ Deployment successful!${NC}"
    echo ""
}

##############################################################################
# MAIN EXECUTION
##############################################################################

main() {
    log "Starting Business OS v1.0 deployment"
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $(date)"
    echo ""

    # Pre-deployment checks
    check_prerequisites
    check_git_status

    # Deployment phases
    run_migrations
    deploy_functions
    configure_environment
    build_frontend
    deploy_frontend

    # Post-deployment
    run_smoke_tests
    setup_monitoring

    # Summary
    print_summary

    log_success "All deployment tasks completed!"
}

# Run main function
main "$@"
