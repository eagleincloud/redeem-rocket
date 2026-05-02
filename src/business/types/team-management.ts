/**
 * Team Management Types
 * Defines types for RBAC, roles, departments, and team collaboration features
 */

// ── Team Member Types ────────────────────────────────────────────────────────

export type TeamMemberStatus = 'active' | 'invited' | 'inactive';
export type TeamMemberRole = 'owner' | 'manager' | 'sales_rep' | 'support' | 'viewer';

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: TeamMemberRole;
  roleId?: string;  // Reference to custom role if using custom roles
  features: FeaturePermissions;
  departments: string[];  // Department IDs
  assignedPipelines: string[];
  permissions?: Record<string, PermLevel>;  // Override permissions
  createdAt: Date;
  status: TeamMemberStatus;
  invitedAt?: Date;
  joinedAt?: Date;
}

// ── Role Types ───────────────────────────────────────────────────────────────

export type PermLevel = 'none' | 'read' | 'readwrite' | 'admin';

export type Feature =
  | 'leads'
  | 'campaigns'
  | 'automation'
  | 'finance'
  | 'reports'
  | 'settings'
  | 'team'
  | 'analytics'
  | 'invoices'
  | 'notifications'
  | 'auctions'
  | 'requirements';

export interface FeaturePermissions {
  leads: PermLevel;
  campaigns: PermLevel;
  automation: PermLevel;
  finance: PermLevel;
  reports: PermLevel;
  settings: PermLevel;
  team: PermLevel;
  analytics?: PermLevel;
  invoices?: PermLevel;
  notifications?: PermLevel;
  auctions?: PermLevel;
  requirements?: PermLevel;
}

export interface TeamRole {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  permissions: FeaturePermissions;
  isCustom: boolean;
  isSystem: boolean;
  createdAt: Date;
  memberCount?: number;  // Number of team members with this role
}

export interface RolePermissions {
  leads: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    assign: boolean;
    moveStage: boolean;
  };
  campaigns: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    send: boolean;
  };
  automation: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    execute: boolean;
  };
  team: {
    viewMembers: boolean;
    inviteMembers: boolean;
    removeMembers: boolean;
    manageRoles: boolean;
  };
  reports: {
    view: boolean;
    export: boolean;
  };
  settings: {
    view: boolean;
    edit: boolean;
  };
}

// ── Department Types ────────────────────────────────────────────────────────

export interface Department {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  managerId?: string;
  members: TeamMember[];
  pipelines: string[];  // Pipeline IDs
  features: FeaturePermissions;  // Inherited by all members
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentPipeline {
  id: string;
  departmentId: string;
  pipelineId: string;
  isPrimary: boolean;
  createdAt: Date;
}

// ── Feature Control Types ───────────────────────────────────────────────────

export interface MemberFeaturePermissions {
  id: string;
  businessId: string;
  memberId: string;
  features: Record<string, boolean>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentFeatureAccess {
  id: string;
  departmentId: string;
  feature: Feature;
  enabled: boolean;
  createdAt: Date;
}

// ── Audit Log Types ────────────────────────────────────────────────────────

export type AuditAction =
  | 'role_changed'
  | 'permission_granted'
  | 'permission_revoked'
  | 'department_added'
  | 'department_removed'
  | 'feature_enabled'
  | 'feature_disabled'
  | 'member_invited'
  | 'member_removed';

export interface TeamMemberAuditLog {
  id: string;
  businessId: string;
  memberId: string;
  action: AuditAction;
  oldValue?: Record<string, any>;
  newValue?: Record<string, any>;
  changedBy?: string;
  createdAt: Date;
}

// ── Predefined Role Presets ─────────────────────────────────────────────────

export const PREDEFINED_ROLES: Record<string, Omit<TeamRole, 'id' | 'businessId' | 'createdAt'>> = {
  owner: {
    name: 'Owner',
    description: 'Full access to all features',
    permissions: {
      leads: 'admin',
      campaigns: 'admin',
      automation: 'admin',
      finance: 'admin',
      reports: 'admin',
      settings: 'admin',
      team: 'admin',
    },
    isCustom: false,
    isSystem: true,
  },
  manager: {
    name: 'Manager',
    description: 'Access to leads, campaigns, automation, team management',
    permissions: {
      leads: 'admin',
      campaigns: 'admin',
      automation: 'admin',
      finance: 'read',
      reports: 'admin',
      settings: 'read',
      team: 'readwrite',
    },
    isCustom: false,
    isSystem: true,
  },
  sales_rep: {
    name: 'Sales Rep',
    description: 'Access to assigned leads and campaigns',
    permissions: {
      leads: 'readwrite',
      campaigns: 'read',
      automation: 'read',
      finance: 'none',
      reports: 'read',
      settings: 'none',
      team: 'none',
    },
    isCustom: false,
    isSystem: true,
  },
  support: {
    name: 'Support',
    description: 'Access to support tickets and issues',
    permissions: {
      leads: 'read',
      campaigns: 'none',
      automation: 'none',
      finance: 'none',
      reports: 'none',
      settings: 'none',
      team: 'none',
    },
    isCustom: false,
    isSystem: true,
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to reports and analytics',
    permissions: {
      leads: 'read',
      campaigns: 'read',
      automation: 'none',
      finance: 'read',
      reports: 'read',
      settings: 'none',
      team: 'none',
    },
    isCustom: false,
    isSystem: true,
  },
};
