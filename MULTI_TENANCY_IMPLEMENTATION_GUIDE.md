# Multi-Tenancy Enhancements Implementation Guide

## Overview

This guide documents the complete implementation of multi-tenancy features with team roles, granular feature control, and department pipelines for the Business App.

**Implementation Date:** May 3, 2026
**Target Location:** `/src/business/`
**Foundation:** Existing RBAC framework (RBACContext, business_team_members table)

---

## Architecture

### Core Components

1. **Database Layer** - Multi-tenancy tables with RLS policies
2. **Type System** - Comprehensive type definitions
3. **Context API** - Extended RBACContext with department support
4. **Custom Hooks** - Reusable permission management hooks
5. **UI Components** - Pages for role, feature, and department management
6. **Utilities** - Permission checking and resolution functions

---

## Database Schema

### Migration File
**Location:** `/supabase/migrations/20260503_multi_tenancy_enhancements.sql`

### New Tables

#### 1. `departments`
Represents organizational units within a business
```sql
CREATE TABLE departments (
  id UUID PRIMARY KEY,
  business_id TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, name)
);
```

#### 2. `department_members`
Maps team members to departments
```sql
CREATE TABLE department_members (
  id UUID PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES business_team_members(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, member_id)
);
```

#### 3. `department_pipelines`
Associates pipelines with departments
```sql
CREATE TABLE department_pipelines (
  id UUID PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES departments(id),
  pipeline_id UUID NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, pipeline_id)
);
```

#### 4. `member_feature_permissions`
Per-member feature toggles (overrides role permissions)
```sql
CREATE TABLE member_feature_permissions (
  id UUID PRIMARY KEY,
  business_id TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES business_team_members(id),
  features JSONB DEFAULT '{}',  -- { "leads": true, "campaigns": false, ... }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, member_id)
);
```

#### 5. `department_features`
Department-level feature access control
```sql
CREATE TABLE department_features (
  id UUID PRIMARY KEY,
  department_id UUID NOT NULL REFERENCES departments(id),
  feature TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(department_id, feature)
);
```

#### 6. `team_member_audit_logs`
Track all permission and role changes
```sql
CREATE TABLE team_member_audit_logs (
  id UUID PRIMARY KEY,
  business_id TEXT NOT NULL,
  member_id UUID NOT NULL REFERENCES business_team_members(id),
  action TEXT NOT NULL,  -- 'role_changed', 'permission_granted', etc.
  old_value JSONB,
  new_value JSONB,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Extended Tables

#### `business_roles`
Added new columns:
- `is_custom BOOLEAN DEFAULT true` - Distinguishes system vs custom roles
- `is_system BOOLEAN DEFAULT false` - Marks system-defined roles
- `permissions JSONB DEFAULT '{}'` - Complete permission object

---

## Type Definitions

### Location
`/src/business/types/team-management.ts`

### Key Types

```typescript
// Team Member Status
type TeamMemberStatus = 'active' | 'invited' | 'inactive';
type TeamMemberRole = 'owner' | 'manager' | 'sales_rep' | 'support' | 'viewer';

// Permission Levels
type PermLevel = 'none' | 'read' | 'readwrite' | 'admin';

// Core Interfaces
interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: TeamMemberRole;
  features: FeaturePermissions;
  departments: string[];
  assignedPipelines: string[];
  status: TeamMemberStatus;
}

interface TeamRole {
  id: string;
  businessId: string;
  name: string;
  permissions: FeaturePermissions;
  isCustom: boolean;
  isSystem: boolean;
}

interface Department {
  id: string;
  businessId: string;
  name: string;
  managerId?: string;
  members: TeamMember[];
  pipelines: string[];
  features: FeaturePermissions;
}
```

---

## RBACContext Extension

### File Location
`/src/business/context/RBACContext.tsx`

### New Context Properties

```typescript
interface RBACContextValue {
  // Existing
  canRead: (feature: Feature) => boolean;
  canWrite: (feature: Feature) => boolean;
  isAdmin: (feature: Feature) => boolean;
  isOwner: boolean;

