-- ═══════════════════════════════════════════════════════════════════════════
-- PHASE 4: ENHANCED ROLE-BASED ACCESS CONTROL (RBAC)
-- Granular permissions per entity type with field-level control
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. ROLE_PERMISSIONS TABLE
-- Granular permission matrix: role → entity → action
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES business_roles(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL,  -- lead, contact, deal, invoice, etc.
  action varchar(20) NOT NULL,  -- create, read, update, delete, export

  -- Field-level permissions (JSON array of field slugs)
  readable_fields jsonb DEFAULT '[]',   -- Fields user can read
  editable_fields jsonb DEFAULT '[]',   -- Fields user can edit

  -- Scoping rules
  scope varchar(50) DEFAULT 'all' CHECK (scope IN (
    'all',                    -- Can access all entities
    'own_team',              -- Only entities from own team
    'assigned_only',         -- Only assigned to them
    'created_by_user',       -- Only entities they created
    'owned_by_department'    -- Entities in their department
  )),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT unique_role_permission UNIQUE(role_id, entity_type, action),
  CONSTRAINT valid_action CHECK (action IN ('create', 'read', 'update', 'delete', 'export'))
);

CREATE INDEX idx_role_permissions_business ON role_permissions(business_id);
CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_entity ON role_permissions(entity_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. USER_ROLES TABLE
-- Explicit user → role assignment per business
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES business_roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES biz_users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),

  CONSTRAINT unique_user_role UNIQUE(business_id, user_id, role_id)
);

CREATE INDEX idx_user_roles_business ON user_roles(business_id);
CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ROLE_PERMISSION_EXCEPTIONS TABLE
-- Override permissions for specific users (above roles)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS role_permission_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES biz_users(id) ON DELETE CASCADE,
  entity_type varchar(50) NOT NULL,
  action varchar(20) NOT NULL,
  is_allowed boolean NOT NULL,
  reason text,
  expires_at timestamptz,
  created_by uuid REFERENCES biz_users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),

  CONSTRAINT unique_exception UNIQUE(user_id, entity_type, action)
);

CREATE INDEX idx_exceptions_business ON role_permission_exceptions(business_id);
CREATE INDEX idx_exceptions_user ON role_permission_exceptions(user_id);
CREATE INDEX idx_exceptions_expires ON role_permission_exceptions(expires_at);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permission_exceptions ENABLE ROW LEVEL SECURITY;

-- Role permissions isolation
CREATE POLICY "role_permissions_isolation"
  ON role_permissions FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

-- User roles isolation
CREATE POLICY "user_roles_isolation"
  ON user_roles FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

-- Permission exceptions isolation
CREATE POLICY "exceptions_isolation"
  ON role_permission_exceptions FOR ALL
  USING (business_id = auth.uid()::uuid)
  WITH CHECK (business_id = auth.uid()::uuid);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. GRANTS
-- ═══════════════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_permission_exceptions TO authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Check if a user has permission for an action on an entity type
CREATE OR REPLACE FUNCTION check_user_permission(
  p_user_id uuid,
  p_business_id uuid,
  p_entity_type varchar,
  p_action varchar
) RETURNS boolean AS $$
DECLARE
  v_has_permission boolean := false;
BEGIN
  -- Check for explicit exceptions first (overrides roles)
  SELECT is_allowed INTO v_has_permission
  FROM role_permission_exceptions
  WHERE user_id = p_user_id
    AND business_id = p_business_id
    AND entity_type = p_entity_type
    AND action = p_action
    AND (expires_at IS NULL OR expires_at > now());

  IF FOUND THEN
    RETURN v_has_permission;
  END IF;

  -- Check role permissions
  SELECT DISTINCT TRUE INTO v_has_permission
  FROM role_permissions rp
  JOIN user_roles ur ON rp.role_id = ur.role_id
  WHERE ur.user_id = p_user_id
    AND ur.business_id = p_business_id
    AND rp.entity_type = p_entity_type
    AND rp.action = p_action;

  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get all roles for a user in a business
CREATE OR REPLACE FUNCTION get_user_roles(
  p_user_id uuid,
  p_business_id uuid
) RETURNS TABLE(role_id uuid, role_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role_id, br.name
  FROM user_roles ur
  JOIN business_roles br ON ur.role_id = br.id
  WHERE ur.user_id = p_user_id
    AND ur.business_id = p_business_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get readable fields for a user on an entity
CREATE OR REPLACE FUNCTION get_readable_fields(
  p_user_id uuid,
  p_business_id uuid,
  p_entity_type varchar
) RETURNS jsonb AS $$
DECLARE
  v_fields jsonb := '[]'::jsonb;
BEGIN
  SELECT jsonb_agg(DISTINCT field)
  INTO v_fields
  FROM (
    SELECT jsonb_array_elements(readable_fields)::text as field
    FROM role_permissions rp
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.business_id = p_business_id
      AND rp.entity_type = p_entity_type
      AND rp.action = 'read'
  ) fields;

  RETURN COALESCE(v_fields, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

-- Get editable fields for a user on an entity
CREATE OR REPLACE FUNCTION get_editable_fields(
  p_user_id uuid,
  p_business_id uuid,
  p_entity_type varchar
) RETURNS jsonb AS $$
DECLARE
  v_fields jsonb := '[]'::jsonb;
BEGIN
  SELECT jsonb_agg(DISTINCT field)
  INTO v_fields
  FROM (
    SELECT jsonb_array_elements(editable_fields)::text as field
    FROM role_permissions rp
    JOIN user_roles ur ON rp.role_id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND ur.business_id = p_business_id
      AND rp.entity_type = p_entity_type
      AND rp.action = 'update'
  ) fields;

  RETURN COALESCE(v_fields, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. DEFAULT ROLES AND PERMISSIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Create default roles if they don't exist
-- These are sample roles - actual businesses can customize them
-- Admin role: full access to everything
-- Manager role: can create/read/update most entities
-- Team Member role: can create/read/update assigned entities
-- Viewer role: read-only access

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE role_permissions IS 'Defines what actions specific roles can perform on specific entity types';
COMMENT ON TABLE user_roles IS 'Maps users to roles within a business';
COMMENT ON TABLE role_permission_exceptions IS 'Temporary or permanent overrides to role-based permissions';
COMMENT ON COLUMN role_permissions.scope IS 'Controls entity access scope: all, own_team, assigned_only, created_by_user, owned_by_department';
COMMENT ON COLUMN role_permissions.readable_fields IS 'JSON array of custom field slugs that users with this role can read';
COMMENT ON COLUMN role_permissions.editable_fields IS 'JSON array of custom field slugs that users with this role can edit';
