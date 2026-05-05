# E-Signature System - Deployment & Operations Guide

---

## PRE-DEPLOYMENT VERIFICATION (1 week before)

### Database & Schema Validation

- [ ] All 8 migration files tested in staging environment
- [ ] Schema validation script executed successfully
- [ ] Foreign key constraints verified
- [ ] Indexes created and query plans optimal
- [ ] Row-level security (RLS) policies enabled
- [ ] RLS policies tested with multiple user roles
- [ ] Triggers created (if applicable)
- [ ] Database backup schedule configured
- [ ] Disaster recovery tested

**Verification Script:**
```sql
-- Verify all tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname='public' AND tablename LIKE 'esign%' 
ORDER BY tablename;

-- Verify indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename LIKE 'esign%' 
ORDER BY tablename, indexname;

-- Verify RLS enabled
SELECT schemaname, tablename, rowsecurity FROM pg_tables 
WHERE tablename LIKE 'esign%';

-- Check for missing data
SELECT COUNT(*) FROM esign_documents WHERE file_url IS NULL; -- Should be 0
```

### API Endpoint Validation

- [ ] All 13 endpoints respond with correct status codes
- [ ] Request/response schemas match specification
- [ ] Error handling returns proper error messages
- [ ] Rate limiting working (test with 101 requests/min)
- [ ] Authentication required on all protected endpoints
- [ ] JWT token validation working
- [ ] CORS headers configured correctly
- [ ] Content-type validation enforced
- [ ] API documentation generated and accurate

**Test Script:**
```bash
# Test POST /documents endpoint
curl -X POST http://localhost:3000/api/v1/esign/documents \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Doc",
    "documentType": "agreement",
    "expiresAt": "2026-06-04T00:00:00Z"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

# Test rate limiting (should fail on 101st request)
for i in {1..105}; do
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $JWT_TOKEN" \
    http://localhost:3000/api/v1/esign/documents
done
```

### File Storage & Encryption Validation

- [ ] S3 bucket created and policies configured
- [ ] Storage buckets have correct access controls
- [ ] Encryption at rest enabled
- [ ] TLS 1.3+ configured for transport
- [ ] File upload size limits enforced (50MB max)
- [ ] File type validation working
- [ ] Signed URLs generated with 1-hour expiration
- [ ] File deletion policy configured
- [ ] Backup storage configured

**Verification:**
```bash
# Test file upload
aws s3api put-object \
  --bucket esign-documents \
  --key "test-business-id/test-document/original/test.pdf" \
  --body sample.pdf

# Verify encryption
aws s3api head-object \
  --bucket esign-documents \
  --key "test-business-id/test-document/original/test.pdf" \
  | grep ServerSideEncryption

# Test signed URL generation
aws s3 presign s3://esign-documents/test-business-id/test-document/original/test.pdf \
  --expires-in 3600
```

### Email & Notification System

- [ ] Resend API key configured
- [ ] Email templates created for all 6 notification types
- [ ] Test emails sent successfully
- [ ] Email rendering checked in multiple clients
- [ ] Unsubscribe links working
- [ ] List-Unsubscribe header configured
- [ ] Bounce handling configured
- [ ] Complaint handling configured
- [ ] Scheduled jobs configured (reminders, expiration)

**Notification Testing Checklist:**
- [ ] Document sent notification
- [ ] Reminder notification (7 days before expiry)
- [ ] Signature completed notification
- [ ] Signature declined notification
- [ ] Document expired notification
- [ ] Manager assistance notification

### UI Component Testing

- [ ] Draw signature canvas works on desktop
- [ ] Draw signature works on mobile/tablet
- [ ] Touch support working (stylus, finger)
- [ ] Type signature displays correctly
- [ ] Upload signature preview working
- [ ] Document viewer renders PDFs correctly
- [ ] Signature field overlays positioned correctly
- [ ] Responsive design tested on mobile/tablet/desktop
- [ ] Accessibility audit completed (WCAG 2.1 AA)

**Browser Testing Matrix:**
```
Chrome 120+:     ✓ Desktop, Mobile
Safari 17+:      ✓ Desktop, iOS
Firefox 121+:    ✓ Desktop
Edge 120+:       ✓ Desktop
Samsung Internet: ✓ Mobile
```

### Security & Compliance

