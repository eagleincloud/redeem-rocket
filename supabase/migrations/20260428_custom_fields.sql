-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 4: CUSTOM FIELDS FRAMEWORK
-- Customizable field definitions for entities with validation and display options
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CUSTOM_FIELDS TABLE
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  field_name varchar(255) NOT NULL,
  field_slug varchar(255) NOT NULL,
  field_type varchar(50) NOT NULL CHECK (field_type IN (
    'text', 'number', 'select', 'date', 'checkbox', 'email', 'phone'
  )),
  display_type varchar(50) DEFAULT 'text',
  description text,
  is_required boolean DEFAULT false,
  is_system_field boolean DEFAULT false,
  order_index integer DEFAULT 0,
  default_value text,
  placeholder_text text,
  help_text text,

  -- Field options (for select/multiselect)
  field_options jsonb DEFAULT '[]',  -- Array of {label, value, color}

  -- Validation rules as JSON
  validation_rules jsonb DEFAULT '{}', -- {min, max, pattern, minLength, maxLength}

  -- Field visibility and conditional logic
  config jsonb DEFAULT '{
    "showInList": true,
    "showInForm": true,
    "searchable": false,
    "sortable": false,
    "conditionalLogic": null
  }',

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES biz_users(id) ON DELETE SET NULL,

  CONSTRAINT unique_field_slug UNIQUE(business_id, field_slug),
  CONSTRAINT unique_field_name UNIQUE(business_id, field_name),
  CONSTRAINT valid_field_type CHECK (field_type IN (
    'text', 'number', 'select', 'date', 'checkbox', 'email', 'phone'
  ))
);

CREATE INDEX idx_custom_fields_business ON custom_fields(business_id);
CREATE INDEX idx_custom_fields_slug ON custom_fields(business_id, field_slug);
CREATE INDEX idx_custom_fields_type ON custom_fields(business_id, field_type);
CREATE INDEX idx_custom_fields_order ON custom_fields(business_id, order_index);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. ENTITY_CUSTOM_VALUES TABLE
-- Values for custom fields on entities (leads, contacts, deals, etc.)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS entity_custom_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL,  -- UUID of the entity (lead, contact, etc)
  entity_type varchar(50) NOT NULL,  -- lead, contact, deal, customer, etc
  field_id uuid NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value text,  -- Stored as text, parsed based on field_type
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_entity_field UNIQUE(entity_id, field_id)
);

CREATE INDEX idx_entity_values_business ON entity_custom_values(business_id);
CREATE INDEX idx_entity_values_entity ON entity_custom_values(entity_id, entity_type);
CREATE INDEX idx_entity_values_field ON entity_custom_values(field_id);
CREATE INDEX idx_entity_values_created ON entity_custom_values(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_custom_values ENABLE ROW LEVEL SECURITY;

-- Custom fields RLS: Users can only access fields for their business
CREATE POLICY "custom_fields_isolation"
  ON custom_fields FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

-- Entity values RLS: Users can only access values for their business
CREATE POLICY "entity_values_isolation"
  ON entity_custom_values FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON custom_fields TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON entity_custom_values TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Validate custom field constraints
CREATE OR REPLACE FUNCTION validate_custom_field_value(
  p_field_id uuid,
  p_value text
) RETURNS boolean AS $$
DECLARE
  v_field custom_fields%ROWTYPE;
  v_rules jsonb;
BEGIN
  SELECT * INTO v_field FROM custom_fields WHERE id = p_field_id;

  IF v_field IS NULL THEN
    RETURN false;
  END IF;

  -- Null check
  IF p_value IS NULL THEN
    RETURN NOT v_field.is_required;
  END IF;

  v_rules := v_field.validation_rules;

  -- Type-specific validation
  CASE v_field.field_type
    WHEN 'email' THEN
      RETURN p_value ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$';
    WHEN 'phone' THEN
      RETURN length(regexp_replace(p_value, '[^0-9]', '', 'g')) >= 10;
    WHEN 'number' THEN
      BEGIN
        PERFORM p_value::numeric;
        RETURN true;
      EXCEPTION WHEN OTHERS THEN
        RETURN false;
      END;
    WHEN 'date' THEN
      BEGIN
        PERFORM p_value::date;
        RETURN true;
      EXCEPTION WHEN OTHERS THEN
        RETURN false;
      END;
    ELSE
      RETURN true;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create trigger to validate on insert/update
CREATE OR REPLACE FUNCTION check_custom_field_value_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT validate_custom_field_value(NEW.field_id, NEW.value) THEN
    RAISE EXCEPTION 'Invalid value for custom field %', NEW.field_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_field_value_validation
  BEFORE INSERT OR UPDATE ON entity_custom_values
  FOR EACH ROW
  EXECUTE FUNCTION check_custom_field_value_on_insert();

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. INITIAL COMMENT
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE custom_fields IS 'User-defined fields for customizing entity forms and displays';
COMMENT ON TABLE entity_custom_values IS 'Values stored for custom fields on individual entities';
COMMENT ON COLUMN custom_fields.field_type IS 'Field type: text, number, select, date, checkbox, email, phone';
COMMENT ON COLUMN custom_fields.field_options IS 'For select fields: [{label, value, color}]';
COMMENT ON COLUMN custom_fields.validation_rules IS 'JSON object with validation constraints';
