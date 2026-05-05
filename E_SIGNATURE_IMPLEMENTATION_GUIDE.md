# E-Signature System - Implementation Guide
## Quick Reference for Engineers

---

## QUICK START SETUP

### 1. Environment Configuration

```bash
# .env.local
ESIGN_STORAGE_BUCKET=esign-documents
ESIGN_MAX_FILE_SIZE_MB=50
ESIGN_DEFAULT_EXPIRY_DAYS=30

# Timestamp Authority
TSA_URL=http://timestamp.authority.com/tsa
TSA_TIMEOUT_MS=30000

# Encryption Keys (via AWS KMS or Supabase Vault)
ESIGN_ENCRYPTION_KEY_ID=esign-key-v1
ESIGN_ENCRYPTION_ALGORITHM=AES-256-GCM

# Compliance
ESIGN_COMPLIANCE_STANDARD=esign_act
ESIGN_SIGNATURE_RETENTION_DAYS=3650

# Feature Flags
FEATURE_ESIGN_ENABLED=true
FEATURE_PARALLEL_SIGNING=false
FEATURE_BIOMETRIC=false
```

### 2. Database Setup

```bash
# Run migrations in order:
1. psql -f migrations/001_esign_documents.sql
2. psql -f migrations/002_esign_sign_requests.sql
3. psql -f migrations/003_esign_signatures.sql
4. psql -f migrations/004_esign_audit_logs.sql
5. psql -f migrations/005_esign_settings.sql

# Verify with:
psql -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'esign%';"
```

### 3. File Storage Setup

```bash
# Create Supabase storage buckets:
supabase storage create-bucket esign-documents --public=false

# Create folder structure:
gsutil -m mkdir -p \
  gs://esign-documents/documents/ \
  gs://esign-documents/signatures/ \
  gs://esign-documents/templates/ \
  gs://esign-documents/compliance/
```

---

## CORE MODULES BREAKDOWN

### Module 1: Document Service

**File:** `src/services/esign/documentService.ts`

```typescript
class DocumentService {
  // Core methods
  async createDocument(input: CreateDocumentInput): Promise<ESignDocument>
  async getDocument(documentId: string): Promise<ESignDocument>
  async listDocuments(businessId: string, filters): Promise<ESignDocument[]>
  async updateDocumentStatus(documentId: string, status: DocumentStatus): Promise<void>
  async deleteDocument(documentId: string): Promise<void>
  
  // File handling
  async uploadDocumentFile(file: File, documentId: string): Promise<string>
  async generateSignedUrl(documentId: string): Promise<string>
  
  // Validation
  async validateDocument(file: File): Promise<ValidationResult>
  async checkStorageQuota(businessId: string): Promise<boolean>
}
```

**Implementation Tips:**
- Validate file format and size before upload
- Generate unique storage paths using businessId/documentId
- Create document record BEFORE file upload (fail-safe)
- Use transaction wrapper for atomic operations

### Module 2: Sign Request Service

**File:** `src/services/esign/signRequestService.ts`

```typescript
class SignRequestService {
  // Core methods
  async createSignRequest(input: CreateSignRequestInput): Promise<ESignSignRequest>
  async getSignRequest(requestId: string): Promise<ESignSignRequest>
  async listSignRequests(documentId: string): Promise<ESignSignRequest[]>
  async updateRequestStatus(requestId: string, status): Promise<void>
  
  // Workflow
  async validateSigningOrder(documentId: string): Promise<boolean>
  async getNextSigner(documentId: string): Promise<ESignSignRequest | null>
  async transitionToNextSigner(documentId: string): Promise<void>
  
  // Manager assistance
  async allowManagerAssistance(requestId: string): Promise<void>
  async assisterSignature(requestId: string, assistantId: string): Promise<void>
  
  // Expiration
  async handleExpiredRequest(requestId: string): Promise<void>
  async extendExpiration(requestId: string, newExpiryDate: Date): Promise<void>
}
```

**Implementation Tips:**
- Enforce signing order validation before allowing next signer
- Track manager assistance separately from customer signature
- Use scheduled jobs for expiration handling
- Emit events for each status change

### Module 3: Signature Service

**File:** `src/services/esign/signatureService.ts`