- [ ] HTTPS/TLS 1.3+ enforced
- [ ] Security headers set:
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] Content-Security-Policy (CSP)
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Referrer-Policy
- [ ] CORS properly configured (no wildcard *)
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] CSRF tokens implemented
- [ ] Input validation on all endpoints
- [ ] Output encoding enabled
- [ ] Secrets not in code/logs
- [ ] Environment variables properly configured
- [ ] API keys rotated

**Security Header Test:**
```bash
curl -I https://api.redeemrocket.com/api/v1/esign/documents

# Should return:
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# Content-Security-Policy: ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
```

### Performance & Load Testing

- [ ] API latency < 500ms (p95)
- [ ] Database queries optimized
- [ ] File uploads handle 50MB in < 5 seconds
- [ ] Signature capture responsive (< 200ms)
- [ ] Concurrent user load test passed (100+ users)
- [ ] Memory usage stable
- [ ] Database connection pooling configured
- [ ] CDN cache headers configured

**Load Test Results:**
```
Metrics Target:
- 95th percentile latency: < 500ms ✓
- 99th percentile latency: < 1000ms ✓
- Error rate: < 1% ✓
- Peak throughput: 100 req/sec ✓
- Sustained load: 50 req/sec ✓
```

### Documentation & Training

- [ ] API documentation complete (Swagger/OpenAPI)
- [ ] Setup guide written for new developers
- [ ] Troubleshooting guide completed
- [ ] Admin guide for configuration
- [ ] Database schema documented
- [ ] Data flow diagrams created
- [ ] Support team trained
- [ ] Runbooks created for common issues
- [ ] Monitoring dashboards created

---

## DEPLOYMENT DAY (5 hours)

### Pre-Deployment (30 minutes)

```bash
# 1. Verify database backup
pg_dump --host=$PROD_DB_HOST \
        --username=postgres \
        --password \
        redeem_rocket > backup-$(date +%s).sql

# 2. Notify stakeholders
echo "Starting E-Signature System deployment..."

# 3. Enable maintenance mode
curl -X POST https://api.redeemrocket.com/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": true, "message": "Deploying E-Signature System"}'

# 4. Final pre-deployment tests
npm run test:e2e:pre-deployment

# 5. Check system health
curl https://api.redeemrocket.com/health
```

### Phase 1: Database Migration (45 minutes)

```bash
# 1. Apply migrations in order
cd /app/migrations
psql -h $PROD_DB_HOST -U postgres < 001_esign_documents.sql
psql -h $PROD_DB_HOST -U postgres < 002_esign_sign_requests.sql
psql -h $PROD_DB_HOST -U postgres < 003_esign_signatures.sql
psql -h $PROD_DB_HOST -U postgres < 004_esign_audit_logs.sql
psql -h $PROD_DB_HOST -U postgres < 005_esign_settings.sql
psql -h $PROD_DB_HOST -U postgres < 006_esign_templates.sql
psql -h $PROD_DB_HOST -U postgres < 007_indexes_and_triggers.sql
psql -h $PROD_DB_HOST -U postgres < 008_rls_policies.sql

# 2. Verify migration success
psql -h $PROD_DB_HOST -U postgres << EOF
SELECT COUNT(*) as table_count FROM pg_tables 
WHERE schemaname='public' AND tablename LIKE 'esign%';
EOF

# 3. Create initial esign_settings records for pilot businesses
psql -h $PROD_DB_HOST -U postgres << EOF
INSERT INTO esign_settings (business_id, is_enabled, default_expiry_days)
SELECT id, false, 30 FROM businesses WHERE status = 'active'
ON CONFLICT (business_id) DO NOTHING;
EOF

# 4. Verify data integrity
psql -h $PROD_DB_HOST -U postgres << EOF
SELECT 
  (SELECT COUNT(*) FROM esign_settings) as settings_count,
  (SELECT COUNT(*) FROM businesses WHERE status = 'active') as business_count
EOF
```

**Migration Rollback Plan:**
```bash
# If migration fails, execute rollback
psql -h $PROD_DB_HOST -U postgres << EOF
-- Drop all esign tables in reverse order
DROP TABLE IF EXISTS esign_audit_logs CASCADE;
DROP TABLE IF EXISTS esign_signature_versions CASCADE;
DROP TABLE IF EXISTS esign_signatures CASCADE;
DROP TABLE IF EXISTS esign_signature_fields CASCADE;
DROP TABLE IF EXISTS esign_sign_requests CASCADE;
DROP TABLE IF EXISTS esign_documents CASCADE;
DROP TABLE IF EXISTS esign_settings CASCADE;
EOF

echo "Rollback completed. Manual verification required."
```

