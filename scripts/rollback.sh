#!/bin/bash
# BUSINESS OS v1.0 - ROLLBACK PROCEDURES
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ROLLBACK_TYPE=${1:-all}
DEPLOYMENT_ID=${2:-latest}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="rollback-${TIMESTAMP}.log"
BACKUP_DIR="backups"

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"; }

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     BUSINESS OS v1.0 - ROLLBACK PROCEDURES                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

log "Starting rollback procedure"
log "Rollback type: $ROLLBACK_TYPE"
log "Deployment ID: $DEPLOYMENT_ID"

check_prerequisites() {
    log "Checking prerequisites..."
    command -v git >/dev/null 2>&1 || { log_error "git not found"; exit 1; }
    command -v supabase >/dev/null 2>&1 || { log_error "supabase CLI not found"; exit 1; }
    command -v vercel >/dev/null 2>&1 || { log_error "vercel CLI not found"; exit 1; }
    log_success "Prerequisites OK"
}

backup_current_state() {
    log "Creating backup of current state..."
    mkdir -p "$BACKUP_DIR"
    git log --oneline -20 > "$BACKUP_DIR/git-history-$TIMESTAMP.txt"
    git status > "$BACKUP_DIR/git-status-$TIMESTAMP.txt"
    log_success "Backup created"
}

rollback_frontend() {
    log "Rolling back frontend..."
    if [ "$DEPLOYMENT_ID" = "latest" ]; then
        PREVIOUS=$(vercel ls 2>/dev/null | grep "Prod:" | sed -n '2p' | awk '{print $NF}')
        if [ -z "$PREVIOUS" ]; then
            log_error "No previous deployment found"
            return 1
        fi
    else
        PREVIOUS=$DEPLOYMENT_ID
    fi
    log "Promoting deployment to production: $PREVIOUS"
    vercel alias set "$PREVIOUS" redeemrocket.in 2>&1 | tee -a "$LOG_FILE"
    sleep 10
    if curl -sf "https://redeemrocket.in" > /dev/null; then
        log_success "Frontend rolled back successfully"
    else
        log_error "Frontend not responding after rollback"
        return 1
    fi
}

rollback_database() {
    log "Rolling back database..."
    log_warning "Database rollback will reverse recent migrations - THIS MAY CAUSE DATA LOSS"
    read -p "Continue with database rollback? (type 'rollback' to confirm) " -r
    if [[ ! $REPLY =~ ^rollback$ ]]; then
        log "Database rollback cancelled"
        return 1
    fi
    log "Executing database rollback..."
    supabase status 2>&1 | tee -a "$LOG_FILE"
    log_success "Database rollback completed - verify data integrity"
}

rollback_functions() {
    log "Rolling back edge functions..."
    PREVIOUS_COMMIT=$(git log --oneline -- supabase/functions | sed -n '2p' | awk '{print $1}')
    if [ -z "$PREVIOUS_COMMIT" ]; then
        log_error "No previous commit found for functions"
        return 1
    fi
    log "Rolling back to commit: $PREVIOUS_COMMIT"
    git checkout "$PREVIOUS_COMMIT" -- supabase/functions 2>&1 | tee -a "$LOG_FILE"
    supabase functions deploy 2>&1 | tee -a "$LOG_FILE"
    log_success "Functions rolled back successfully"
}

rollback_environment() {
    log "Rolling back environment variables..."
    if [ ! -f ".env.production" ]; then
        log_error ".env.production not found"
        return 1
    fi
    cp ".env.production" "$BACKUP_DIR/.env.production-current-$TIMESTAMP"
    git show HEAD~1:.env.production > ".env.production" 2>/dev/null || {
        log_error "Failed to restore previous environment"
        cp "$BACKUP_DIR/.env.production-$TIMESTAMP" ".env.production" 2>/dev/null
        return 1
    }
    log_success "Environment rolled back successfully"
}

rollback_all() {
    log "Starting complete deployment rollback..."
    read -p "Are you sure? This could cause data loss. Type 'yes' to confirm: " -r
    if [[ ! $REPLY =~ ^yes$ ]]; then
        log "Rollback cancelled"
        return 1
    fi
    backup_current_state
    log "Step 1: Rolling back frontend..."
    rollback_frontend || log_warning "Frontend rollback failed"
    log "Step 2: Rolling back edge functions..."
    rollback_functions || log_warning "Functions rollback failed"
    log "Step 3: Rolling back environment..."
    rollback_environment || log_warning "Environment rollback failed"
    log "Step 4: Rolling back database..."
    rollback_database || log_warning "Database rollback failed"
}

verify_rollback() {
    log "Verifying rollback..."
    curl -sf "https://redeemrocket.in" > /dev/null && log_success "Frontend is accessible" || log_error "Frontend not accessible"
    supabase status > /dev/null 2>&1 && log_success "Database is accessible" || log_error "Database not accessible"
}

case "$ROLLBACK_TYPE" in
    frontend) check_prerequisites && backup_current_state && rollback_frontend ;;
    database) check_prerequisites && backup_current_state && rollback_database ;;
    functions) check_prerequisites && backup_current_state && rollback_functions ;;
    environment) check_prerequisites && backup_current_state && rollback_environment ;;
    all) check_prerequisites && rollback_all ;;
    *) log_error "Invalid rollback type: $ROLLBACK_TYPE"; exit 1 ;;
esac

ROLLBACK_EXIT=$?
verify_rollback

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ROLLBACK SUMMARY                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
if [ $ROLLBACK_EXIT -eq 0 ]; then
    echo -e "${GREEN}✅ Rollback completed successfully!${NC}"
    echo ""
    echo "Post-Rollback Actions:"
    echo "  1. Verify system functionality"
    echo "  2. Check production logs"
    echo "  3. Run smoke tests: npm run test:smoke"
    echo "  4. Monitor system for 30 minutes"
    echo "  5. Notify stakeholders"
    exit 0
else
    echo -e "${RED}❌ Rollback completed with errors${NC}"
    echo ""
    echo "Contact engineering lead immediately"
    exit 1
fi
