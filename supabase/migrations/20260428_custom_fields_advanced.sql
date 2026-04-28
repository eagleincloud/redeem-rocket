-- ═══════════════════════════════════════════════════════════════════════════
-- ADVANCED CUSTOM FIELDS SYSTEM
-- Enhanced validation, permissions, and conditional logic
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. FIELD VALIDATION RULES TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS field_validation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  rule_type varchar(50) NOT NULL,
  rule_value text,
  error_message text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_field_rule UNIQUE(field_id, rule_type)
);

CREATE INDEX idx_field_validation_business ON field_validation_rules(business_id);
CREATE INDEX idx_field_validation_field ON field_validation_rules(field_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. FIELD CONDITIONAL LOGIC TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS field_conditional_logic (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  trigger_field_id uuid REFERENCES custom_fields(id) ON DELETE CASCADE,
  condition_type varchar(50) NOT NULL,
  condition_value text,
  action varchar(50) NOT NULL,
  action_value text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_field_conditional_business ON field_conditional_logic(business_id);
CREATE INDEX idx_field_conditional_field ON field_conditional_logic(field_id);
CREATE INDEX idx_field_conditional_trigger ON field_conditional_logic(trigger_field_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. FIELD PERMISSION MATRIX TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS field_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  role_id uuid,
  permission_type varchar(50) NOT NULL,
  entity_type varchar(50),
  condition_json jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_field_role_permission UNIQUE(field_id, role_id, permission_type)
);

CREATE INDEX idx_field_permissions_business ON field_permissions(business_id);
CREATE INDEX idx_field_permissions_field ON field_permissions(field_id);
CREATE INDEX idx_field_permissions_role ON field_permissions(role_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. FIELD AUDIT LOG TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS field_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  field_id uuid REFERENCES custom_fields(id) ON DELETE CASCADE,
  entity_id uuid,
  entity_type varchar(50),
  old_value text,
  new_value text,
  changed_by uuid,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_field_audit_business ON field_audit_log(business_id);
CREATE INDEX idx_field_audit_entity ON field_audit_log(entity_id, entity_type);
CREATE INDEX idx_field_audit_created ON field_audit_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. FIELD DISPLAY PRESETS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS field_display_presets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  preset_name varchar(255) NOT NULL,
  preset_slug varchar(255) NOT NULL,
  display_config jsonb NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_preset_slug UNIQUE(business_id, preset_slug)
);

CREATE INDEX idx_field_presets_business ON field_display_presets(business_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE field_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_conditional_logic ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_display_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "validation_rules_isolation"
  ON field_validation_rules FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

CREATE POLICY "conditional_logic_isolation"
  ON field_conditional_logic FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

CREATE POLICY "field_permissions_isolation"
  ON field_permissions FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

CREATE POLICY "audit_log_isolation"
  ON field_audit_log FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

CREATE POLICY "display_presets_isolation"
  ON field_display_presets FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON field_validation_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON field_conditional_logic TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON field_permissions TO authenticated;
GRANT SELECT ON field_audit_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON field_display_presets TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE field_validation_rules IS 'Validation rules for custom fields';
COMMENT ON TABLE field_conditional_logic IS 'Conditional field logic and automation';
COMMENT ON TABLE field_permissions IS 'Role-based access control for fields';
COMMENT ON TABLE field_audit_log IS 'Audit trail of all field changes';
COMMENT ON TABLE field_display_presets IS 'Field display configuration presets';