### Phase 2: Application Deployment (45 minutes)

```bash
# 1. Build Docker image
docker build -f Dockerfile \
  --build-arg ENVIRONMENT=production \
  --tag esign-system:v1.0.0 \
  --tag esign-system:latest .

# 2. Push to Docker registry
docker push esign-system:v1.0.0
docker push esign-system:latest

# 3. Update Kubernetes deployment
kubectl set image deployment/api-server \
  api-server=esign-system:v1.0.0 \
  --namespace=production \
  --record

# 4. Wait for rollout
kubectl rollout status deployment/api-server \
  --namespace=production \
  --timeout=5m

# 5. Verify pods are running
kubectl get pods -n production | grep api-server
kubectl logs -n production -l app=api-server --tail=20

# 6. Health check
curl https://api.redeemrocket.com/health
```

### Phase 3: Feature Flag Enablement (15 minutes)

```bash
# 1. Enable for pilot businesses only
UPDATE esign_settings 
SET is_enabled = true 
WHERE business_id IN (
  'business-001', 
  'business-002', 
  'business-003'
);

# 2. Verify pilot setup
SELECT business_id, is_enabled, created_at 
FROM esign_settings 
WHERE is_enabled = true;

# 3. Create monitoring alerts
curl -X POST https://monitoring.redeemrocket.com/api/alerts \
  -H "Authorization: Bearer $MONITORING_TOKEN" \
  -d '{
    "alert_name": "esign_api_errors",
    "condition": "error_rate > 0.01",
    "severity": "critical"
  }'

# 4. Disable maintenance mode
curl -X POST https://api.redeemrocket.com/admin/maintenance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"enabled": false}'
```

### Phase 4: Smoke Testing (15 minutes)

```bash
# 1. Test document upload
RESPONSE=$(curl -X POST https://api.redeemrocket.com/api/v1/esign/documents \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -F "file=@test-document.pdf" \
  -F 'title=Smoke Test Document' \
  -F 'documentType=agreement' \
  -w "%{http_code}")

if [[ $RESPONSE == *"201"* ]]; then
  echo "✓ Document upload successful"
else
  echo "✗ Document upload failed: $RESPONSE"
  exit 1
fi

# 2. Test sign request creation
SIGN_RESPONSE=$(curl -X POST \
  https://api.redeemrocket.com/api/v1/esign/documents/$DOC_ID/sign-requests \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{
    "signers": [{
      "signerEmail": "test@redeemrocket.com",
      "signerRole": "customer"
    }]
  }' \
  -w "%{http_code}")

if [[ $SIGN_RESPONSE == *"201"* ]]; then
  echo "✓ Sign request creation successful"
else
  echo "✗ Sign request creation failed: $SIGN_RESPONSE"
  exit 1
fi

# 3. Test audit trail
AUDIT_RESPONSE=$(curl -X GET \
  https://api.redeemrocket.com/api/v1/esign/documents/$DOC_ID/audit-trail \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -w "%{http_code}")

if [[ $AUDIT_RESPONSE == *"200"* ]]; then
  echo "✓ Audit trail retrieval successful"
else
  echo "✗ Audit trail retrieval failed: $AUDIT_RESPONSE"
  exit 1
fi

echo "✓ All smoke tests passed"
```

### Post-Deployment (30 minutes)

```bash
# 1. Monitor error rates
curl https://monitoring.redeemrocket.com/api/metrics \
  --data '{
    "metric": "api.error_rate",
    "tags": {"service": "esign"},
    "time_range": "last_5m"
  }'

# 2. Check database performance
psql -h $PROD_DB_HOST -U postgres << EOF
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%esign%' 
ORDER BY mean_exec_time DESC 
LIMIT 5;
EOF

# 3. Verify email delivery
echo "Checking recent email deliveries..."
curl https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  --data-urlencode 'limit=10'

# 4. Create incident log entry
curl -X POST https://incident.redeemrocket.com/api/logs \
  -H "Authorization: Bearer $INCIDENT_TOKEN" \
  -d '{
    "title": "E-Signature System Deployment",
    "status": "completed",
    "component": "esign",
    "message": "E-Signature feature deployed successfully for pilot businesses",
    "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
  }'

# 5. Notify stakeholders of success
echo "E-Signature System deployment completed successfully!"
```