```typescript
class SignatureService {
  // Core methods
  async addSignature(input: AddSignatureInput): Promise<ESignature>
  async getSignature(signatureId: string): Promise<ESignature>
  async validateSignature(signature: ESignature): Promise<SignatureValidationResult>
  
  // Signature capture validation
  async validateSignatureData(
    data: string,
    type: SignatureType,
    format: "svg" | "png"
  ): Promise<boolean>
  
  // Encryption
  async encryptSignatureData(data: string): Promise<string>
  async decryptSignatureData(encrypted: string): Promise<string>
  
  // Timestamp
  async requestTimestamp(signatureData: string): Promise<TimestampToken>
  async verifyTimestamp(token: TimestampToken): Promise<boolean>
  
  // Hash & Integrity
  async generateSignatureHash(data: string): Promise<string>
  async verifyIntegrity(signature: ESignature): Promise<boolean>
}
```

**Implementation Tips:**
- Always validate signature complexity before accepting
- Store both signature data AND hash for integrity checking
- Request timestamps immediately after signature capture
- Implement minimum 20-point complexity requirement

### Module 4: Audit Service

**File:** `src/services/esign/auditService.ts`

```typescript
class AuditService {
  // Logging
  async logEvent(event: AuditEventInput): Promise<void>
  
  // Retrieval
  async getAuditTrail(
    documentId: string,
    filters?: AuditFilters
  ): Promise<AuditLogEntry[]>
  
  // Export
  async exportAuditTrail(
    documentId: string,
    format: "csv" | "json" | "pdf"
  ): Promise<Buffer>
  
  // Compliance
  async generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): Promise<ComplianceReport>
}
```

**Implementation Tips:**
- Log ALL state changes immediately
- Include security context (IP, user agent, device fingerprint)
- Hash each log entry for integrity
- Implement retention policies based on compliance standards

### Module 5: Notification Service

**File:** `src/services/esign/notificationService.ts`

```typescript
class NotificationService {
  // Email notifications
  async sendSigningRequest(signRequest: ESignSignRequest): Promise<void>
  async sendReminderEmail(signRequest: ESignSignRequest): Promise<void>
  async sendCompletionNotice(document: ESignDocument): Promise<void>
  async sendDeclineNotice(signRequest: ESignSignRequest): Promise<void>
  
  // Scheduled jobs
  async sendDueReminderEmails(): Promise<void> // Daily job
  async handleExpiredDocuments(): Promise<void> // Daily job
  
  // In-app notifications
  async createInAppNotification(notification: InAppNotification): Promise<void>
}
```

**Implementation Tips:**
- Use Resend for email delivery
- Schedule reminder jobs based on esign_settings.reminderIntervalDays
- Track reminder count to prevent spam
- Use email templates for consistency

### Module 6: Feature Flag Service

**File:** `src/services/esign/featureFlagService.ts`

```typescript
class FeatureFlagService {
  async isESignEnabled(businessId: string): Promise<boolean>
  async getESignSettings(businessId: string): Promise<ESignSettings>
  async updateESignSettings(businessId: string, settings: Partial<ESignSettings>): Promise<void>
  
  // Permission checks
  async canUploadDocument(userId: string, businessId: string): Promise<boolean>
  async canCreateSignRequest(userId: string, documentId: string): Promise<boolean>
  async canEnableParallelSigning(businessId: string): Promise<boolean>
  async canEnableBiometricSigning(businessId: string): Promise<boolean>
}
```

---

## API ENDPOINT IMPLEMENTATION ORDER

### Priority 1 (Week 1)
```
POST   /api/v1/esign/documents                    - Upload document
POST   /api/v1/esign/documents/:id/sign-requests  - Create sign request
POST   /api/v1/esign/sign-requests/:id/sign       - Add signature
GET    /api/v1/esign/documents/:id                - Get document
```

### Priority 2 (Week 2)
```
GET    /api/v1/esign/documents/:id/audit-trail    - Get audit trail
POST   /api/v1/esign/sign-requests/:id/decline    - Decline document
GET    /api/v1/esign/documents/:id/download       - Download signed doc
POST   /api/v1/esign/sign-requests/:id/resend     - Resend request
```

### Priority 3 (Week 3 / Phase 2)
```
POST   /api/v1/esign/documents/:id/signature-fields - Define fields
POST   /api/v1/esign/documents/:id/sign-requests/bulk - Bulk signing
GET    /api/v1/esign/documents                     - List documents
DELETE /api/v1/esign/documents/:id                 - Delete document
```

