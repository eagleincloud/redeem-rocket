-- E-Signature System Database Migrations
-- Redeem Rocket Multi-Tenant Platform
-- Version: 1.0.0
-- Date: May 2026

-- Run these migrations in order in a PostgreSQL database

BEGIN;

-- ============================================================================
-- MIGRATION 001: Core Documents Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS esign_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,

  -- Document Metadata
  title VARCHAR(500) NOT NULL,
  description TEXT,
  document_type VARCHAR(100) NOT NULL,

  -- File Storage References
  original_filename VARCHAR(500),
  file_url TEXT NOT NULL,
  file_size_bytes INT,
  file_mime_type VARCHAR(100),

  -- Document Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  signing_mode VARCHAR(50) DEFAULT 'sequential',
  total_signers INT DEFAULT 1,
  signed_count INT DEFAULT 0,

  -- Lifecycle Dates
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,

  -- Relationship to Business Entities
  related_entity_type VARCHAR(100),
  related_entity_id UUID,

  -- Security
  is_encrypted BOOLEAN DEFAULT false,
  encryption_key_id VARCHAR(100),
  signature_algorithm VARCHAR(50) DEFAULT 'SHA-256-RSA',

  -- Audit Fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_document_status CHECK (status IN (
    'draft', 'pending', 'in_progress', 'signed', 'declined', 'expired', 'archived'
  )),
  CONSTRAINT valid_signing_mode CHECK (signing_mode IN ('sequential', 'parallel')),
  CONSTRAINT file_url_not_empty CHECK (file_url IS NOT NULL AND file_url != ''),

  -- Unique constraint per business
  UNIQUE(business_id, id)
);

-- Indexes for common queries
CREATE INDEX idx_esign_documents_business_id ON esign_documents(business_id);
CREATE INDEX idx_esign_documents_owner_id ON esign_documents(owner_id);
CREATE INDEX idx_esign_documents_status ON esign_documents(business_id, status);
CREATE INDEX idx_esign_documents_created_at ON esign_documents(business_id, created_at DESC);
CREATE INDEX idx_esign_documents_expires_at ON esign_documents(expires_at) WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_esign_documents_related_entity ON esign_documents(related_entity_type, related_entity_id);

-- Enable RLS
ALTER TABLE esign_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY esign_documents_owner_access ON esign_documents
  FOR SELECT USING (
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

CREATE POLICY esign_documents_owner_modify ON esign_documents
  FOR ALL USING (owner_id = auth.uid());

-- ============================================================================
-- MIGRATION 002: Sign Requests Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS esign_sign_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES esign_documents(id) ON DELETE CASCADE,

  -- Signer Information
  signer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  signer_email TEXT NOT NULL,
  signer_role VARCHAR(100),

  -- Request Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',

  -- Signing Order (for sequential signing)
  signing_order INT DEFAULT 1,
  requires_witness BOOLEAN DEFAULT false,
  witness_id UUID REFERENCES auth.users(id),

  -- Manager Assistance
  can_be_signed_by_manager BOOLEAN DEFAULT false,
  assisting_manager_id UUID REFERENCES auth.users(id),

  -- Lifecycle Dates
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  declined_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Decline Information
  decline_reason TEXT,
  decline_details JSONB,

  -- Reminder Tracking
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_count INT DEFAULT 0,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_request_status CHECK (status IN (
    'pending', 'viewed', 'in_progress', 'signed', 'declined', 'expired', 'resent'
  )),
  UNIQUE(document_id, signer_id)
);

-- Indexes
CREATE INDEX idx_esign_sign_requests_document_id ON esign_sign_requests(document_id);
CREATE INDEX idx_esign_sign_requests_signer_id ON esign_sign_requests(signer_id);
CREATE INDEX idx_esign_sign_requests_status ON esign_sign_requests(business_id, status);
CREATE INDEX idx_esign_sign_requests_expires_at ON esign_sign_requests(expires_at) WHERE status != 'signed';
CREATE INDEX idx_esign_sign_requests_order ON esign_sign_requests(document_id, signing_order);

