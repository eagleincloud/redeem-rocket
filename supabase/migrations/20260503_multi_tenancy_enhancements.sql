-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- Department Members
CREATE TABLE department_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, member_id)
);

-- Department Pipelines
CREATE TABLE department_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES business_pipelines(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, pipeline_id)
);

-- Member Feature Permissions
CREATE TABLE member_feature_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  permissions JSONB DEFAULT '{"leads": true, "campaigns": true, "automation": true, "team": false, "reports": true, "settings": false}',
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id, member_id)
);

-- Custom Roles
CREATE TABLE custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  permissions JSONB NOT NULL,
  is_system BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);

-- Team Member Audit Logs
CREATE TABLE team_member_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  action VARCHAR(100),
  member_id UUID REFERENCES auth.users(id),
  details JSONB,

  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  INDEX (business_id, created_at)
);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_feature_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_member_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Team can view own business departments"
  ON departments FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Business owner can manage departments"
  ON departments FOR ALL
  USING (business_id IN (
    SELECT business_id FROM biz_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team can view own business department members"
  ON department_members FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own feature permissions"
  ON member_feature_permissions FOR SELECT
  USING (member_id = auth.uid() OR business_id IN (
    SELECT business_id FROM biz_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team can view custom roles"
  ON custom_roles FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM team_members
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Business owner can manage custom roles"
  ON custom_roles FOR ALL
  USING (business_id IN (
    SELECT business_id FROM biz_users
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team can view audit logs for own business"
  ON team_member_audit_logs FOR SELECT
  USING (business_id IN (
    SELECT business_id FROM biz_users
    WHERE user_id = auth.uid()
  ));