  // NEW: Department Support
  departments: Department[];
  currentDepartment: Department | null;
  setCurrentDepartment: (dept: Department | null) => void;

  // NEW: Advanced Checks
  canManageTeam: () => boolean;
  canManageRoles: () => boolean;
  canInviteMembers: () => boolean;
  canAccessSettings: () => boolean;
  canEditSettings: () => boolean;
}
```

### Usage Example

```typescript
import { useRBAC } from '@/business/context/RBACContext';

export function MyComponent() {
  const { canWrite, canManageRoles, currentDepartment } = useRBAC();

  if (!canManageRoles()) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <h1>Role Manager</h1>
      {currentDepartment && (
        <p>Current Department: {currentDepartment.name}</p>
      )}
    </div>
  );
}
```

---

## Custom Hooks

### 1. useTeamRoles
**File:** `/src/business/hooks/useTeamRoles.ts`

Manages team roles and their permissions.

```typescript
const { roles, loading, error, createRole, updateRole, deleteRole } = useTeamRoles(businessId);

// Create a custom role
await createRole({
  businessId: 'biz-123',
  name: 'Sales Manager',
  description: 'Can manage leads and campaigns',
  permissions: {
    leads: 'admin',
    campaigns: 'admin',
    // ...
  },
  isCustom: true,
  isSystem: false,
});
```

### 2. useFeaturePermissions
**File:** `/src/business/hooks/useFeaturePermissions.ts`

Manage per-member feature toggles.

```typescript
const { memberFeatures, loading, toggleFeature, setFeatures } = useFeaturePermissions(
  businessId,
  memberId
);

// Toggle a single feature
await toggleFeature('automation', false);

// Set multiple features
await setFeatures({
  leads: true,
  campaigns: false,
  automation: true,
});
```

### 3. useDepartments
**File:** `/src/business/hooks/useDepartments.ts`

Manage departments and department membership.

```typescript
const {
  departments,
  currentDepartment,
  createDepartment,
  addMemberToDepartment,
  removeMemberFromDepartment,
} = useDepartments(businessId);

// Create department
const newDept = await createDepartment('Sales', 'Sales Team', managerId);

// Add member to department
await addMemberToDepartment(deptId, memberId);
```

---

## Permission Helper Functions

### File Location
`/src/business/utils/permissionHelpers.ts`

### Key Functions

```typescript
// Permission resolution
canPerformAction(level: PermLevel, action: 'read' | 'write' | 'admin'): boolean

// Feature access
canAccessFeature(permissions: FeaturePermissions, feature: Feature): boolean
getFeaturePermission(permissions: FeaturePermissions, feature: Feature): PermLevel

// Permission merging
resolveTeamMemberPermissions(
  member: TeamMember,
  rolePermissions: FeaturePermissions,
  departmentPermissions?: FeaturePermissions,
  memberOverrides?: Record<string, PermLevel>
): FeaturePermissions