---

## REACT COMPONENT STRUCTURE

### Component Hierarchy

```
<ESignModule>
  ├── <DocumentUpload>
  │   ├── <FileInput>
  │   ├── <DocumentMetadata>
  │   └── <UploadProgress>
  │
  ├── <SigningFlow>
  │   ├── <DocumentViewer>
  │   └── <SignatureCapture>
  │       ├── <DrawSignature>
  │       ├── <TypeSignature>
  │       └── <UploadSignature>
  │
  ├── <SignRequestManager>
  │   ├── <SignerList>
  │   ├── <SigningOrderConfig>
  │   └── <SignRequestForm>
  │
  └── <AuditTrailView>
      ├── <AuditLog>
      ├── <EventDetails>
      └── <ExportButton>
```

### Key Component Files

**DocumentUpload.tsx**
```typescript
interface DocumentUploadProps {
  onDocumentCreated: (document: ESignDocument) => void;
  businessId: string;
}

export function DocumentUpload({ onDocumentCreated, businessId }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata>({
    title: "",
    documentType: "agreement",
    expiresAt: addDays(new Date(), 30)
  });
  
  const handleUpload = async () => {
    // 1. Validate file
    const validation = await validateDocument(file);
    if (!validation.isValid) throw validation.errors;
    
    // 2. Create document record
    const document = await documentService.createDocument({
      businessId,
      title: metadata.title,
      documentType: metadata.documentType,
      expiresAt: metadata.expiresAt
    });
    
    // 3. Upload file
    const fileUrl = await documentService.uploadDocumentFile(file, document.id);
    
    // 4. Update document with file URL
    await documentService.updateDocument(document.id, { fileUrl });
    
    onDocumentCreated(document);
  };
  
  return (
    <div className="document-upload">
      <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
      <input 
        value={metadata.title}
        onChange={(e) => setMetadata({...metadata, title: e.target.value})}
        placeholder="Document Title"
      />
      <button onClick={handleUpload}>Upload</button>
    </div>
  );
}
```

**SignatureCapture.tsx**
```typescript
export function SignatureCapture({
  onComplete,
  field: ESignatureField
}: SignatureCaptureProps) {
  const [mode, setMode] = useState<"draw" | "type" | "upload">("draw");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  
  const handleSignatureComplete = async () => {
    // Validate signature
    const validation = await validateSignature(signatureData, mode);
    if (!validation.isValid) {
      alert("Signature is too simple. Please try again.");
      return;
    }
    
    // Encrypt if enabled
    const encryptedData = await encryptSignatureData(signatureData);
    
    // Request timestamp
    const timestamp = await requestTimestamp(encryptedData);
    
    onComplete({
      signatureData: encryptedData,
      signatureType: mode,
      timestampToken: timestamp
    });
  };
  
  return (
    <div className="signature-capture">
      <div className="tabs">
        <button onClick={() => setMode("draw")}>Draw</button>
        <button onClick={() => setMode("type")}>Type</button>
        <button onClick={() => setMode("upload")}>Upload</button>
      </div>
      
      {mode === "draw" && <DrawSignatureCanvas onChange={setSignatureData} />}
      {mode === "type" && <TypeSignature onChange={setSignatureData} />}
      {mode === "upload" && <UploadSignature onChange={setSignatureData} />}
      
      <button 
        onClick={handleSignatureComplete}
        disabled={!isValid}
      >
        Confirm Signature
      </button>
    </div>
  );
}
```

**AuditTrailView.tsx**
```typescript
export function AuditTrailView({ documentId }: Props) {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filters, setFilters] = useState<AuditFilters>({});
  
  useEffect(() => {
    loadAuditTrail();
  }, [filters]);
  
  const loadAuditTrail = async () => {
    const logs = await auditService.getAuditTrail(documentId, filters);
    setAuditLogs(logs);
  };
  
  const handleExport = async (format: "csv" | "json" | "pdf") => {
    const data = await auditService.exportAuditTrail(documentId, format);
    downloadFile(data, `audit-trail.${format}`);
  };
  
  return (
    <div className="audit-trail">
      <div className="filters">
        {/* Filter UI */}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Event</th>
            <th>Actor</th>
            <th>IP Address</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {auditLogs.map(log => (
            <tr key={log.id}>
              <td>{formatDate(log.timestamp)}</td>
              <td>{log.eventType}</td>
              <td>{log.actorEmail}</td>
              <td>{log.ipAddress}</td>
              <td><details>{JSON.stringify(log.changeMetadata)}</details></td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="exports">
        <button onClick={() => handleExport("csv")}>Export CSV</button>
        <button onClick={() => handleExport("json")}>Export JSON</button>
        <button onClick={() => handleExport("pdf")}>Export PDF</button>
      </div>
    </div>
  );
}
```