-- Enable RLS
ALTER TABLE esign_sign_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY esign_sign_requests_signer_access ON esign_sign_requests
  FOR SELECT USING (
    signer_id = auth.uid() OR
    assisting_manager_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM esign_documents ed
      WHERE ed.id = esign_sign_requests.document_id
      AND ed.owner_id = auth.uid()
    )
  );

-- ============================================================================
-- MIGRATION 003: Signature Fields Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS esign_signature_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES esign_documents(id) ON DELETE CASCADE,

  -- Position on Document
  page_number INT NOT NULL DEFAULT 1,
  x_position NUMERIC(7, 2) NOT NULL,
  y_position NUMERIC(7, 2) NOT NULL,
  width NUMERIC(7, 2) DEFAULT 20,
  height NUMERIC(7, 2) DEFAULT 10,

  -- Field Configuration
  field_name VARCHAR(255) NOT NULL,
  field_type VARCHAR(50) DEFAULT 'signature',
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

  -- Constraints
  CONSTRAINT valid_field_type CHECK (field_type IN (
    'signature', 'initials', 'date', 'text', 'checkbox'
  )),
  CONSTRAINT valid_position_x CHECK (x_position >= 0 AND x_position <= 100),
  CONSTRAINT valid_position_y CHECK (y_position >= 0 AND y_position <= 100)
);

CREATE INDEX idx_esign_signature_fields_document_id ON esign_signature_fields(document_id);
CREATE INDEX idx_esign_signature_fields_page ON esign_signature_fields(document_id, page_number);

ALTER TABLE esign_signature_fields ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MIGRATION 004: Signatures Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS esign_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sign_request_id UUID NOT NULL REFERENCES esign_sign_requests(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES esign_documents(id) ON DELETE CASCADE,

  -- Signature Data
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  signature_data TEXT NOT NULL,
  signature_format VARCHAR(50) NOT NULL,

  -- Signature Metadata
  signature_type VARCHAR(50) NOT NULL,

  -- Security & Compliance Context
  ip_address INET,
  user_agent TEXT,
  device_fingerprint VARCHAR(500),
  geolocation JSONB,

  -- Timestamp Authority
  timestamp_token TEXT,
  timestamp_provider VARCHAR(100),

  -- Signature Validation
  signature_hash VARCHAR(500),
  certificate_id VARCHAR(500),
  is_valid BOOLEAN DEFAULT true,
  validation_error TEXT,

  -- Biometric (Phase 2)
  biometric_type VARCHAR(50),
  biometric_data TEXT,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  verified_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_signature_format CHECK (signature_format IN (
    'svg', 'png', 'image', 'jwt_token'
  )),
  CONSTRAINT valid_signature_type CHECK (signature_type IN (
    'drawn', 'typed', 'uploaded', 'biometric'
  )),
  CONSTRAINT signature_data_not_empty CHECK (signature_data IS NOT NULL AND signature_data != '')
);

CREATE INDEX idx_esign_signatures_sign_request_id ON esign_signatures(sign_request_id);
CREATE INDEX idx_esign_signatures_document_id ON esign_signatures(document_id);
CREATE INDEX idx_esign_signatures_user_id ON esign_signatures(user_id);
CREATE INDEX idx_esign_signatures_created_at ON esign_signatures(created_at DESC);

ALTER TABLE esign_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY esign_signatures_authorized_access ON esign_signatures
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM esign_documents ed
      JOIN esign_sign_requests esr ON ed.id = esr.document_id
      WHERE ed.id = esign_signatures.document_id
      AND (ed.owner_id = auth.uid() OR esr.signer_id = auth.uid())
    )
  );

-- ============================================================================
-- MIGRATION 005: Signature Versions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS esign_signature_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES esign_documents(id) ON DELETE CASCADE,

  -- Version Information
  version_number INT NOT NULL,
  change_type VARCHAR(50),

  -- Change Details
  changed_by_id UUID REFERENCES auth.users(id),
  change_description TEXT,
  change_metadata JSONB,

  -- Document Snapshots
  document_state JSONB NOT NULL,
  signers_snapshot JSONB NOT NULL,

  -- File References
  versioned_file_url TEXT,
  signed_file_url TEXT,

  -- Integrity
  document_hash VARCHAR(500),
  integrity_verified BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(document_id, version_number)
);

