-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 3: CONFIGURABLE SYSTEM - COMPLETE DATABASE SCHEMA
-- Production-grade customization engine for Redeem Rocket
-- Created: 2026-04-25
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CUSTOM FIELDS TABLE - User-defined fields for pipelines/entities
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  field_name varchar(255) NOT NULL,
  field_slug varchar(255) NOT NULL,
  field_type varchar(50) NOT NULL CHECK (field_type IN (
    'text', 'number', 'date', 'dropdown', 'multiselect',
    'checkbox', 'email', 'phone', 'url', 'rich_text'
  )),
  display_type varchar(50) DEFAULT 'text',
  description text,
  is_required boolean DEFAULT false,
  is_system_field boolean DEFAULT false,
  order_index integer DEFAULT 0,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES biz_users(id) ON DELETE SET NULL,

  CONSTRAINT unique_field_slug UNIQUE(business_id, field_slug),
  CONSTRAINT unique_field_name UNIQUE(business_id, field_name),
  CONSTRAINT valid_field_type CHECK (field_type IN (
    'text', 'number', 'date', 'dropdown', 'multiselect',
    'checkbox', 'email', 'phone', 'url', 'rich_text'
  ))
);

CREATE INDEX idx_custom_fields_business ON custom_fields(business_id);
CREATE INDEX idx_custom_fields_slug ON custom_fields(business_id, field_slug);
CREATE INDEX idx_custom_fields_type ON custom_fields(business_id, field_type);
CREATE INDEX idx_custom_fields_order ON custom_fields(business_id, order_index);

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS ENABLE
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY custom_fields_business_isolation
ON custom_fields FOR ALL
USING (business_id = auth.uid()::uuid)
WITH CHECK (business_id = auth.uid()::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE ON custom_fields TO authenticated;
