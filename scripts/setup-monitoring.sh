#!/bin/bash
# BUSINESS OS v1.0 - MONITORING & ALERTING SETUP
set -e
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
ENVIRONMENT=${1:-production}
LOG_FILE="monitoring-setup-$(date +%Y%m%d-%H%M%S).log"

log() { echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
log_success() { echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"; }
log_error() { echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"; }

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     BUSINESS OS v1.0 - MONITORING & ALERTING SETUP        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

mkdir -p monitoring

log "Creating monitoring configuration..."
cat > monitoring/monitoring-config.json << 'EOFCONFIG'
{
  "version": "1.0",
  "environment": "production",
  "monitoring_interval": 60,
  "endpoints": [
    {"name": "Frontend Root", "url": "https://redeemrocket.in", "method": "GET", "expected_status": 200},
    {"name": "Onboarding", "url": "https://redeemrocket.in/onboarding", "method": "GET", "expected_status": 200},
    {"name": "Dashboard", "url": "https://redeemrocket.in/app/dashboard", "method": "GET", "expected_status": 200},
    {"name": "API Health", "url": "https://redeemrocket.in/api/health", "method": "GET", "expected_status": 200},
    {"name": "Pipelines API", "url": "https://redeemrocket.in/api/pipelines", "method": "GET", "expected_status": 200},
    {"name": "Automation API", "url": "https://redeemrocket.in/api/automation/rules", "method": "GET", "expected_status": 200},
    {"name": "Metrics API", "url": "https://redeemrocket.in/api/metrics/dashboard", "method": "GET", "expected_status": 200}
  ],
  "alerts": {
    "endpoint_down": {"threshold": 2, "notification": ["email", "slack"], "severity": "critical"},
    "response_time": {"threshold_warning": 500, "threshold_critical": 2000, "notification": ["slack"]},
    "error_rate": {"threshold_warning": 0.01, "threshold_critical": 0.05, "notification": ["email", "slack"]}
  }
}
EOFCONFIG
log_success "Monitoring config created: monitoring/monitoring-config.json"

log "Creating alert rules configuration..."
cat > monitoring/alert-rules.yaml << 'EOFALERT'
groups:
  - name: endpoint_health
    interval: 60s
    rules:
      - alert: EndpointDown
        expr: up{job="http_check"} == 0
        for: 2m
        labels:
          severity: critical
      - alert: EndpointSlowResponse
        expr: http_request_duration_ms > 2000
        for: 5m
        labels:
          severity: warning
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
EOFALERT
log_success "Alert rules created: monitoring/alert-rules.yaml"

log "Creating Grafana dashboard configuration..."
cat > monitoring/grafana-dashboard.json << 'EOFGRAF'
{
  "dashboard": {
    "title": "Business OS v1.0 - System Overview",
    "tags": ["business-os", "production"],
    "timezone": "browser",
    "refresh": "30s",
    "panels": [
      {"id": 1, "title": "System Health Status"},
      {"id": 2, "title": "Request Rate (req/sec)"},
      {"id": 3, "title": "Error Rate (%)"},
      {"id": 4, "title": "Average Response Time (ms)"},
      {"id": 5, "title": "Active Businesses"},
      {"id": 6, "title": "Active Users"},
      {"id": 7, "title": "Database Connection Pool"},
      {"id": 8, "title": "Automation Executions"}
    ]
  }
}
EOFGRAF
log_success "Grafana dashboard created: monitoring/grafana-dashboard.json"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              MONITORING SETUP COMPLETE                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Created:${NC}"
echo "  • monitoring/monitoring-config.json"
echo "  • monitoring/alert-rules.yaml"
echo "  • monitoring/grafana-dashboard.json"
echo ""
echo "Next steps:"
echo "  1. Review monitoring configuration"
echo "  2. Set up Slack webhook URL"
echo "  3. Configure email alerts"
echo "  4. Deploy health check function: supabase functions deploy health-check"
echo ""
log_success "Monitoring setup completed successfully!"