---

## DATABASE MIGRATION SCRIPTS

### Migration 001: Core Tables

```sql
-- migrations/001_esign_documents.sql

BEGIN;

CREATE TABLE esign_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  document_type VARCHAR(100) NOT NULL,
  
  original_filename VARCHAR(500),
  file_url TEXT NOT NULL,
  file_size_bytes INT,
  
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  signing_mode VARCHAR(50) DEFAULT 'sequential',
  total_signers INT DEFAULT 1,
  signed_count INT DEFAULT 0,
  
  expires_at TIMESTAMPTZ,
  signed_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  
  related_entity_type VARCHAR(100),
  related_entity_id UUID,
  
  is_encrypted BOOLEAN DEFAULT false,
  signature_algorithm VARCHAR(50) DEFAULT 'SHA-256-RSA',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT valid_status CHECK (status IN ('draft', 'pending', 'in_progress', 'signed', 'declined', 'expired', 'archived')),
  CONSTRAINT valid_signing_mode CHECK (signing_mode IN ('sequential', 'parallel')),
  
  INDEX (business_id),
  INDEX (owner_id),
  INDEX (status),
  INDEX (created_at DESC),
  INDEX (expires_at)
);

ALTER TABLE esign_documents ENABLE ROW LEVEL SECURITY;

-- Policies implemented in specification

COMMIT;
```

---

## SECURITY CHECKLIST

### Before Production

- [ ] All API endpoints validate user permissions
- [ ] RLS policies enabled on all tables
- [ ] Encryption enabled for signature data
- [ ] Rate limiting configured (100 req/min standard, 1000 req/min admin)
- [ ] CORS configured for trusted domains only
- [ ] HTTPS/TLS 1.3+ enforced
- [ ] Security headers set (HSTS, CSP, X-Frame-Options)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] File upload validation (type, size, format)
- [ ] Audit logging enabled for all operations
- [ ] Error handling doesn't leak sensitive information
- [ ] Third-party dependencies audited for vulnerabilities
- [ ] Encryption keys rotated regularly
- [ ] Backup and disaster recovery tested

---

## TESTING CHECKLIST

### Unit Tests (each module)
- [ ] Signature validation logic
- [ ] Document status transitions
- [ ] Encryption/decryption
- [ ] Permission checks
- [ ] Audit logging

### Integration Tests
- [ ] Complete signing workflow
- [ ] Multi-signer sequential flow
- [ ] Document expiration handling
- [ ] Notification delivery
- [ ] Audit trail generation

### E2E Tests
- [ ] Full merchant onboarding with signature
- [ ] Deal approval workflow
- [ ] Customer order confirmation
- [ ] Manager assistance flow

### Security Tests
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting effectiveness
- [ ] Unauthorized access prevention

---

## MONITORING & ALERTS

### Key Metrics to Track

```
Document Processing:
- Documents uploaded per day
- Average upload time
- Average signing time
- Document completion rate (%)

Error Rates:
- Signature validation failures
- Email delivery failures
- Timestamp request failures
- Storage failures

Performance:
- API response time (p50, p95, p99)
- Database query time
- File upload/download speed
- Email delivery latency

Security:
- Failed validation attempts
- Unauthorized access attempts
- Failed RLS policy checks
- Anomalous signature patterns

Compliance:
- Audit trail entries per day
- Export requests
- Signature verification success rate
```

### Alert Thresholds

```
CRITICAL:
- API error rate > 5%
- Document upload failure rate > 2%
- Email delivery failure rate > 10%
- Database connection pool exhausted

WARNING:
- API response time p95 > 1000ms
- Document upload time > 5 seconds
- Email delivery latency > 60 seconds
- Audit log processing lag > 5 minutes
```