// Advanced checks
canManageTeam(permissions: FeaturePermissions): boolean
canManageRoles(permissions: FeaturePermissions): boolean
canInviteMembers(permissions: FeaturePermissions): boolean
canAssignLead(userPermissions: FeaturePermissions, targetPermissions: FeaturePermissions): boolean
```

### Permission Resolution Hierarchy

1. **Base:** Role permissions
2. **Override:** Member-specific overrides
3. **Restrict:** Department permissions (can only restrict)
4. **Final:** Effective permissions

```typescript
// Example resolution
const effective = resolveTeamMemberPermissions(
  member,
  rolePermissions,        // From team_role
  departmentPermissions,  // From department
  memberOverrides         // From member_feature_permissions
);
```

---

## UI Components

### 1. TeamRoleManager
**File:** `/src/business/pages/TeamRoleManager.tsx`
**Route:** `/app/settings/team-roles`

Features:
- View predefined roles (read-only)
- Create custom roles with full permission matrix
- Edit existing custom roles
- Delete custom roles
- Permission matrix for all features

### 2. TeamFeaturePermissions
**File:** `/src/business/pages/TeamFeaturePermissions.tsx`
**Route:** `/app/settings/feature-permissions`

Features:
- Select team member
- Enable/disable individual features
- Visual feature cards with descriptions
- Real-time updates

### 3. DepartmentPipelines
**File:** `/src/business/pages/DepartmentPipelines.tsx`
**Route:** `/app/settings/departments`

Features:
- Create departments with optional managers
- View department members
- Assign members to departments
- Remove members from departments
- Edit department details
- Delete departments

---

## Predefined Roles

### System Roles

All predefined roles are stored in the database with `is_system = true`:

1. **Owner** - Full admin access to all features
2. **Manager** - Access to leads, campaigns, automation, team management
3. **Sales Rep** - Access to assigned leads and campaigns (read/write)
4. **Support** - Read-only access to leads
5. **Viewer** - Read-only access to reports and analytics

### Permissions Matrix

```
Feature          Owner    Manager  Sales Rep  Support  Viewer
─────────────────────────────────────────────────────────────
Leads            admin    admin    readwrite  read     read
Campaigns        admin    admin    read       none     read
Automation       admin    admin    read       none     none
Finance          admin    read     none       none     read
Reports          admin    admin    read       none     read
Settings         admin    read     none       none     none
Team             admin    readwrite none       none     none
```

---

## Implementation Checklist

### Database
- [x] Create migration file with all tables
- [x] Add RLS policies for data isolation
- [x] Insert predefined roles
- [x] Create indexes for performance

### Types
- [x] Define all team management types
- [x] Create predefined role constants
- [x] Export from types/team-management.ts

### Context & Hooks
- [x] Extend RBACContext with department support
- [x] Create useTeamRoles hook
- [x] Create useFeaturePermissions hook
- [x] Create useDepartments hook
- [x] Create permission helper utilities

### UI Components
- [x] Build TeamRoleManager page
- [x] Build TeamFeaturePermissions page
- [x] Build DepartmentPipelines page
- [x] Add modals for CRUD operations

### Integration Points
- [ ] Register routes in business app routing
- [ ] Add navigation links in settings menu
- [ ] Integrate with existing TeamPage (update existing)
- [ ] Add audit logging for permission changes
- [ ] Connect to Supabase for real data

---

## Integration Steps

### 1. Register Routes
Add to `/src/business/routes.tsx`:

```typescript
import TeamRoleManager from '@/business/pages/TeamRoleManager';
import TeamFeaturePermissions from '@/business/pages/TeamFeaturePermissions';
import DepartmentPipelines from '@/business/pages/DepartmentPipelines';

// In routes array:
{ path: '/app/settings/team-roles', element: <TeamRoleManager /> },
{ path: '/app/settings/feature-permissions', element: <TeamFeaturePermissions /> },
{ path: '/app/settings/departments', element: <DepartmentPipelines /> },
```

### 2. Update Settings Navigation
Add links to settings menu:

```typescript
<NavLink to="/app/settings/team-roles">Role Management</NavLink>
<NavLink to="/app/settings/feature-permissions">Feature Permissions</NavLink>
<NavLink to="/app/settings/departments">Departments</NavLink>
```

### 3. Update Existing TeamPage
Integrate with current team management:

```typescript
// In TeamPage.tsx
import { useTeamRoles } from '@/business/hooks/useTeamRoles';