---

## PRODUCTION OPERATIONS

### Daily Monitoring

**8 AM - Daily Health Check:**
```bash
#!/bin/bash
# daily-health-check.sh

# 1. Check API availability
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  https://api.redeemrocket.com/api/v1/esign/documents)
if [ $API_STATUS -ne 200 ]; then
  alert "E-Signature API returning $API_STATUS status"
fi

# 2. Monitor database connections
psql -h $PROD_DB_HOST -U postgres << EOF | check_threshold
SELECT count(*) as active_connections FROM pg_stat_activity 
WHERE datname = 'redeem_rocket';
EOF

# 3. Check pending documents
psql -h $PROD_DB_HOST -U postgres << EOF | log_metric
SELECT count(*) as pending_docs FROM esign_documents 
WHERE status = 'pending' AND expires_at > NOW();
EOF

# 4. Verify email delivery success rate
DELIVERY_RATE=$(curl -s https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  | jq '.deliveries_count / .emails_count * 100')
echo "Email delivery rate: $DELIVERY_RATE%"

# 5. Check audit log storage
psql -h $PROD_DB_HOST -U postgres << EOF
SELECT pg_size_pretty(pg_total_relation_size('esign_audit_logs')) as size;
EOF
```

### Weekly Operations Review

**Every Monday - Operations Meeting:**

1. **Performance Metrics Review**
   - API latency (p50, p95, p99)
   - Error rates and top error types
   - Document processing times
   - Email delivery rates

2. **System Health**
   - Database performance
   - Storage usage
   - Backup status
   - Security alerts

3. **User Feedback**
   - Support tickets
   - Feature requests
   - Bug reports
   - User satisfaction

4. **Capacity Planning**
   - Current usage trends
   - Projected growth
   - Storage capacity forecast
   - Database scaling needs

### Monthly Maintenance

**First Friday of Month:**

```bash
#!/bin/bash
# monthly-maintenance.sh

# 1. Analyze and vacuum database
psql -h $PROD_DB_HOST -U postgres << EOF
ANALYZE;
VACUUM (ANALYZE, VERBOSE);
EOF

# 2. Update statistics
psql -h $PROD_DB_HOST -U postgres << EOF
REINDEX TABLE CONCURRENTLY esign_documents;
REINDEX TABLE CONCURRENTLY esign_sign_requests;
REINDEX TABLE CONCURRENTLY esign_signatures;
EOF

# 3. Archive old audit logs (> 30 days)
psql -h $PROD_DB_HOST -U postgres << EOF
INSERT INTO esign_audit_logs_archive 
SELECT * FROM esign_audit_logs 
WHERE created_at < NOW() - INTERVAL '30 days';

DELETE FROM esign_audit_logs 
WHERE created_at < NOW() - INTERVAL '30 days';
EOF

# 4. Update expiration status for old documents
psql -h $PROD_DB_HOST -U postgres << EOF
UPDATE esign_documents 
SET status = 'expired' 
WHERE status IN ('pending', 'in_progress') 
AND expires_at < NOW();
EOF

# 5. Run compliance report
curl -X POST https://api.redeemrocket.com/admin/reports/compliance \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "start_date": "'$(date -d 'last month' +%Y-%m-01)'",
    "end_date": "'$(date +%Y-%m-01)'",
    "format": "pdf"
  }'

# 6. Security patch check
npm audit
# If vulnerabilities found, schedule update
```

### Quarterly Disaster Recovery Test

**Every 3 months - Friday afternoon:**