---

## COMMON TASKS

### How to: Enable E-Signature for a Business

```typescript
// Admin endpoint
async function enableESignForBusiness(businessId: string) {
  // 1. Create esign_settings record
  const settings = await db.esign_settings.create({
    business_id: businessId,
    is_enabled: true,
    default_expiry_days: 30,
    max_signers_per_document: 10,
    max_document_size_mb: 50,
    compliance_standard: 'esign_act'
  });
  
  // 2. Log to audit
  await auditService.logEvent({
    businessId,
    eventType: 'settings_changed',
    actorId: adminUserId,
    changeDescription: 'E-Signature feature enabled',
    changeMetadata: { enabled: true }
  });
  
  // 3. Send notification to business owner
  await notificationService.sendFeatureEnabledEmail(businessId);
}
```

### How to: Handle Document Expiration

```typescript
// Scheduled job (run daily)
async function handleExpiredDocuments() {
  // 1. Find documents that expired
  const expiredDocs = await db.esign_documents.findMany({
    where: {
      expires_at: { lt: new Date() },
      status: { in: ['pending', 'in_progress'] }
    }
  });
  
  // 2. Update document status
  for (const doc of expiredDocs) {
    await documentService.updateDocumentStatus(doc.id, 'expired');
    
    // 3. Update all pending sign requests
    const requests = await db.esign_sign_requests.findMany({
      where: { document_id: doc.id, status: 'pending' }
    });
    
    for (const request of requests) {
      await signRequestService.updateRequestStatus(request.id, 'expired');
      
      // 4. Send expiration email
      await notificationService.sendDocumentExpiredEmail(request);
    }
  }
}
```

### How to: Send Signing Reminders

```typescript
// Scheduled job (run daily at 9 AM)
async function sendSigningReminders() {
  // 1. Find requests due for reminder
  const dueDates = await db.esign_sign_requests.findMany({
    where: {
      status: 'pending',
      expires_at: { gt: new Date() }, // Not already expired
      reminder_count: { lt: max_reminders },
      last_reminder_sent_at: {
        OR: [
          { equals: null }, // Never sent
          { lt: subtractDays(new Date(), settings.reminderIntervalDays) }
        ]
      }
    }
  });
  
  // 2. Send reminder emails
  for (const request of dueDates) {
    await notificationService.sendReminderEmail(request);
    
    // 3. Update reminder tracking
    await db.esign_sign_requests.update({
      where: { id: request.id },
      data: {
        last_reminder_sent_at: new Date(),
        reminder_count: { increment: 1 }
      }
    });
  }
}
```

---

## TROUBLESHOOTING GUIDE

### Issue: Signature not being saved

**Checklist:**
1. Verify signature data is not empty/blank
2. Check signature validation passes complexity test
3. Verify request ID is valid and hasn't expired
4. Check database write permissions
5. Review error logs for database errors
6. Verify RLS policy allows write

### Issue: Email not being sent

**Checklist:**
1. Verify Resend API key is configured
2. Check email template exists
3. Verify recipient email is valid
4. Check rate limiting hasn't been hit
5. Review Resend delivery logs
6. Verify send_email_on_sent setting is enabled

### Issue: Signature verification failing

**Checklist:**
1. Verify signature hash calculation method
2. Check timestamp token is valid
3. Verify certificate chain
4. Check document hasn't been tampered with
5. Review encryption key configuration
6. Check timezone handling for timestamp

### Issue: Audit trail not showing events

**Checklist:**
1. Verify audit logging is enabled
2. Check database permissions
3. Verify audit service is being called
4. Check RLS policy for audit table
5. Review error logs for audit failures
6. Verify event type is in allowed enum

---

## PERFORMANCE OPTIMIZATION TIPS

1. **Database Indexing:** Always query by (business_id, status) for documents
2. **Caching:** Cache esign_settings for 1 hour
3. **Batch Operations:** Use bulk insert for audit logs
4. **File Storage:** Use CDN for signed document downloads
5. **Email Queuing:** Queue emails with retries instead of synchronous sending
6. **Signature Validation:** Implement client-side validation before API call
7. **Query Optimization:** Use pagination for audit trail queries

---

**Document Version:** 1.0  
**Last Updated:** May 2026