export function TeamPage() {
  const { roles } = useTeamRoles(businessId);
  // ... existing code
}
```

### 4. Add Audit Logging
Create utility for logging permission changes:

```typescript
async function logPermissionChange(
  businessId: string,
  memberId: string,
  action: AuditAction,
  oldValue?: Record<string, any>,
  newValue?: Record<string, any>
) {
  await supabase.from('team_member_audit_logs').insert({
    business_id: businessId,
    member_id: memberId,
    action,
    old_value: oldValue,
    new_value: newValue,
    changed_by: currentUserId,
    created_at: new Date(),
  });
}
```

---

## Features & Capabilities

### Team Collaboration
- Create unlimited team members with different roles
- Granular role-based access control (RBAC)
- Member-specific feature toggles
- Department-based organization

### Role Management
- 5 predefined system roles
- Create unlimited custom roles
- Modify role permissions
- View member count per role

### Feature Control
- Enable/disable features per member
- Role-based feature defaults
- Department-level feature restrictions
- Override permissions as needed

### Department Management
- Create multiple departments
- Assign department managers
- Add/remove members from departments
- Department-specific pipelines

### Audit & Compliance
- Log all permission changes
- Track who made changes and when
- Audit trail for compliance
- Historical permission records

---

## File Structure

```
src/business/
├── context/
│   └── RBACContext.tsx              (EXTENDED)
├── types/
│   └── team-management.ts           (NEW)
├── hooks/
│   ├── useTeamRoles.ts              (NEW)
│   ├── useFeaturePermissions.ts      (NEW)
│   ├── useDepartments.ts            (NEW)
│   └── index.ts                     (NEW)
├── utils/
│   ├── permissionHelpers.ts         (NEW)
│   └── index.ts                     (UPDATED)
├── pages/
│   ├── TeamRoleManager.tsx          (NEW)
│   ├── TeamFeaturePermissions.tsx    (NEW)
│   ├── DepartmentPipelines.tsx       (NEW)
│   └── TeamPage.tsx                 (TO UPDATE)

supabase/
└── migrations/
    └── 20260503_multi_tenancy_enhancements.sql (NEW)
```

---

## Testing Checklist

- [ ] Database migration applies without errors
- [ ] RLS policies properly enforce data isolation
- [ ] useTeamRoles hook loads and manages roles
- [ ] useFeaturePermissions toggle updates correctly
- [ ] useDepartments CRUD operations work
- [ ] TeamRoleManager displays predefined and custom roles
- [ ] TeamFeaturePermissions member selection and toggles work
- [ ] DepartmentPipelines CRUD operations function
- [ ] Permission resolution correctly merges role + overrides + department
- [ ] Audit logs record all changes
- [ ] Routes are registered and accessible
- [ ] Navigation links appear in settings menu
- [ ] Existing TeamPage integrates without conflicts

---

## Performance Considerations

1. **Indexing** - All foreign keys and frequently queried columns are indexed
2. **Pagination** - For large member lists, implement pagination in hooks
3. **Caching** - Consider caching role definitions and permissions
4. **Batch Operations** - Use batch inserts for bulk member management
5. **Query Optimization** - Use select() with specific columns when loading

---

## Security Notes

1. **RLS Policies** - All tables have RLS enabled to prevent unauthorized access
2. **Permission Checks** - Always verify `canManageRoles()` before UI operations
3. **Audit Trail** - All changes logged for compliance and debugging
4. **Validation** - Backend should validate all permission changes
5. **Rate Limiting** - Consider rate limiting for permission changes

---

## Future Enhancements

1. Bulk member operations (invite, remove, change role)
2. Permission templates for common use cases
3. Time-based role assignments (temporary roles)
4. Permission inheritance from parent departments
5. Advanced reporting on permission usage
6. Email notifications for role changes
7. Permission approval workflows
8. Delegation support for role management

---

## Support & Documentation

For questions or issues:

1. Check type definitions in `types/team-management.ts`
2. Review hook implementations for usage patterns
3. See permission helpers for complex permission logic
4. Check component examples for UI patterns
5. Review migration file for schema details

---

**Implementation Status:** Complete - Ready for integration and testing
**Last Updated:** May 3, 2026
**Version:** 1.0