CREATE INDEX idx_esign_signature_versions_document_id ON esign_signature_versions(document_id);
CREATE INDEX idx_esign_signature_versions_created_at ON esign_signature_versions(document_id, created_at DESC);

ALTER TABLE esign_signature_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MIGRATION 006: E-Signature Settings Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS esign_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE REFERENCES businesses(id) ON DELETE CASCADE,

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
  compliance_standard VARCHAR(100) DEFAULT 'esign_act',
  log_ip_addresses BOOLEAN DEFAULT true,
  log_device_info BOOLEAN DEFAULT true,
  store_signed_documents_encrypted BOOLEAN DEFAULT true,
  signature_retention_days INT DEFAULT 3650,

  -- Biometric (Phase 2)
  enable_biometric_signing BOOLEAN DEFAULT false,
  biometric_types JSONB DEFAULT '["fingerprint", "face_recognition"]'::jsonb,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_esign_settings_business_id ON esign_settings(business_id);
CREATE INDEX idx_esign_settings_is_enabled ON esign_settings(is_enabled);

ALTER TABLE esign_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY esign_settings_admin_access ON esign_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM biz_users bu
      WHERE bu.business_id = esign_settings.business_id
      AND bu.user_id = auth.uid()
      AND bu.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- MIGRATION 007: Audit Logs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS esign_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  document_id UUID REFERENCES esign_documents(id) ON DELETE SET NULL,

  -- Event Information
  event_type VARCHAR(100) NOT NULL,

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

  -- Integrity
  entry_hash VARCHAR(500),

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_audit_event CHECK (event_type IN (
    'document_created', 'document_uploaded', 'document_updated', 'document_deleted',
    'sign_request_created', 'sign_request_sent', 'sign_request_resent',
    'signature_added', 'signature_validated', 'signature_declined',
    'document_status_changed', 'document_completed', 'document_expired',
    'settings_changed', 'audit_accessed', 'anomaly_detected'
  ))
);

CREATE INDEX idx_esign_audit_logs_business_id ON esign_audit_logs(business_id, created_at DESC);
CREATE INDEX idx_esign_audit_logs_document_id ON esign_audit_logs(document_id);
CREATE INDEX idx_esign_audit_logs_event_type ON esign_audit_logs(event_type);
CREATE INDEX idx_esign_audit_logs_actor_id ON esign_audit_logs(actor_id);
CREATE INDEX idx_esign_audit_logs_created_at ON esign_audit_logs(created_at DESC);

ALTER TABLE esign_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY esign_audit_logs_admin_view ON esign_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM biz_users bu
      WHERE bu.business_id = esign_audit_logs.business_id
      AND bu.user_id = auth.uid()
      AND bu.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- MIGRATION 008: Document Templates Table (Phase 2)
-- ============================================================================

CREATE TABLE IF NOT EXISTS esign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Template Metadata
  template_name VARCHAR(500) NOT NULL,
  template_description TEXT,
  template_category VARCHAR(100),

  -- Template Configuration
  base_document_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Pre-configured Fields
  signature_fields JSONB NOT NULL,
  default_signers JSONB,
  default_expiry_days INT DEFAULT 30,

  -- Audit
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(business_id, template_name)
);

CREATE INDEX idx_esign_templates_business_id ON esign_templates(business_id);
CREATE INDEX idx_esign_templates_category ON esign_templates(business_id, template_category);

ALTER TABLE esign_templates ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MIGRATION 009: Initialize Default Settings
-- ============================================================================

-- Insert default esign_settings for all existing businesses
INSERT INTO esign_settings (business_id, is_enabled)
SELECT id, false FROM businesses WHERE status = 'active'
ON CONFLICT (business_id) DO NOTHING;

-- ============================================================================
-- MIGRATION 010: Create Utility Functions
-- ============================================================================