```bash
#!/bin/bash
# disaster-recovery-test.sh

echo "Starting Disaster Recovery Test..."

# 1. Create test database from backup
pg_restore --host=$TEST_DB_HOST \
           --username=postgres \
           --password \
           --create \
           ./backup-latest.sql

# 2. Verify all tables exist
TABLES=$(psql -h $TEST_DB_HOST -U postgres redeem_rocket -t -c \
  "SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'esign%'")
if [ "$TABLES" -eq "8" ]; then
  echo "✓ All tables restored"
else
  echo "✗ Only $TABLES tables found, expected 8"
  exit 1
fi

# 3. Test recovery data integrity
psql -h $TEST_DB_HOST -U postgres redeem_rocket << EOF
-- Verify document counts
SELECT COUNT(*) as total_documents FROM esign_documents;

-- Verify signature counts
SELECT COUNT(*) as total_signatures FROM esign_signatures;

-- Verify no orphaned data
SELECT COUNT(*) as orphaned_signatures 
FROM esign_signatures s 
WHERE NOT EXISTS (
  SELECT 1 FROM esign_sign_requests sr WHERE sr.id = s.sign_request_id
);
EOF

# 4. Test API functionality on recovered database
curl -X GET "https://test-api.redeemrocket.com/api/v1/esign/documents" \
  -H "Authorization: Bearer $TEST_TOKEN"

# 5. Generate DR test report
cat > dr-test-report.txt << EOF
Disaster Recovery Test - $(date)

✓ Database restored successfully
✓ All tables verified
✓ Data integrity check passed
✓ API endpoints functional
✓ No data loss detected

Recovery Time Objective (RTO): < 2 hours
Recovery Point Objective (RPO): < 1 hour
EOF

echo "✓ Disaster Recovery Test completed successfully"
```

---

## MONITORING DASHBOARD SETUP

### Key Metrics to Track

```yaml
E-Signature System Metrics:
  Document Operations:
    - documents_uploaded_total
    - documents_completed_total
    - documents_declined_total
    - documents_expired_total
    - avg_signing_time_seconds
    - document_completion_rate_percentage

  API Performance:
    - api_request_duration_ms (histogram)
    - api_error_rate_percentage
    - api_requests_per_second
    - api_response_time_p95
    - api_response_time_p99

  Email & Notifications:
    - emails_sent_total
    - email_delivery_rate_percentage
    - email_bounces_total
    - reminder_emails_sent_total

  Security:
    - failed_signature_validations_total
    - unauthorized_access_attempts_total
    - document_download_attempts_total
    - audit_log_entries_total

  System Health:
    - database_connection_count
    - database_query_time_ms
    - storage_used_bytes
    - file_upload_time_seconds
```

### Grafana Dashboard Template

```json
{
  "dashboard": {
    "title": "E-Signature System Monitoring",
    "panels": [
      {
        "title": "Documents Uploaded (Daily)",
        "targets": [
          {
            "expr": "increase(documents_uploaded_total[1d])"
          }
        ]
      },
      {
        "title": "Document Completion Rate",
        "targets": [
          {
            "expr": "documents_completed_total / documents_uploaded_total * 100"
          }
        ]
      },
      {
        "title": "API Latency (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, api_request_duration_ms)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "api_error_rate_percentage"
          }
        ]
      },
      {
        "title": "Email Delivery Rate",
        "targets": [
          {
            "expr": "email_delivery_rate_percentage"
          }
        ]
      }
    ]
  }
}
```

---

## ROLLBACK PROCEDURE

**If critical issues occur post-deployment:**

```bash
#!/bin/bash
# rollback.sh

echo "Initiating E-Signature System rollback..."

# 1. Disable feature flag
UPDATE esign_settings SET is_enabled = false;

# 2. Revert application code
kubectl rollout undo deployment/api-server --namespace=production

# 3. Monitor rollback
kubectl rollout status deployment/api-server \
  --namespace=production \
  --timeout=5m

# 4. Verify old version running
curl https://api.redeemrocket.com/api/v1/health

# 5. Keep database schema
# DO NOT DROP TABLES - they can be useful for analysis
# Run migration in reverse if absolutely necessary

# 6. Notify stakeholders
echo "Rollback completed. Manual investigation required."

# 7. Create incident report
echo "Rollback completed at $(date)" >> rollback-log.txt
```

---

## SUPPORT & ESCALATION

### Tier 1 Support (Frontline)
- Account setup and basic questions
- Email notification troubleshooting
- Document upload help
- Browser/device compatibility

### Tier 2 Support (Technical)
- API integration issues
- Performance problems
- Permission/access issues
- Database connectivity

### Tier 3 Support (Engineering)
- Emergency system issues
- Security incidents
- Database corruption
- Complete system failures

**On-Call Schedule:**
- Week 1: Engineer 1
- Week 2: Engineer 2
- Week 3: Engineer 3
- Week 4: Engineer 4

---

**Deployment Completed:** $(date)  
**Version:** 1.0.0  
**Status:** Production
