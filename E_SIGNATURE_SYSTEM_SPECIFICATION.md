# Comprehensive E-Signature System Specification
## Redeem Rocket Multi-Tenant SaaS Platform

**Version:** 1.0  
**Date:** May 2026  
**Status:** Technical Specification - Ready for Implementation  
**Estimated Timeline:** Phase 1 MVP (3 weeks) + Phase 2 (2 weeks)

---

## TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Database Schema](#database-schema)
4. [Data Models & Enumerations](#data-models--enumerations)
5. [File Storage Strategy](#file-storage-strategy)
6. [Signature Capture Implementation](#signature-capture-implementation)
7. [API Design & Specifications](#api-design--specifications)
8. [Workflow State Management](#workflow-state-management)
9. [Feature Flag System](#feature-flag-system)
10. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
11. [Security & Compliance](#security--compliance)
12. [Notification System](#notification-system)
13. [Use Case Integration](#use-case-integration)
14. [Audit Trail & Logging](#audit-trail--logging)
15. [Testing Strategy](#testing-strategy)
16. [Deployment & Scaling](#deployment--scaling)
17. [Implementation Checklist](#implementation-checklist)

---

## EXECUTIVE SUMMARY

The E-Signature System enables Redeem Rocket to capture legally binding digital signatures across multiple business processes. This system serves as the foundation for contract signing, merchant onboarding, manager approvals, and customer agreements within a multi-tenant SaaS architecture.

**Key Features:**
- Multi-tenant document management with business-level isolation
- Multi-party sequential/parallel signing workflows
- Three signature capture methods (draw, type, upload)
- Comprehensive audit trail and compliance logging
- Email-based workflow notifications
- Role-based access control with manager assistance flows
- Feature flag-based enablement per business
- ESIGN Act and eIDAS compliance readiness

**Success Metrics:**
- Document completion rate: >95%
- Average signature time: <5 minutes
- API response time: <500ms for document operations
- Audit trail completeness: 100%
- Compliance audit pass rate: 100%

---

## SYSTEM ARCHITECTURE OVERVIEW

### High-Level Architecture Diagram (Text Description)

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Document Upload  │  │ Signature Canvas │  │ Admin Audit  │ │
│  │   Component      │  │   (Draw/Type)    │  │   Trail      │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (REST)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ POST /documents                                          │  │
│  │ POST /documents/{id}/sign-requests                       │  │
│  │ POST /sign-requests/{id}/sign                            │  │
│  │ GET  /documents/{id}                                     │  │
│  │ GET  /documents/{id}/audit-trail                         │  │
│  │ DELETE /documents/{id}                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Signature    │  │ Workflow     │  │ Feature Flag         │ │
│  │ Validation   │  │ Orchestration│  │ Check Middleware     │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Document     │  │ Notification │  │ Compliance/Audit     │ │
│  │ Templating   │  │ Service      │  │ Logger               │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   DATA PERSISTENCE LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ PostgreSQL   │  │ File Storage │  │ Document Signing     │ │
│  │ (Supabase)   │  │ (S3/Storage) │  │ State Machine        │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               EXTERNAL INTEGRATIONS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Email Service│  │ Timestamp    │  │ Encryption/Signing   │ │
│  │ (Resend)     │  │ Authority    │  │ Service              │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Points with Existing Systems

- **Orders Module:** Customer signs receipt/delivery confirmation
- **Coupons System:** User confirms terms before redemption
- **Auctions Module:** Manager approves auction agreements
- **Bookings System:** Customer signs booking confirmation
- **Team Management:** Manager assists customer signing
- **Email Campaigns:** Notification system via Resend
- **Audit Logs:** Integrated with existing compliance tracking

---

## DATABASE SCHEMA

### 1. DOCUMENTS TABLE

Stores document metadata and lifecycle state.

```sql
CREATE TABLE IF NOT EXISTS esign_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Document Metadata
  title VARCHAR(500) NOT NULL,
  description TEXT,
  document_type VARCHAR(100) NOT NULL, -- 'contract', 'agreement', 'approval', 'receipt'
  
  -- File Storage
  original_filename VARCHAR(500),
  file_url TEXT NOT NULL, -- S3/Storage URL for original document
  file_size_bytes INT,
  file_mime_type VARCHAR(100),
  
  -- Document Status Tracking
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
    CONSTRAINT valid_document_status CHECK (status IN (
      'draft', 'pending', 'in_progress', 'signed', 
      'declined', 'expired', 'archived'
    )),
  
  -- Multi-Party Signing Configuration
  signing_mode VARCHAR(50) DEFAULT 'sequential',
    CONSTRAINT valid_signing_mode CHECK (signing_mode IN ('sequential', 'parallel')),
  total_signers INT DEFAULT 1,
  signed_count INT DEFAULT 0,
  
  -- Expiration & Lifecycle
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  
  -- Document Context (Link to business entities)
  related_entity_type VARCHAR(100), -- 'order', 'coupon', 'auction', 'booking', 'merchant_onboarding'
  related_entity_id UUID,
  
  -- Security & Encryption
  is_encrypted BOOLEAN DEFAULT false,
  encryption_key_id VARCHAR(100),
  signature_algorithm VARCHAR(50) DEFAULT 'SHA-256-RSA',
  
  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(business_id, id),
  INDEX (business_id, status),
  INDEX (business_id, created_at DESC),
  INDEX (owner_id),
  INDEX (related_entity_type, related_entity_id)
);

-- RLS Policy
ALTER TABLE esign_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document owners and signers can view"
  ON esign_documents FOR SELECT
  USING (
    owner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM esign_sign_requests esr
      WHERE esr.document_id = esign_documents.id
      AND esr.signer_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM biz_users bu
      WHERE bu.user_id = auth.uid()
      AND bu.business_id = esign_documents.business_id
      AND bu.role IN ('admin', 'owner', 'manager')
    )
  );

CREATE POLICY "Document owners can manage"
  ON esign_documents FOR ALL
  USING (owner_id = auth.uid());
```

### 2. SIGN REQUESTS TABLE

Tracks individual signing requests and their status.

```sql
CREATE TABLE IF NOT EXISTS esign_sign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES esign_documents(id) ON DELETE CASCADE,
  
  -- Signer Information
  signer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  signer_email TEXT NOT NULL,
  signer_role VARCHAR(100), -- 'customer', 'merchant', 'manager', 'admin'
  
  -- Request Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
    CONSTRAINT valid_request_status CHECK (status IN (
      'pending', 'viewed', 'in_progress', 'signed', 
      'declined', 'expired', 'resent'
    )),
  
  -- Signing Order
  signing_order INT DEFAULT 1, -- For sequential signing
  requires_witness BOOLEAN DEFAULT false,
  witness_id UUID REFERENCES auth.users(id),
  
  -- Manager Assistance
  can_be_signed_by_manager BOOLEAN DEFAULT false,
  assisting_manager_id UUID REFERENCES auth.users(id),
  
  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Decline Reason
  decline_reason TEXT,
  decline_details JSONB,
  
  -- Notification Tracking
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INT DEFAULT 0,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(document_id, signer_id),
  INDEX (business_id, status),
  INDEX (signer_id, status),
  INDEX (document_id, signing_order),
  INDEX (expires_at)
);

ALTER TABLE esign_sign_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signers can view own requests"
  ON esign_sign_requests FOR SELECT
  USING (
    signer_id = auth.uid() OR
    assisting_manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM esign_documents ed
      WHERE ed.id = esign_sign_requests.document_id
      AND ed.owner_id = auth.uid()
    )
  );
```

### 3. SIGNATURE FIELDS TABLE

Defines where signatures should be placed on documents.

```sql
CREATE TABLE IF NOT EXISTS esign_signature_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES esign_documents(id) ON DELETE CASCADE,
  
  -- Field Position
  page_number INT NOT NULL DEFAULT 1,
  x_position NUMERIC(7,2) NOT NULL, -- Percentage (0-100)
  y_position NUMERIC(7,2) NOT NULL, -- Percentage (0-100)
  width NUMERIC(7,2) DEFAULT 20,
  height NUMERIC(7,2) DEFAULT 10,
  
  -- Field Configuration
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) DEFAULT 'signature',
    CONSTRAINT valid_field_type CHECK (field_type IN (
      'signature', 'initials', 'date', 'text', 'checkbox'
    )),
  required BOOLEAN DEFAULT true,
  tooltip_text TEXT,
  
  -- Signer Assignment
  assigned_signer_id UUID REFERENCES auth.users(id),
  
  -- Styling
  background_color VARCHAR(7) DEFAULT '#FFFFFF',
  border_color VARCHAR(7) DEFAULT '#0000FF',
  border_width INT DEFAULT 1,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  INDEX (document_id),
  INDEX (page_number)
);

ALTER TABLE esign_signature_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Document owners can manage signature fields"
  ON esign_signature_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM esign_documents ed
      WHERE ed.id = esign_signature_fields.document_id
      AND ed.owner_id = auth.uid()
    )
  );
```

### 4. SIGNATURES TABLE

Stores actual signature data and metadata.

```sql
CREATE TABLE IF NOT EXISTS esign_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sign_request_id UUID NOT NULL REFERENCES esign_sign_requests(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES esign_documents(id) ON DELETE CASCADE,
  
  -- Signature Data
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  signature_data TEXT NOT NULL, -- SVG, PNG, or JWT-signed token
  signature_format VARCHAR(50) NOT NULL,
    CONSTRAINT valid_signature_format CHECK (signature_format IN (
      'svg', 'png', 'image', 'jwt_token'
    )),
  
  -- Signature Metadata
  signature_type VARCHAR(50) NOT NULL,
    CONSTRAINT valid_signature_type CHECK (signature_type IN (
      'drawn', 'typed', 'uploaded', 'biometric'
    )),
  
  -- Security & Compliance
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(500),
  geolocation JSONB, -- {latitude, longitude, country}
  
  -- Timestamp Authority
  timestamp_token TEXT, -- JWT from timestamp authority
  timestamp_provider VARCHAR(100), -- 'rfc3161', 'custom'
  
  -- Signature Validation
  signature_hash VARCHAR(500), -- SHA-256 hash of signature
  certificate_id VARCHAR(500),
  is_valid BOOLEAN DEFAULT true,
  validation_error TEXT,
  
  -- Biometric (Future)
  biometric_type VARCHAR(50), -- 'fingerprint', 'face_recognition', 'voice'
  biometric_data TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,
  
  INDEX (sign_request_id),
  INDEX (document_id),
  INDEX (user_id),
  INDEX (created_at DESC)
);

ALTER TABLE esign_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can view signatures"
  ON esign_signatures FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM esign_documents ed
      JOIN esign_sign_requests esr ON ed.id = esr.document_id
      WHERE ed.id = esign_signatures.document_id
      AND (ed.owner_id = auth.uid() OR esr.signer_id = auth.uid())
    )
  );
```

### 5. SIGNATURE VERSIONS TABLE

Audit trail and version history.

```sql
CREATE TABLE IF NOT EXISTS esign_signature_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES esign_documents(id) ON DELETE CASCADE,
  
  -- Version Information
  version_number INT NOT NULL,
  change_type VARCHAR(50), -- 'created', 'updated', 'signature_added', 'declined', 'expired'
  
  -- What Changed
  changed_by_id UUID REFERENCES auth.users(id),
  change_description TEXT,
  change_metadata JSONB,
  
  -- Document Snapshot
  document_state JSONB NOT NULL, -- Full document state at this version
  signers_snapshot JSONB NOT NULL, -- All sign requests at this version
  
  -- File Reference
  versioned_file_url TEXT,
  signed_file_url TEXT,
  
  -- Integrity Verification
  document_hash VARCHAR(500), -- SHA-256 of document content
  integrity_verified BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(document_id, version_number),
  INDEX (document_id, created_at DESC)
);

ALTER TABLE esign_signature_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can view versions"
  ON esign_signature_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM esign_documents ed
      WHERE ed.id = esign_signature_versions.document_id
      AND (ed.owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM esign_sign_requests esr
          WHERE esr.document_id = ed.id
          AND esr.signer_id = auth.uid()
        ))
    )
  );
```

### 6. ESIGN SETTINGS TABLE

Business-level configuration.

```sql
CREATE TABLE IF NOT EXISTS esign_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Feature Configuration
  is_enabled BOOLEAN DEFAULT false,
  max_signers_per_document INT DEFAULT 10,
  max_document_size_mb INT DEFAULT 50,
  max_concurrent_documents INT DEFAULT 100,
  
  -- Security Settings
  require_email_verification BOOLEAN DEFAULT true,
  require_mobile_verification BOOLEAN DEFAULT false,
  allow_manager_assistance BOOLEAN DEFAULT true,
  allow_bulk_signing BOOLEAN DEFAULT false,
  
  -- Expiration Policy
  default_expiry_days INT DEFAULT 30,
  min_expiry_days INT DEFAULT 1,
  max_expiry_days INT DEFAULT 365,
  
  -- Signing Configuration
  allow_sequential_signing BOOLEAN DEFAULT true,
  allow_parallel_signing BOOLEAN DEFAULT false,
  require_signature_witness BOOLEAN DEFAULT false,
  
  -- Notifications
  send_email_on_sent BOOLEAN DEFAULT true,
  send_email_on_signed BOOLEAN DEFAULT true,
  send_reminders BOOLEAN DEFAULT true,
  reminder_interval_days INT DEFAULT 7,
  max_reminders INT DEFAULT 3,
  
  -- Compliance
  compliance_standard VARCHAR(100), -- 'esign_act', 'eidas', 'custom'
  log_ip_addresses BOOLEAN DEFAULT true,
  log_device_info BOOLEAN DEFAULT true,
  store_signed_documents_encrypted BOOLEAN DEFAULT true,
  signature_retention_days INT DEFAULT 3650, -- 10 years
  
  -- Biometric (Future)
  enable_biometric_signing BOOLEAN DEFAULT false,
  biometric_types JSONB DEFAULT '["fingerprint", "face_recognition"]'::jsonb,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(business_id)
);

ALTER TABLE esign_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage own business settings"
  ON esign_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM biz_users bu
      WHERE bu.business_id = esign_settings.business_id
      AND bu.user_id = auth.uid()
      AND bu.role IN ('owner', 'admin')
    )
  );
```

### 7. ESIGN AUDIT LOG TABLE

Compliance-ready audit trail.

```sql
CREATE TABLE IF NOT EXISTS esign_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_id UUID REFERENCES esign_documents(id) ON DELETE SET NULL,
  
  -- Event Information
  event_type VARCHAR(100) NOT NULL,
    CONSTRAINT valid_audit_event CHECK (event_type IN (
      'document_created', 'document_uploaded', 'sign_request_sent',
      'signature_added', 'document_declined', 'document_expired',
      'document_completed', 'settings_changed', 'audit_accessed'
    )),
  
  -- Actor Information
  actor_id UUID REFERENCES auth.users(id),
  actor_role VARCHAR(50),
  actor_ip_address INET,
  
  -- Change Details
  change_description TEXT,
  change_metadata JSONB,
  
  -- Security Context
  session_id VARCHAR(500),
  request_id VARCHAR(500),
  
  -- Compliance
  is_compliance_relevant BOOLEAN DEFAULT true,
  retention_required_until DATE,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  INDEX (business_id, created_at DESC),
  INDEX (document_id),
  INDEX (event_type),
  INDEX (actor_id)
);

ALTER TABLE esign_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON esign_audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM biz_users bu
      WHERE bu.business_id = esign_audit_logs.business_id
      AND bu.user_id = auth.uid()
      AND bu.role IN ('owner', 'admin')
    )
  );
```

### 8. TEMPLATE DOCUMENTS TABLE (Phase 2)

```sql
CREATE TABLE IF NOT EXISTS esign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Template Metadata
  template_name VARCHAR(500) NOT NULL,
  template_description TEXT,
  template_category VARCHAR(100), -- 'onboarding', 'order', 'coupon', 'booking'
  
  -- Template Configuration
  base_document_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  
  -- Pre-configured Fields
  signature_fields JSONB NOT NULL, -- Array of signature field definitions
  default_signers JSONB, -- Array of default signer roles
  default_expiry_days INT DEFAULT 30,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  
  UNIQUE(business_id, template_name),
  INDEX (business_id, template_category)
);
```

---

## DATA MODELS & ENUMERATIONS

### Document Status Enum

```typescript
enum DocumentStatus {
  DRAFT = "draft",                    // Initial state, can be edited
  PENDING = "pending",                // Sent to signers, awaiting signatures
  IN_PROGRESS = "in_progress",        // At least one signature collected
  SIGNED = "signed",                  // All signers have signed
  DECLINED = "declined",              // Signer declined to sign
  EXPIRED = "expired",                // Expiration date passed
  ARCHIVED = "archived"               // Removed from active workflow
}
```

### Sign Request Status Enum

```typescript
enum SignRequestStatus {
  PENDING = "pending",                // Awaiting signer action
  VIEWED = "viewed",                  // Signer has viewed document
  IN_PROGRESS = "in_progress",        // Signer has started signing
  SIGNED = "signed",                  // Signer has completed signature
  DECLINED = "declined",              // Signer declined to sign
  EXPIRED = "expired",                // Request expired
  RESENT = "resent"                   // Reminder sent
}
```

### Signing Mode Enum

```typescript
enum SigningMode {
  SEQUENTIAL = "sequential",          // Signers must sign in order
  PARALLEL = "parallel"               // All signers sign simultaneously
}
```

### Signature Type Enum

```typescript
enum SignatureType {
  DRAWN = "drawn",                    // Canvas-based signature
  TYPED = "typed",                    // Font-rendered text signature
  UPLOADED = "uploaded",              // Image file upload
  BIOMETRIC = "biometric"             // Future: fingerprint/face
}
```

### Role-Based Signer Types

```typescript
enum SignerRole {
  CUSTOMER = "customer",              // End customer/user
  MERCHANT = "merchant",              // Business merchant
  MANAGER = "manager",                // Team manager
  ADMIN = "admin",                    // System administrator
  WITNESS = "witness"                 // Optional witness
}
```

### Document Type Enum

```typescript
enum DocumentType {
  CONTRACT = "contract",              // Legal contract
  AGREEMENT = "agreement",            // Service agreement
  APPROVAL = "approval",              // Approval request
  RECEIPT = "receipt",                // Transaction receipt
  CONFIRMATION = "confirmation",      // Order/booking confirmation
  TERM_AND_CONDITIONS = "terms"       // T&C acceptance
}
```

### Data Model Interfaces

```typescript
interface ESignDocument {
  id: string;
  businessId: string;
  ownerId: string;
  title: string;
  description?: string;
  documentType: DocumentType;
  originalFilename: string;
  fileUrl: string;
  fileSizeBytes: number;
  fileMimeType: string;
  status: DocumentStatus;
  signingMode: SigningMode;
  totalSigners: number;
  signedCount: number;
  expiresAt?: Date;
  signedAt?: Date;
  declinedAt?: Date;
  relatedEntityType?: string;
  relatedEntityId?: string;
  isEncrypted: boolean;
  signatureAlgorithm: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ESignSignRequest {
  id: string;
  businessId: string;
  documentId: string;
  signerId: string;
  signerEmail: string;
  signerRole: SignerRole;
  status: SignRequestStatus;
  signingOrder: number;
  requiresWitness: boolean;
  witnessId?: string;
  canBeSignedByManager: boolean;
  assistingManagerId?: string;
  sentAt: Date;
  viewedAt?: Date;
  startedAt?: Date;
  signedAt?: Date;
  declinedAt?: Date;
  expiresAt?: Date;
  declineReason?: string;
  declineDetails?: Record<string, any>;
  lastReminderSentAt?: Date;
  reminderCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ESignature {
  id: string;
  signRequestId: string;
  documentId: string;
  userId: string;
  signatureData: string; // SVG or base64 PNG
  signatureFormat: "svg" | "png" | "image" | "jwt_token";
  signatureType: SignatureType;
  ipAddress: string;
  userAgent: string;
  deviceFingerprint?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    country: string;
    timestamp: Date;
  };
  timestampToken?: string;
  timestampProvider?: string;
  signatureHash: string;
  certificateId?: string;
  isValid: boolean;
  validationError?: string;
  createdAt: Date;
  verifiedAt?: Date;
}

interface ESignatureField {
  id: string;
  documentId: string;
  pageNumber: number;
  xPosition: number; // 0-100 percentage
  yPosition: number; // 0-100 percentage
  width: number;
  height: number;
  fieldName: string;
  fieldType: "signature" | "initials" | "date" | "text" | "checkbox";
  required: boolean;
  tooltipText?: string;
  assignedSignerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ESignSettings {
  id: string;
  businessId: string;
  isEnabled: boolean;
  maxSignersPerDocument: number;
  maxDocumentSizeMb: number;
  maxConcurrentDocuments: number;
  requireEmailVerification: boolean;
  requireMobileVerification: boolean;
  allowManagerAssistance: boolean;
  allowBulkSigning: boolean;
  defaultExpiryDays: number;
  allowSequentialSigning: boolean;
  allowParallelSigning: boolean;
  requireSignatureWitness: boolean;
  sendEmailOnSent: boolean;
  sendEmailOnSigned: boolean;
  sendReminders: boolean;
  reminderIntervalDays: number;
  maxReminders: number;
  complianceStandard: "esign_act" | "eidas" | "custom";
  logIpAddresses: boolean;
  logDeviceInfo: boolean;
  storeSignedDocumentsEncrypted: boolean;
  signatureRetentionDays: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## FILE STORAGE STRATEGY

### Storage Architecture

**Primary Storage:** Supabase Storage (S3-compatible) or AWS S3  
**CDN:** Cloudflare CDN for signed document downloads  
**Encryption:** TLS in transit, AES-256 at rest

### Folder Structure

```
/esign-documents/
├── {businessId}/
│   ├── documents/
│   │   └── {documentId}/
│   │       ├── original/
│   │       │   └── {filename}
│   │       ├── signed/
│   │       │   └── v{versionNumber}-signed.pdf
│   │       └── versions/
│   │           ├── v1/
│   │           │   ├── document.json
│   │           │   └── signers.json
│   │           └── v2/
│   │               ├── document.json
│   │               └── signers.json
│   ├── signatures/
│   │   └── {signRequestId}/
│   │       ├── signature-data.svg
│   │       ├── signature-hash.txt
│   │       └── metadata.json
│   └── templates/
│       └── {templateId}/
│           ├── base-document.pdf
│           └── fields-config.json
└── compliance/
    └── {businessId}/
        ├── audit-logs/
        └── retention-schedule.json
```

### File Upload Strategy

```typescript
interface FileUploadConfig {
  maxFileSizeBytes: 52_428_800; // 50MB
  allowedMimeTypes: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/png",
    "image/jpeg",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ];
  encryptionAlgorithm: "AES-256-GCM";
  signatureStorageFormat: "svg" | "png"; // SVG preferred for scalability
  versioningStrategy: "numbered"; // v1, v2, v3...
  compressionEnabled: true;
  compressionAlgorithm: "gzip";
  redundancy: "cross-region"; // For critical documents
  expirationPolicy: {
    draftDocuments: 90, // days
    signedDocuments: 3650, // 10 years (compliance)
    declinedDocuments: 30 // days
  };
}
```

### Signed Document Delivery

```typescript
// Generate signed URLs with expiration
const signedUrl = await supabaseClient
  .storage
  .from('esign-documents')
  .createSignedUrl(
    `${businessId}/documents/${documentId}/signed/v1-signed.pdf`,
    3600, // 1 hour expiration
    {
      download: `${documentTitle}-signed.pdf`
    }
  );
```

### Encryption Implementation

```typescript
interface EncryptionStrategy {
  // Transit Encryption
  transportSecurityProtocol: "TLS 1.3+";
  certificatePinning: true;
  
  // At-Rest Encryption
  algorithm: "AES-256-GCM";
  keyManagement: "AWS KMS" | "Supabase Vault";
  keyRotationPolicy: "annually";
  
  // Signature Data
  signatureEncryption: {
    enabled: true;
    algorithm: "AES-256-GCM";
    keyDerivedFrom: "business_id + user_id + timestamp";
  };
  
  // Compliance
  encryptionAudit: true;
  keyAccessLogging: true;
}
```

---

## SIGNATURE CAPTURE IMPLEMENTATION

### 1. Draw Signature Component

**Technology:** HTML5 Canvas with touch support  
**Libraries:** `react-signature-canvas` or custom implementation  
**Features:**
- Multi-touch support for tablets
- Pressure sensitivity support
- Stroke smoothing algorithm
- Real-time preview
- Clear/Redo functionality

```typescript
interface SignatureCanvasConfig {
  canvasWidth: 400;
  canvasHeight: 150;
  backgroundColor: "#FFFFFF";
  strokeColor: "#000000";
  strokeWidth: 2;
  smoothingFactor: 0.8; // Bezier smoothing
  minStrokeLength: 5; // Minimum pixels to register
  pressureSensitivity: true;
  touchSupport: true;
  penSupport: true;
  
  // Validation
  minComplexity: {
    minPoints: 20; // Minimum points in signature
    minDistance: 10; // Min distance between points
  };
  
  // Export Format
  exportFormat: "svg" | "png";
  svgOutputQuality: "high"; // Vector format
  pngOutputQuality: 150; // DPI
}

// Signature Validation Logic
interface SignatureValidation {
  isValidLength(points: Point[]): boolean {
    return points.length >= this.minComplexity.minPoints;
  }
  
  isValidComplexity(points: Point[]): boolean {
    let totalDistance = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    return totalDistance > this.minComplexity.minDistance;
  }
  
  validate(points: Point[]): ValidationResult {
    return {
      isValid: this.isValidLength(points) && this.isValidComplexity(points),
      errors: [],
      complexity: this.calculateComplexity(points)
    };
  }
}
```

### 2. Type Signature Component

**Technology:** Canvas-rendered text with custom fonts  
**Fonts:** OpenType fonts for legal documents  
**Features:**
- Font selection (cursive, print, formal)
- Size adjustment
- Style options (uppercase, script)
- Placeholder preview

```typescript
interface TypedSignatureConfig {
  availableFonts: [
    { name: "Great Vibes", family: "cursive", formal: false },
    { name: "Kalam", family: "handwriting", formal: false },
    { name: "Playfair Display", family: "serif", formal: true },
    { name: "Roboto Mono", family: "monospace", formal: true }
  ];
  
  fontSizeRange: { min: 16, max: 72 };
  defaultFontSize: 48;
  
  // Rendering
  lineHeight: 1.2;
  letterSpacing: 0;
  
  // Export
  exportFormat: "svg" | "png";
  preserveFont: true;
}

// SVG generation from typed signature
function generateSignatureSvg(
  text: string,
  font: FontConfig,
  size: number
): string {
  return `
    <svg width="400" height="150" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=${font.name.replace(' ', '+')}');
        </style>
      </defs>
      <text 
        x="50%" 
        y="50%" 
        font-family="${font.family}" 
        font-size="${size}px"
        text-anchor="middle"
        dominant-baseline="central"
      >
        ${text}
      </text>
    </svg>
  `;
}
```

### 3. Upload Signature Component

**Technology:** File input with preview  
**Supported Formats:** PNG, JPG, SVG  
**Features:**
- Image preview
- Cropping tool
- Size validation
- Format conversion

```typescript
interface UploadSignatureConfig {
  allowedFormats: ["image/png", "image/jpeg", "image/svg+xml"];
  maxFileSizeMb: 5;
  minWidth: 200; // pixels
  minHeight: 100; // pixels
  
  // Processing
  convertToSvg: false; // Keep original format
  preserveAspectRatio: true;
  
  // Preview
  showPreview: true;
  previewMaxWidth: 400;
  
  // Validation
  detectBlankImage: true;
  blankImageThreshold: 0.95; // 95% white/blank
}
```

### 4. Biometric Signature (Phase 2 - Future)

```typescript
interface BiometricSignatureConfig {
  supportedBiometrics: [
    "fingerprint",
    "face_recognition",
    "voice_authentication"
  ];
  
  fallbackToTraditional: true;
  
  // Fingerprint
  fingerprint: {
    minQualityScore: 0.8;
    maxAttempts: 3;
    captureTimeout: 30; // seconds
  };
  
  // Face Recognition
  faceRecognition: {
    minConfidenceScore: 0.95;
    livelinessDetection: true;
    spoof_detection: true;
  };
}
```

### React Component Structure

```typescript
// Hook: useSignatureCapture
function useSignatureCapture() {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signatureType, setSignatureType] = useState<SignatureType | null>(null);
  const [isValid, setIsValid] = useState(false);
  
  const validateSignature = (data: string, type: SignatureType) => {
    // Validation logic
  };
  
  const clearSignature = () => {
    setSignatureData(null);
    setSignatureType(null);
    setIsValid(false);
  };
  
  return {
    signatureData,
    signatureType,
    isValid,
    setSignatureData,
    setSignatureType,
    validateSignature,
    clearSignature
  };
}

// Component: SignatureCapture
export function SignatureCapture({
  onComplete,
  field: ESignatureField
}: Props) {
  const { signatureData, setSignatureData } = useSignatureCapture();
  const [captureMode, setCaptureMode] = useState<"draw" | "type" | "upload">("draw");
  
  return (
    <div className="signature-capture-container">
      <div className="capture-mode-tabs">
        <button onClick={() => setCaptureMode("draw")}>Draw</button>
        <button onClick={() => setCaptureMode("type")}>Type</button>
        <button onClick={() => setCaptureMode("upload")}>Upload</button>
      </div>
      
      {captureMode === "draw" && <SignatureCanvas {...} />}
      {captureMode === "type" && <TypedSignature {...} />}
      {captureMode === "upload" && <UploadSignature {...} />}
      
      <div className="signature-actions">
        <button onClick={() => onComplete(signatureData)}>Confirm</button>
        <button onClick={() => clearSignature()}>Clear</button>
      </div>
    </div>
  );
}
```

---

## API DESIGN & SPECIFICATIONS

### Base URL
```
https://api.redeemrocket.com/api/v1/esign
```

### Authentication
All endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer {jwt_token}
```

### 1. Upload Document

**Endpoint:** `POST /documents`

**Request Body:**
```typescript
{
  title: string;                    // Required, max 500 chars
  description?: string;             // Optional
  documentType: DocumentType;       // Required: contract, agreement, approval, receipt
  file: File;                       // Required, max 50MB
  expiresAt?: Date;                 // Optional, default 30 days
  signingMode: SigningMode;         // Default: "sequential"
  relatedEntityType?: string;       // order, coupon, auction, booking
  relatedEntityId?: string;
}
```

**Response (201 Created):**
```typescript
{
  id: string;
  businessId: string;
  ownerId: string;
  title: string;
  status: "draft";
  fileUrl: string;
  uploadedAt: Date;
  expiresAt: Date;
  signingMode: SigningMode;
  signatureFields: [];               // Empty until configured
}
```

**Error Responses:**
- `400 Bad Request` - Validation failed
- `413 Payload Too Large` - File exceeds 50MB
- `415 Unsupported Media Type` - Invalid file format
- `403 Forbidden` - E-Signature feature disabled for business

### 2. Define Signature Fields

**Endpoint:** `POST /documents/{documentId}/signature-fields`

**Request Body:**
```typescript
{
  fields: [
    {
      pageNumber: number;           // 1-based index
      xPosition: number;            // 0-100 percentage
      yPosition: number;            // 0-100 percentage
      fieldName: string;
      fieldType: "signature" | "initials" | "date";
      required: boolean;
      assignedSignerId?: string;
    }
  ];
}
```

**Response (201 Created):**
```typescript
{
  documentId: string;
  fields: ESignatureField[];
}
```

### 3. Create Sign Request

**Endpoint:** `POST /documents/{documentId}/sign-requests`

**Request Body:**
```typescript
{
  signers: [
    {
      signerId?: string;            // User ID if known, else use email
      signerEmail: string;          // Required
      signerRole: SignerRole;       // customer, merchant, manager, admin
      signingOrder?: number;        // For sequential signing
      canBeSignedByManager?: boolean;
      requiresWitness?: boolean;
    }
  ];
  expiresAt?: Date;                 // Override document expiry
  sendEmailImmediately?: boolean;   // Default: true
}
```

**Response (201 Created):**
```typescript
{
  documentId: string;
  signRequests: [
    {
      id: string;
      signerId: string;
      signerEmail: string;
      status: "pending";
      signingOrder: number;
      sentAt: Date;
      expiresAt: Date;
    }
  ];
  emailsSent: number;
}
```

**Error Responses:**
- `400 Bad Request` - Invalid signers
- `404 Not Found` - Document not found
- `409 Conflict` - Signer already assigned
- `429 Too Many Requests` - Exceeded rate limit

### 4. Get Document

**Endpoint:** `GET /documents/{documentId}`

**Query Parameters:**
```
?includeSignRequests=true    // Include all sign requests
&includeAuditTrail=false     // Include audit trail
&includeSignatures=true      // Include actual signature data
```

**Response (200 OK):**
```typescript
{
  id: string;
  businessId: string;
  ownerId: string;
  title: string;
  status: DocumentStatus;
  fileUrl: string;
  fileSize: number;
  totalSigners: number;
  signedCount: number;
  expiresAt: Date;
  signedAt?: Date;
  
  signatureFields?: ESignatureField[];
  signRequests?: ESignRequest[];
  signatures?: ESignature[];
  auditTrail?: AuditLogEntry[];
}
```

### 5. Get Sign Request

**Endpoint:** `GET /documents/{documentId}/sign-requests/{requestId}`

**Response (200 OK):**
```typescript
{
  id: string;
  documentId: string;
  signerId: string;
  signerEmail: string;
  status: SignRequestStatus;
  signingOrder: number;
  sentAt: Date;
  viewedAt?: Date;
  startedAt?: Date;
  signedAt?: Date;
  expiresAt: Date;
  
  document: {
    title: string;
    fileUrl: string;
    signatureFields: ESignatureField[];
  };
  
  allowManagerAssistance: boolean;
  canBeSignedByManager: boolean;
  assistingManagerId?: string;
}
```

### 6. Add Signature

**Endpoint:** `POST /sign-requests/{requestId}/sign`

**Request Body:**
```typescript
{
  signatureData: string;            // SVG or base64 PNG
  signatureType: SignatureType;     // drawn, typed, uploaded
  signatureFormat: "svg" | "png";
  
  // Security Context
  ipAddress?: string;               // Auto-captured if not provided
  userAgent?: string;               // Auto-captured if not provided
  deviceFingerprint?: string;
  
  // Optional: Manager Assistance
  signedByManagerId?: string;       // If manager is assisting
  
  // Timestamp Authority
  requestTimestamp?: boolean;       // Request RFC 3161 timestamp
}
```

**Response (201 Created):**
```typescript
{
  signatureId: string;
  signRequestId: string;
  signedAt: Date;
  signatureHash: string;
  
  // Next action
  nextSignerEmail?: string;         // Sequential signing
  documentStatus: DocumentStatus;   // Updated status
  isDocumentComplete: boolean;
  
  // Download link for completed document
  downloadUrl?: string;
}
```

**Error Responses:**
- `400 Bad Request` - Invalid signature data
- `404 Not Found` - Sign request not found
- `409 Conflict` - Signature already provided
- `410 Gone` - Request expired
- `422 Unprocessable Entity` - Signature validation failed

### 7. Decline Document

**Endpoint:** `POST /sign-requests/{requestId}/decline`

**Request Body:**
```typescript
{
  declineReason: string;            // Max 500 chars
  declineDetails?: Record<string, any>;
}
```

**Response (200 OK):**
```typescript
{
  signRequestId: string;
  status: "declined";
  declinedAt: Date;
  documentStatus: "declined";
  
  // Can restart process
  canResendRequest: boolean;
}
```

### 8. Get Audit Trail

**Endpoint:** `GET /documents/{documentId}/audit-trail`

**Query Parameters:**
```
?limit=100
&offset=0
&eventType=signature_added    // Filter by event type
&startDate=2026-01-01
&endDate=2026-12-31
&exportFormat=json            // json, csv
```

**Response (200 OK):**
```typescript
{
  documentId: string;
  totalEvents: number;
  events: [
    {
      id: string;
      eventType: string;
      actorId: string;
      actorRole: string;
      actorIp: string;
      changeDescription: string;
      timestamp: Date;
      metadata: Record<string, any>;
    }
  ];
}
```

### 9. Download Signed Document

**Endpoint:** `GET /documents/{documentId}/download`

**Query Parameters:**
```
?format=pdf               // pdf, docx, original
&includeAuditTrail=false  // Append audit trail pages
&encryptionPassword=?     // Optional password protection
```

**Response (200 OK - Binary):**
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="document-signed.pdf"
- X-Signature-Hash: SHA-256 hash for verification

### 10. Resend Sign Request

**Endpoint:** `POST /sign-requests/{requestId}/resend`

**Request Body:**
```typescript
{
  message?: string;        // Custom message in email
  expiresAt?: Date;        // Extend expiration
}
```

**Response (200 OK):**
```typescript
{
  requestId: string;
  emailSent: true;
  sentAt: Date;
  reminderCount: number;
}
```

### 11. Bulk Create Sign Requests (Phase 2)

**Endpoint:** `POST /documents/{documentId}/sign-requests/bulk`

**Request Body:**
```typescript
{
  signers: [
    {
      email: string;
      role: SignerRole;
      signingOrder?: number;
    }
  ];
  expiresAt?: Date;
}
```

**Response (201 Created):**
```typescript
{
  documentId: string;
  signRequests: ESignRequest[];
  batchId: string;
  emailsSent: number;
}
```

### 12. List Documents

**Endpoint:** `GET /documents`

**Query Parameters:**
```
?status=pending           // Filter by status
&role=customer           // Filter by signer role
&limit=20
&offset=0
&sortBy=created_at
&sortOrder=desc
```

**Response (200 OK):**
```typescript
{
  documents: ESignDocument[];
  total: number;
  page: number;
  pageSize: number;
}
```

### 13. Delete Document

**Endpoint:** `DELETE /documents/{documentId}`

**Response (204 No Content)**

**Error Responses:**
- `403 Forbidden` - Not owner
- `409 Conflict` - Cannot delete signed document

### Rate Limiting

```typescript
{
  // Per minute limits
  standard_user: {
    upload_document: 10,
    create_sign_request: 20,
    add_signature: 30,
    resend_request: 5
  },
  
  admin_user: {
    upload_document: 100,
    create_sign_request: 200,
    add_signature: 300,
    resend_request: 50
  }
}
```

---

## WORKFLOW STATE MANAGEMENT

### Document Lifecycle State Machine

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DOCUMENT LIFECYCLE                          │
└─────────────────────────────────────────────────────────────────────┘

                              ┌──────────┐
                              │  DRAFT   │
                              └────┬─────┘
                                   │ uploadDocument()
                                   ▼
                              ┌──────────┐
                         ┌────│ PENDING  │────┐
                         │    └────┬─────┘    │
                         │         │         │
                         │         │         │
        allSignersSigned()│    expiresAt()   │declineDocument()
                         │         │         │
                         ▼         ▼         ▼
                    ┌────────┐ ┌─────────┐ ┌─────────┐
                    │ SIGNED │ │ EXPIRED │ │DECLINED │
                    └────────┘ └─────────┘ └────┬────┘
                         │                       │
                         │                       │resetDocument()
                         │                       ▼
                         │                  (Return to DRAFT)
                         │
                         └──────────────┐
                                        ▼
                                   ┌─────────┐
                                   │ ARCHIVED│
                                   └─────────┘


VALID TRANSITIONS:
DRAFT              → PENDING (on createSignRequest)
DRAFT              → ARCHIVED (on deleteDocument)
PENDING            → SIGNED (when all signers complete)
PENDING            → IN_PROGRESS (when first signer starts)
PENDING            → DECLINED (when any signer declines)
PENDING            → EXPIRED (on expiration date)
IN_PROGRESS        → SIGNED (when all signers complete)
IN_PROGRESS        → DECLINED (when any signer declines)
IN_PROGRESS        → EXPIRED (on expiration date)
DECLINED/EXPIRED   → DRAFT (on resetDocument - Phase 2)
SIGNED             → ARCHIVED (after 90 days or on manual action)
```

### Sign Request Lifecycle

```
                        ┌─────────┐
                        │ PENDING │
                        └────┬────┘
                             │
                ┌────────────┬┴────────────┐
                │            │            │
                │        viewDocument()   │declineSignRequest()
                │            │            │
                ▼            ▼            ▼
           ┌──────────┐ ┌────────────┐ ┌──────────┐
           │ IN_PROGRESS  │ VIEWED   │ │ DECLINED │
           └────┬─────┘ └────┬───────┘ └──────────┘
                │             │
                │             │ addSignature()
                │             ▼
                └────────► ┌────────┐
                           │ SIGNED │
                           └────┬───┘
                                │
                    expiresAt() │
                                ▼
                           ┌─────────┐
                           │ EXPIRED │
                           └─────────┘
```

### Sequential Signing Workflow

```
Example: 3 signers in sequence

Document Status: PENDING
├── Signer 1 (Order: 1)
│   Status: PENDING → VIEWED → IN_PROGRESS → SIGNED
│
├── [Waiting]
│
├── Signer 2 (Order: 2)
│   Status: PENDING → VIEWED → IN_PROGRESS → SIGNED
│
├── [Waiting]
│
└── Signer 3 (Order: 3)
    Status: PENDING → VIEWED → IN_PROGRESS → SIGNED
    
    └─► Document Status: SIGNED
```

### Parallel Signing Workflow

```
Example: 3 signers in parallel

Document Status: PENDING
├─┬─┬──► Signer 1: PENDING → SIGNED
├─┤ │    (simultaneous)
└─┴─┴──► Signer 3: PENDING → SIGNED
         Signer 2: PENDING → SIGNED
         
    └─► Document Status: SIGNED
```

### Webhook Events (Phase 2)

```typescript
// Events to publish
enum ESignWebhookEvent {
  DOCUMENT_CREATED = "esign.document.created",
  DOCUMENT_SENT = "esign.document.sent",
  SIGNATURE_REQUESTED = "esign.signature_request.created",
  SIGNATURE_VIEWED = "esign.signature_request.viewed",
  SIGNATURE_STARTED = "esign.signature_request.started",
  SIGNATURE_COMPLETED = "esign.signature.completed",
  SIGNATURE_DECLINED = "esign.signature_request.declined",
  DOCUMENT_SIGNED = "esign.document.signed",
  DOCUMENT_EXPIRED = "esign.document.expired",
}

interface WebhookPayload {
  event: ESignWebhookEvent;
  businessId: string;
  documentId?: string;
  signRequestId?: string;
  signatureId?: string;
  timestamp: Date;
  data: Record<string, any>;
}
```

---

## FEATURE FLAG SYSTEM

### Implementation

```sql
-- Add to business_features table
ALTER TABLE business_features ADD COLUMN IF NOT EXISTS esign_enabled BOOLEAN DEFAULT false;

-- Check feature availability
CREATE OR REPLACE FUNCTION is_esign_enabled(business_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT COALESCE(esign_enabled, false)
    FROM business_features
    WHERE business_id = business_id_param
  );
END;
$$ LANGUAGE plpgsql;
```

### Middleware Implementation

```typescript
// Express/Fastify middleware
async function esignFeatureCheck(req: Request, res: Response, next: NextFunction) {
  const businessId = req.user.businessId;
  
  const isEnabled = await supabase
    .from("esign_settings")
    .select("is_enabled")
    .eq("business_id", businessId)
    .single();
  
  if (!isEnabled.data?.is_enabled) {
    return res.status(403).json({
      error: "E-Signature feature is not enabled for your business",
      code: "ESIGN_DISABLED"
    });
  }
  
  next();
}

// Apply to routes
router.post("/documents", esignFeatureCheck, createDocument);
router.post("/documents/:id/sign-requests", esignFeatureCheck, createSignRequest);
```

### UI Behavior When Disabled

```typescript
// React component
function DocumentUploadSection() {
  const [esignEnabled, setEsignEnabled] = useState(false);
  
  useEffect(() => {
    checkEsignFeature();
  }, []);
  
  if (!esignEnabled) {
    return (
      <div className="feature-disabled-banner">
        <Icon name="lock" />
        <p>E-Signature is not available for your business plan.</p>
        <button onClick={() => navigate("/upgrade")}>
          Upgrade to enable
        </button>
      </div>
    );
  }
  
  return <DocumentUploadForm />;
}
```

### Admin Configuration

```typescript
// Admin panel endpoint
PUT /admin/businesses/:businessId/esign-settings
{
  isEnabled: true,
  maxSignersPerDocument: 10,
  maxDocumentSizeMb: 50,
  defaultExpiryDays: 30,
  allowManagerAssistance: true,
  allowBulkSigning: false,
  complianceStandard: "esign_act"
}
```

---

## ROLE-BASED ACCESS CONTROL (RBAC)

### Permission Matrix

```
┌─────────────────────┬──────────┬─────────┬─────────┬──────────┐
│ Permission          │ Customer │ Merchant│ Manager │ Admin    │
├─────────────────────┼──────────┼─────────┼─────────┼──────────┤
│ View own docs       │    ✓     │    ✓    │    ✓    │    ✓     │
│ Sign assigned doc   │    ✓     │    ✓    │    ✓    │    ✓     │
│ Upload document     │    ✗     │    ✓    │    ✓    │    ✓     │
│ Create sign request │    ✗     │    ✓    │    ✓    │    ✓     │
│ Decline document    │    ✓     │    ✓    │    ✓    │    ✓     │
│ Assist in signing   │    ✗     │    ✗    │    ✓    │    ✓     │
│ View audit trail    │    ✗     │    ✗    │    ✗    │    ✓     │
│ Export signed docs  │    ✓*    │    ✓*   │    ✓    │    ✓     │
│ Manage settings     │    ✗     │    ✗    │    ✗    │    ✓     │
│ Manage templates    │    ✗     │    ✗    │    ✗    │    ✓     │
└─────────────────────┴──────────┴─────────┴─────────┴──────────┘

* With signature verification
```

### Authorization Rules

```typescript
// Permission checks
interface ESignAuthorizationRules {
  canViewDocument(userId: string, documentId: string): Promise<boolean> {
    // Document owner OR assigned signer OR admin
  }
  
  canSignDocument(userId: string, signRequestId: string): Promise<boolean> {
    // Assigned signer with active sign request
  }
  
  canUploadDocument(userId: string, businessId: string): Promise<boolean> {
    // Manager+ role with e-signature enabled
  }
  
  canCreateSignRequest(userId: string, documentId: string): Promise<boolean> {
    // Document owner with manager+ role
  }
  
  canDeclineDocument(userId: string, signRequestId: string): Promise<boolean> {
    // Assigned signer
  }
  
  canAssistSigning(userId: string, signRequestId: string): Promise<boolean> {
    // Manager+ with can_be_signed_by_manager = true
  }
  
  canViewAuditTrail(userId: string, documentId: string): Promise<boolean> {
    // Admin+ only
  }
  
  canManageSettings(userId: string, businessId: string): Promise<boolean> {
    // Business owner or admin
  }
}
```

### Manager Assistance Flow

```typescript
// When manager assists customer signing
interface ManagerAssistanceContext {
  customerSignRequestId: string;
  managerId: string;
  assistanceReason: "customer_request" | "system_initiated";
  assistanceStartedAt: Date;
  
  // Manager can:
  // 1. View document and guidance
  // 2. Help customer draw/type signature on their device
  // 3. Signature is still attributed to customer
  // 4. Audit trail shows manager assisted
}

// Endpoint: Manager assists customer signing
POST /sign-requests/:requestId/assist
{
  assistanceReason: "customer_request";
  description: "Assisted customer via phone call";
  
  // Then proceed with normal signing flow
  // But signature attribution goes to original signer
}
```

---

## SECURITY & COMPLIANCE

### Encryption Strategy

```typescript
interface SecurityImplementation {
  // Document Encryption
  documentEncryption: {
    algorithm: "AES-256-GCM";
    provider: "AWS KMS" | "Supabase Vault";
    keyManagement: {
      keyRotation: "annual",
      keyVersioning: true,
      auditKeyAccess: true
    };
    backupEncryption: true;
  };
  
  // Signature Data Encryption
  signatureEncryption: {
    enabled: true;
    algorithm: "AES-256-GCM";
    keyDerivation: "PBKDF2";
    iterations: 100000;
  };
  
  // Transport Security
  transportSecurity: {
    tlsVersion: "1.3+";
    cipherSuites: [
      "TLS_AES_256_GCM_SHA384",
      "TLS_CHACHA20_POLY1305_SHA256",
      "TLS_AES_128_GCM_SHA256"
    ];
    certificatePinning: true;
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    };
  };
}
```

### Digital Signature Standards

```typescript
interface ComplianceStandards {
  // ESIGN Act (United States)
  esignAct: {
    requirements: [
      "Consumer consent to electronic documents",
      "Ability to withdraw consent",
      "Accurate record of consent",
      "Clear identification of parties",
      "Non-repudiation"
    ];
    implementation: {
      requireConsent: true,
      consentWithdrawalPeriod: 30, // days
      partyIdentification: "email_verified",
      auditTrailRequired: true
    };
  };
  
  // eIDAS Regulation (European Union)
  eidas: {
    requirements: [
      "Advanced Electronic Signature (AdES)",
      "Time stamp from Trusted Service Provider",
      "Qualified Certificate",
      "Qualified Electronic Seal"
    ];
    implementation: {
      timestampAuthority: "RFC3161_TSA";
      certificateProvider: "EU_Approved_TSP";
      auditTrailRequired: true;
      legalEquivalence: "paper_signature"
    };
  };
  
  // GDPR Data Protection
  gdpr: {
    requirements: [
      "Lawful basis for processing",
      "Legitimate interest or consent",
      "Data minimization",
      "Purpose limitation",
      "Right to erasure",
      "Right to access"
    ];
    implementation: {
      consentManagement: true,
      dataRetentionPolicy: 3650, // days (10 years)
      erasureCapability: true,
      accessPortal: true,
      privacyNotice: true
    };
  };
}
```

### Timestamp Authority Integration

```typescript
interface TimestampAuthority {
  provider: "DigiCert" | "Entrust" | "Custom RFC3161";
  
  // RFC 3161 Implementation
  rfc3161Config: {
    tsaUrl: "http://timestamp.authority.com/tsa";
    hashAlgorithm: "SHA-256";
    requestTimeout: 30000; // milliseconds
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2
    };
  };
  
  // Token Verification
  verifyTimestamp(token: string): Promise<{
    signTime: Date;
    accuracy: number; // milliseconds
    provider: string;
    trusted: boolean;
  }>;
}

// Usage in signature capture
async function captureSignatureWithTimestamp(
  signatureData: string,
  tsaProvider: TimestampAuthority
) {
  const timestampToken = await tsaProvider.requestTimestamp(
    signatureData
  );
  
  return {
    signatureData,
    timestampToken,
    capturedAt: new Date(),
    trustedTimestamp: true
  };
}
```

### IP Address & Device Logging

```typescript
interface SecurityContext {
  signature: {
    ipAddress: string;
    ipCountry?: string;
    ipCity?: string;
    
    deviceFingerprint: string;
    deviceType: "mobile" | "tablet" | "desktop";
    osName: string;
    osVersion: string;
    browserName: string;
    browserVersion: string;
    
    screenResolution: string;
    timezone: string;
    locale: string;
    
    // Anomaly Detection
    isAnomalous: boolean;
    anomalyScore: number;
    expectedLocation: boolean;
    expectedDevice: boolean;
  };
}

// Device fingerprinting function
function generateDeviceFingerprint(): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  // Canvas fingerprinting
  ctx.textBaseline = "top";
  ctx.font = "14px Arial";
  ctx.fillText("ESignature", 2, 2);
  
  const canvasHash = canvas.toDataURL();
  
  // WebGL fingerprinting
  const gl = document.createElement("canvas").getContext("webgl");
  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
  
  // Combine all data
  const fingerprint = {
    canvas: canvasHash,
    glRenderer,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    plugins: Array.from(navigator.plugins).map(p => p.name)
  };
  
  return crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(fingerprint))
  );
}
```

### Tamper Detection

```typescript
interface TamperDetection {
  // Document Integrity
  calculateDocumentHash(fileContent: ArrayBuffer): string {
    const hash = crypto.subtle.digest("SHA-256", fileContent);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }
  
  verifyDocumentIntegrity(
    documentId: string,
    currentHash: string
  ): Promise<boolean> {
    const storedHash = await this.getStoredHash(documentId);
    return currentHash === storedHash;
  }
  
  // Signature Validation
  verifySignatureIntegrity(signature: ESignature): Promise<boolean> {
    // Verify signature hash hasn't changed
    const currentHash = this.calculateSignatureHash(signature.signatureData);
    return currentHash === signature.signatureHash;
  }
  
  // Certificate Chain Validation
  async validateCertificateChain(certificateId: string): Promise<boolean> {
    // Validate certificate chain integrity
    // Check revocation status
    // Verify trusted root CA
    return true;
  }
}
```

---

## NOTIFICATION SYSTEM

### Email Notifications

```typescript
interface ESignNotifications {
  // When document sent for signing
  onDocumentSent: {
    template: "document_sent_for_signature",
    subject: "Please sign: {documentTitle}",
    recipientEmail: string,
    data: {
      signerName: string,
      documentTitle: string,
      documentLink: string,
      expiresAt: Date,
      customMessage?: string
    }
  };
  
  // When signer views document
  onDocumentViewed: {
    template: "document_viewed_notification",
    subject: "{signerName} viewed your document",
    recipientEmail: string, // Document owner
    data: {
      signerName: string,
      documentTitle: string,
      viewedAt: Date
    }
  };
  
  // When signature completed
  onSignatureCompleted: {
    template: "signature_completed",
    subject: "{documentTitle} has been signed",
    recipientEmail: string, // All parties
    data: {
      signerName: string,
      documentTitle: string,
      signedAt: Date,
      downloadLink: string
    }
  };
  
  // When signature declined
  onSignatureDeclined: {
    template: "signature_declined",
    subject: "{signerName} declined to sign",
    recipientEmail: string, // Document owner
    data: {
      signerName: string,
      documentTitle: string,
      declineReason: string,
      declinedAt: Date
    }
  };
  
  // Reminder before expiration
  onExpirationReminder: {
    template: "signature_reminder",
    subject: "Action required: Sign {documentTitle}",
    recipientEmail: string,
    data: {
      signerName: string,
      documentTitle: string,
      daysRemaining: number,
      documentLink: string
    }
  };
  
  // Document expired
  onDocumentExpired: {
    template: "document_expired",
    subject: "{documentTitle} signature request expired",
    recipientEmail: string,
    data: {
      documentTitle: string,
      expiredAt: Date,
      canResend: boolean
    }
  };
}

// Notification service
class ESignNotificationService {
  async sendDocumentSigningRequest(
    signRequest: ESignSignRequest,
    document: ESignDocument
  ) {
    const emailPayload = {
      to: signRequest.signerEmail,
      template: "document_sent_for_signature",
      data: {
        signerName: signRequest.signerEmail.split("@")[0],
        documentTitle: document.title,
        documentLink: this.generateSigningLink(signRequest.id),
        expiresAt: signRequest.expiresAt
      }
    };
    
    await this.emailProvider.send(emailPayload); // Resend
  }
  
  async sendReminderEmails() {
    // Scheduled job: every day
    const expiringSoon = await this.getExpiringSoonRequests(7); // 7 days
    
    for (const request of expiringSoon) {
      if (request.reminderCount < request.maxReminders) {
        await this.sendDocumentSigningRequest(request);
        
        // Update reminder tracking
        await this.updateReminderCount(request.id);
      }
    }
  }
}
```

### In-App Notifications

```typescript
// Notification panel/bell icon
interface InAppNotification {
  id: string;
  type: "document_sent" | "signature_needed" | "document_signed";
  title: string;
  message: string;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
}

// Real-time updates via WebSocket (Phase 2)
class ESignWebSocketNotifications {
  subscribeToDocumentUpdates(documentId: string) {
    // Subscribe to document status changes
    // Notify all stakeholders of updates in real-time
  }
  
  notifySignatureCompleted(
    documentId: string,
    signer: ESignSignRequest
  ) {
    // Broadcast to all interested parties
    // Document owner, other signers, etc.
  }
}
```

---

## USE CASE INTEGRATION

### Use Case 1: Merchant Onboarding

```typescript
interface MerchantOnboardingFlow {
  // Step 1: Generate onboarding agreement
  async initiateOnboarding(merchant: Merchant) {
    const agreement = await documentService.createDocument({
      title: "Merchant Agreement",
      documentType: "agreement",
      relatedEntityType: "merchant_onboarding",
      relatedEntityId: merchant.id,
      file: merchantAgreementTemplate
    });
    
    return agreement;
  }
  
  // Step 2: Create sign request
  async sendForSignature(merchant: Merchant, document: ESignDocument) {
    await signRequestService.create({
      documentId: document.id,
      signers: [
        {
          signerEmail: merchant.contactEmail,
          signerRole: "merchant",
          signingOrder: 1
        },
        {
          signerEmail: adminEmail,
          signerRole: "admin",
          signingOrder: 2
        }
      ]
    });
  }
  
  // Step 3: Monitor signing progress
  async monitorSigningProgress(merchantId: string) {
    const document = await documentService.getByRelatedEntity(
      "merchant_onboarding",
      merchantId
    );
    
    if (document.status === "signed") {
      // Complete onboarding
      await completeMerchantOnboarding(merchantId);
      
      // Activate merchant account
      await activateMerchantAccount(merchantId);
    }
  }
}
```

### Use Case 2: Deal Approval Workflow

```typescript
interface DealApprovalFlow {
  // Step 1: Manager creates deal
  async createDealWithApproval(deal: Deal, manager: User) {
    const agreement = await documentService.createDocument({
      title: `Deal Approval: ${deal.title}`,
      documentType: "approval",
      relatedEntityType: "deal",
      relatedEntityId: deal.id,
      file: dealTermsDocument
    });
    
    return agreement;
  }
  
  // Step 2: Send to higher manager
  async sendForApproval(deal: Deal, document: ESignDocument) {
    const approvers = await getApprovalChain(deal.value);
    
    await signRequestService.create({
      documentId: document.id,
      signers: approvers.map((approver, index) => ({
        signerEmail: approver.email,
        signerRole: "manager",
        signingOrder: index + 1 // Sequential approval
      }))
    });
  }
  
  // Step 3: Auto-execute on approval
  async onAllApprovalsComplete(deal: Deal, document: ESignDocument) {
    // Mark deal as approved
    await updateDealStatus(deal.id, "approved");
    
    // Trigger downstream actions (customer notification, etc.)
  }
}
```

### Use Case 3: Order Fulfillment Confirmation

```typescript
interface OrderFulfillmentFlow {
  // Step 1: Customer orders
  async createOrder(customer: Customer, items: OrderItem[]) {
    const order = await orderService.create({
      customerId: customer.id,
      items,
      status: "pending_signature"
    });
    
    return order;
  }
  
  // Step 2: Generate receipt/agreement
  async sendOrderConfirmation(order: Order) {
    const receiptDocument = await documentService.createDocument({
      title: `Order Receipt #${order.id}`,
      documentType: "receipt",
      relatedEntityType: "order",
      relatedEntityId: order.id,
      file: generateReceiptPDF(order)
    });
    
    // Create sign request
    await signRequestService.create({
      documentId: receiptDocument.id,
      signers: [{
        signerEmail: order.customerEmail,
        signerRole: "customer"
      }]
    });
  }
  
  // Step 3: Process after signature
  async onOrderConfirmed(order: Order) {
    // Update order status
    await updateOrderStatus(order.id, "confirmed");
    
    // Proceed with fulfillment
    await fulfillmentService.processOrder(order.id);
  }
}
```

### Use Case 4: Coupon Terms Acceptance

```typescript
interface CouponTermsFlow {
  // Before redeeming coupon
  async validateCouponTermsAcceptance(coupon: Coupon, customer: Customer) {
    // Check if customer has signed terms
    const hasSignedTerms = await this.checkSignature(
      coupon.id,
      "coupon_terms",
      customer.id
    );
    
    if (!hasSignedTerms) {
      // Send for signature
      await this.sendCouponTermsForSignature(coupon, customer);
      return false;
    }
    
    return true;
  }
  
  async sendCouponTermsForSignature(coupon: Coupon, customer: Customer) {
    const termsDocument = await documentService.createDocument({
      title: `${coupon.name} - Terms & Conditions`,
      documentType: "term_and_conditions",
      relatedEntityType: "coupon",
      relatedEntityId: coupon.id,
      file: coupon.termsDocument
    });
    
    await signRequestService.create({
      documentId: termsDocument.id,
      signers: [{
        signerEmail: customer.email,
        signerRole: "customer"
      }]
    });
  }
}
```

### Use Case 5: Booking Confirmation

```typescript
interface BookingConfirmationFlow {
  async confirmBooking(booking: Booking, customer: Customer) {
    const confirmationDocument = await documentService.createDocument({
      title: `Booking Confirmation #${booking.id}`,
      documentType: "confirmation",
      relatedEntityType: "booking",
      relatedEntityId: booking.id,
      file: generateBookingConfirmationPDF(booking)
    });
    
    // Can be signed by customer or manager on their behalf
    await signRequestService.create({
      documentId: confirmationDocument.id,
      signers: [{
        signerEmail: customer.email,
        signerRole: "customer",
        canBeSignedByManager: true // Manager can help customer sign
      }]
    });
  }
}
```

---

## AUDIT TRAIL & LOGGING

### Audit Log Events

```typescript
enum AuditEventType {
  // Document Events
  DOCUMENT_CREATED = "document_created",
  DOCUMENT_UPLOADED = "document_uploaded",
  DOCUMENT_UPDATED = "document_updated",
  DOCUMENT_DELETED = "document_deleted",
  DOCUMENT_ARCHIVED = "document_archived",
  
  // Sign Request Events
  SIGN_REQUEST_CREATED = "sign_request_created",
  SIGN_REQUEST_SENT = "sign_request_sent",
  SIGN_REQUEST_RESENT = "sign_request_resent",
  
  // Signature Events
  SIGNATURE_STARTED = "signature_started",
  SIGNATURE_ADDED = "signature_added",
  SIGNATURE_DECLINED = "signature_declined",
  
  // State Changes
  DOCUMENT_STATUS_CHANGED = "document_status_changed",
  REQUEST_STATUS_CHANGED = "request_status_changed",
  
  // Access Events
  DOCUMENT_VIEWED = "document_viewed",
  AUDIT_TRAIL_ACCESSED = "audit_trail_accessed",
  
  // Admin Events
  SETTINGS_CHANGED = "settings_changed",
  TEMPLATE_CREATED = "template_created",
  TEMPLATE_UPDATED = "template_updated",
  
  // Security Events
  SIGNATURE_VERIFIED = "signature_verified",
  SIGNATURE_VALIDATION_FAILED = "signature_validation_failed",
  DOCUMENT_INTEGRITY_CHECK = "document_integrity_check",
  ANOMALY_DETECTED = "anomaly_detected"
}

interface AuditLogEntry {
  id: string;
  businessId: string;
  eventType: AuditEventType;
  
  // Actor
  actorId: string;
  actorRole: string;
  actorEmail: string;
  
  // Target
  documentId?: string;
  signRequestId?: string;
  signatureId?: string;
  
  // Details
  changeDescription: string;
  changeMetadata: Record<string, any>;
  
  // Context
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  
  // Compliance
  isComplianceRelevant: boolean;
  retentionRequiredUntil: Date;
  
  // Integrity
  entryHash: string; // SHA-256 of entry
  
  timestamp: Date;
  createdAt: Date;
}
```

### Audit Trail Export

```typescript
interface AuditTrailExport {
  // Export format: CSV, JSON, PDF
  format: "csv" | "json" | "pdf";
  
  // Date range
  startDate: Date;
  endDate: Date;
  
  // Filters
  eventTypes?: AuditEventType[];
  actorIds?: string[];
  documentIds?: string[];
  
  // Options
  includeMetadata: boolean;
  includeSignatures: boolean; // Sensitive - admin only
  verifyIntegrity: boolean;
  
  // Output
  fileName: string;
  contentType: string;
  data: string; // Base64 or raw content
}

// CSV Format Example:
// Timestamp,Actor Email,Event Type,Document ID,Description,IP Address,Status
// 2026-05-04T10:30:00Z,manager@example.com,signature_added,doc-123,Signed document,192.168.1.1,success

// JSON Format Example:
{
  exportDate: "2026-05-04T10:30:00Z",
  businessId: "biz-123",
  totalEvents: 150,
  events: [
    {
      timestamp: "2026-05-01T08:00:00Z",
      actorEmail: "manager@example.com",
      eventType: "sign_request_sent",
      documentId: "doc-123",
      description: "Sent merchant agreement for signature",
      ipAddress: "192.168.1.1",
      status: "success"
    }
  ]
}
```

### Compliance Reporting

```typescript
interface ComplianceReport {
  // Compliance metrics
  metrics: {
    totalDocumentsSigned: number;
    averageSigningTime: number; // minutes
    documentCompletionRate: number; // percentage
    averageRemindersPerDocument: number;
    mostCommonDeclineReason: string;
  };
  
  // Risk indicators
  riskIndicators: {
    unusualSigningPatterns: number;
    failedValidations: number;
    suspiciousBiometrics: number;
    anomalousLocations: number;
  };
  
  // Compliance status
  complianceStatus: {
    esignActCompliance: boolean;
    eidasCompliance: boolean;
    gdprCompliance: boolean;
    auditTrailComplete: boolean;
    encryptionVerified: boolean;
  };
  
  // Recommendations
  recommendations: string[];
  
  // Generate date range
  reportPeriod: {
    startDate: Date;
    endDate: Date;
  };
}
```

---

## TESTING STRATEGY

### Unit Tests

```typescript
describe("ESignature Service", () => {
  describe("Signature Validation", () => {
    it("should validate signature complexity", () => {
      const validator = new SignatureValidator();
      const validSignature = generateComplexSignature();
      const invalidSignature = generateSimpleSignature();
      
      expect(validator.validate(validSignature)).toBeValid();
      expect(validator.validate(invalidSignature)).toBeInvalid();
    });
    
    it("should reject blank signatures", () => {
      const validator = new SignatureValidator();
      const blankSignature = createBlankCanvas();
      
      expect(validator.validate(blankSignature)).toBeInvalid();
    });
  });
  
  describe("Document Status Transitions", () => {
    it("should transition from draft to pending", () => {
      const doc = new ESignDocument("draft");
      doc.transitionTo("pending");
      
      expect(doc.status).toBe("pending");
    });
    
    it("should prevent invalid transitions", () => {
      const doc = new ESignDocument("signed");
      
      expect(() => doc.transitionTo("draft")).toThrow();
    });
  });
  
  describe("Encryption", () => {
    it("should encrypt signature data", async () => {
      const encryptor = new SignatureEncryptor();
      const plaintext = "signature-data";
      
      const encrypted = await encryptor.encrypt(plaintext);
      const decrypted = await encryptor.decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
  });
});
```

### Integration Tests

```typescript
describe("Document Signing Workflow", () => {
  it("should complete sequential signing workflow", async () => {
    // 1. Create document
    const doc = await documentService.create({
      title: "Test Agreement",
      documentType: "agreement",
      file: testPDF
    });
    
    // 2. Create sign requests
    const requests = await signRequestService.create({
      documentId: doc.id,
      signers: [
        { email: "signer1@test.com", order: 1 },
        { email: "signer2@test.com", order: 2 }
      ]
    });
    
    // 3. Signer 1 signs
    const sig1 = await signatureService.addSignature({
      signRequestId: requests[0].id,
      signatureData: drawSignature(),
      signatureType: "drawn"
    });
    
    // Document should still be pending (waiting for signer 2)
    expect(doc.status).toBe("in_progress");
    
    // 4. Signer 2 signs
    const sig2 = await signatureService.addSignature({
      signRequestId: requests[1].id,
      signatureData: drawSignature(),
      signatureType: "drawn"
    });
    
    // Document should be signed
    expect(doc.status).toBe("signed");
  });
  
  it("should handle document expiration", async () => {
    const doc = await documentService.create({
      title: "Expiring Agreement",
      documentType: "agreement",
      file: testPDF,
      expiresAt: new Date(Date.now() - 1000) // Already expired
    });
    
    expect(doc.status).toBe("expired");
  });
});

describe("Authorization", () => {
  it("should prevent unauthorized access to documents", async () => {
    const doc = await documentService.create({ ... });
    
    expect(async () => {
      await documentService.viewAs(doc.id, unauthorizedUser);
    }).rejects.toThrow("Unauthorized");
  });
  
  it("should allow manager to assist customer signing", async () => {
    const customerRequest = await signRequestService.get(requestId);
    
    expect(async () => {
      await signatureService.addSignatureAsManager({
        signRequestId: customerRequest.id,
        managerId: manager.id,
        signatureData: drawSignature()
      });
    }).not.toThrow();
  });
});
```

### End-to-End Tests

```typescript
describe("E2E: Merchant Onboarding with E-Signature", () => {
  it("should complete full merchant onboarding flow", async () => {
    // 1. Register merchant
    const merchant = await registerMerchant({
      email: "merchant@test.com",
      name: "Test Merchant"
    });
    
    // 2. Initiate onboarding
    const onboardingDoc = await onboardingService.initiate(merchant.id);
    
    // 3. Merchant signs agreement
    await signatureService.addSignature({
      signRequestId: onboardingDoc.signRequests[0].id,
      signatureData: drawSignature(),
      signatureType: "drawn"
    });
    
    // 4. Admin approves
    await adminService.approveOnboarding(merchant.id);
    
    // 5. Merchant account activated
    const activeMerchant = await merchantService.get(merchant.id);
    expect(activeMerchant.status).toBe("active");
  });
});
```

### Compliance Testing

```typescript
describe("ESIGN Act Compliance", () => {
  it("should require consumer consent", async () => {
    // Verify consent mechanism is in place
  });
  
  it("should allow withdrawal of consent", async () => {
    // Test consent withdrawal
  });
  
  it("should maintain accurate audit trail", async () => {
    // Verify all actions are logged
  });
});

describe("eIDAS Compliance", () => {
  it("should integrate with timestamp authority", async () => {
    // Verify RFC3161 timestamp integration
  });
  
  it("should validate certificate chain", async () => {
    // Test certificate validation
  });
});
```

---

## DEPLOYMENT & SCALING

### Deployment Checklist

```
PRE-DEPLOYMENT:
□ Database migrations tested in staging
□ All RLS policies verified
□ API endpoints load tested
□ Email templates reviewed and tested
□ File storage configured and accessible
□ Encryption keys configured
□ Rate limiting configured
□ Feature flags tested
□ UI components tested across browsers
□ Mobile responsiveness verified
□ Accessibility audit completed
□ Security headers configured

DEPLOYMENT:
□ Database migrations executed
□ Environment variables set
□ Feature flags enabled for pilot users
□ Email service configured
□ Monitoring and alerting set up
□ Logging configured
□ CDN configured for document delivery
□ SSL certificates installed

POST-DEPLOYMENT:
□ Smoke tests executed
□ User documentation deployed
□ Support team trained
□ Monitoring dashboards active
□ Alerts configured for errors
□ Performance baselines captured
□ Rollback plan verified
□ User feedback collection started
```

### Scaling Considerations

```typescript
interface ScalingStrategy {
  // Database Scaling
  database: {
    readReplicas: true,
    verticalScaling: "auto",
    indexing: {
      businessId: true,
      status: true,
      createdAt: true,
      expiresAt: true
    },
    partitioning: "by_business_id", // For very large tables
    archivingPolicy: {
      archiveAfterDays: 90,
      archiveDestination: "cold_storage",
      retentionYears: 10
    }
  };
  
  // File Storage Scaling
  fileStorage: {
    provider: "S3 with CloudFront CDN",
    multiRegionReplication: true,
    compressionEnabled: true,
    
    // Document limits
    quotaPerBusiness: {
      maxConcurrent: 100,
      maxTotal: 10000,
      maxStorageGb: 1000
    }
  };
  
  // API Scaling
  api: {
    loadBalancing: "auto-scaling",
    containerization: "Docker with Kubernetes",
    
    // Endpoint limits
    rateLimit: {
      requests_per_minute: 100,
      requests_per_hour: 5000,
      burst_limit: 500
    },
    
    // Caching
    caching: {
      documentMetadata: "1 hour",
      auditTrail: "5 minutes",
      signatureFields: "1 hour"
    }
  };
  
  // Monitoring
  monitoring: {
    metrics: [
      "API response time",
      "Database query time",
      "File upload/download speed",
      "Email delivery rate",
      "Signature validation success rate",
      "System uptime",
      "Document processing queue depth"
    ],
    
    alertThresholds: {
      apiLatencyMs: 1000,
      errorRate: 0.01, // 1%
      documentQueueSize: 1000,
      storageUsagePercent: 80
    }
  };
}
```

### Performance Targets

```
Document Upload:          < 2 seconds for 50MB file
Signature Capture:        < 500ms API response
Document Retrieval:       < 500ms API response
Audit Trail Query:        < 1000ms for 1000 entries
Email Delivery:           < 30 seconds
Signature Verification:   < 5 seconds
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1 MVP (3 weeks)

**Week 1: Foundation & Database**
- [ ] Create database schema (all tables)
- [ ] Implement RLS policies
- [ ] Create migration scripts
- [ ] Set up file storage structure
- [ ] Configure encryption

**Week 2: Core API & UI**
- [ ] Implement API endpoints (upload, create request, sign, get)
- [ ] Build signature capture UI (draw/type/upload)
- [ ] Implement notification system
- [ ] Create document upload form
- [ ] Build signing workflow UI

**Week 3: Testing & Deployment**
- [ ] Unit and integration tests (80%+ coverage)
- [ ] E2E testing for signing workflow
- [ ] Security testing (penetration testing)
- [ ] Load testing
- [ ] Staging deployment
- [ ] Documentation

**Deliverables:**
- Working MVP with single document, single signer
- Draw/type/upload signature support
- Email notifications
- Basic audit trail
- API documentation

### Phase 2 Advanced Features (2 weeks)

**Week 1: Multi-Party & Templates**
- [ ] Sequential signing workflow
- [ ] Parallel signing workflow
- [ ] Document templates
- [ ] Bulk signing requests
- [ ] Template management UI

**Week 2: Advanced Features & Polish**
- [ ] Advanced audit trail with export
- [ ] Webhook system
- [ ] Biometric signing foundation
- [ ] Performance optimization
- [ ] Enhanced compliance reporting
- [ ] Production deployment

**Deliverables:**
- Multi-party signing (sequential + parallel)
- Document templates
- Advanced audit trail with export
- Webhook integration
- Enhanced compliance features

### Technology Stack

```
Frontend:
- React 18+
- TypeScript
- Tailwind CSS
- React Signature Canvas / Custom Canvas
- Zustand (state management)

Backend:
- Node.js / Fastify
- TypeScript
- Supabase (PostgreSQL + Storage)
- Resend (email)
- Pino (logging)

Security:
- TLS 1.3+
- AES-256-GCM encryption
- JWT tokens
- RFC 3161 timestamps
- HTTPS/HSTS

Infrastructure:
- Docker containers
- Kubernetes orchestration
- PostgreSQL database
- S3-compatible storage (Supabase Storage)
- CloudFront CDN
- Monitoring: Datadog / New Relic
```

### Development Team

```
- 1 Backend Engineer (Database, API, Security)
- 1 Frontend Engineer (UI, Signature Canvas)
- 1 DevOps Engineer (Infrastructure, Deployment)
- 1 QA Engineer (Testing, Compliance)
- 1 Project Manager (Coordination)
```

---

## CONCLUSION

This comprehensive E-Signature System specification provides Redeem Rocket with a production-ready blueprint for implementing digital signature capabilities across their multi-tenant SaaS platform. The architecture prioritizes:

1. **Security:** Encryption at rest and in transit, audit logging, compliance standards
2. **Scalability:** Database indexing, file storage optimization, horizontal scaling
3. **User Experience:** Multi-method signature capture, manager assistance, clear workflows
4. **Compliance:** ESIGN Act, eIDAS, GDPR readiness, audit trail completeness
5. **Integration:** Seamless integration with existing business processes

The phased approach allows for rapid MVP delivery (Week 3) while maintaining architectural flexibility for advanced features. All engineers should use this specification as the source of truth for implementation decisions.

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Next Review:** August 2026