-- Function: Update document signed count
CREATE OR REPLACE FUNCTION update_document_signed_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE esign_documents
  SET signed_count = (
    SELECT COUNT(*) FROM esign_sign_requests
    WHERE document_id = NEW.document_id AND status = 'signed'
  ),
  updated_at = NOW()
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for signed count updates
CREATE TRIGGER esign_signatures_update_count
AFTER INSERT ON esign_signatures
FOR EACH ROW
EXECUTE FUNCTION update_document_signed_count();

-- Function: Auto-update document status
CREATE OR REPLACE FUNCTION auto_update_document_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If all signers have signed, mark document as signed
  IF (SELECT COUNT(*) FROM esign_sign_requests
      WHERE document_id = NEW.document_id AND status != 'signed') = 0
  THEN
    UPDATE esign_documents
    SET status = 'signed', signed_at = NOW(), updated_at = NOW()
    WHERE id = NEW.document_id;
  -- If at least one signature exists, mark as in_progress
  ELSIF EXISTS (SELECT 1 FROM esign_signatures WHERE document_id = NEW.document_id)
  THEN
    UPDATE esign_documents
    SET status = 'in_progress', updated_at = NOW()
    WHERE id = NEW.document_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for status updates
CREATE TRIGGER esign_auto_update_status
AFTER INSERT OR UPDATE ON esign_sign_requests
FOR EACH ROW
EXECUTE FUNCTION auto_update_document_status();

-- Function: Log all changes to audit
CREATE OR REPLACE FUNCTION log_esign_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_event_type := TG_TABLE_NAME || '_created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_event_type := TG_TABLE_NAME || '_updated';
  ELSIF TG_OP = 'DELETE' THEN
    v_event_type := TG_TABLE_NAME || '_deleted';
  END IF;

  INSERT INTO esign_audit_logs (
    business_id, event_type, change_description,
    change_metadata, created_at
  ) VALUES (
    COALESCE(NEW.business_id, OLD.business_id),
    v_event_type,
    'Automatic audit log entry',
    jsonb_build_object(
      'table_name', TG_TABLE_NAME,
      'operation', TG_OP,
      'record_id', COALESCE(NEW.id, OLD.id)
    ),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Verify all tables created
SELECT 'All E-Signature tables created successfully' AS status
WHERE EXISTS (
  SELECT 1 FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN (
    'esign_documents', 'esign_sign_requests', 'esign_signatures',
    'esign_signature_fields', 'esign_signature_versions',
    'esign_audit_logs', 'esign_settings', 'esign_templates'
  )
);

COMMIT;

-- =============================================================================
-- MIGRATION VALIDATION SCRIPT
-- =============================================================================
-- Run this after all migrations to verify schema integrity

/*
SELECT
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname='public' AND tablename LIKE 'esign%') as table_count,
  (SELECT COUNT(*) FROM pg_indexes WHERE tablename LIKE 'esign%') as index_count,
  (SELECT COUNT(*) FROM esign_settings WHERE is_enabled = false) as inactive_businesses,
  NOW() as validation_timestamp;
*/

-- =============================================================================
-- ROLLBACK SCRIPT (if needed)
-- =============================================================================
-- CAUTION: This will delete all e-signature data

/*
BEGIN;

DROP TABLE IF EXISTS esign_audit_logs CASCADE;
DROP TABLE IF EXISTS esign_signature_versions CASCADE;
DROP TABLE IF EXISTS esign_signatures CASCADE;
DROP TABLE IF EXISTS esign_signature_fields CASCADE;
DROP TABLE IF EXISTS esign_sign_requests CASCADE;
DROP TABLE IF EXISTS esign_documents CASCADE;
DROP TABLE IF EXISTS esign_settings CASCADE;
DROP TABLE IF EXISTS esign_templates CASCADE;

DROP FUNCTION IF EXISTS update_document_signed_count() CASCADE;
DROP FUNCTION IF EXISTS auto_update_document_status() CASCADE;
DROP FUNCTION IF EXISTS log_esign_changes() CASCADE;

COMMIT;
*/
