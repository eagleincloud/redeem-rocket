# Quick Start - Multi-Tenancy Features

## Overview
This document provides a quick reference for using the new multi-tenancy features in your Business App.

---

## File Locations

### Core Files
```
src/business/types/team-management.ts       ← Type definitions
src/business/context/RBACContext.tsx        ← Extended context
src/business/utils/permissionHelpers.ts     ← Permission utilities
src/business/hooks/                         ← useTeamRoles, useFeaturePermissions, useDepartments
src/business/pages/                         ← TeamRoleManager, TeamFeaturePermissions, DepartmentPipelines
supabase/migrations/20260503_*.sql          ← Database schema
```

---

## Quick Usage Examples

### 1. Use RBAC Context
```typescript
import { useRBAC } from '@/business/context/RBACContext';

export function MyFeature() {
  const { canWrite, canManageRoles, currentDepartment } = useRBAC();

  if (!canWrite('leads')) return <div>No permission</div>;
  
  return (
    <div>
      {currentDepartment && <p>Department: {currentDepartment.name}</p>}
    </div>
  );
}
```

### 2. Use Team Roles Hook
```typescript
import { useTeamRoles } from '@/business/hooks';
import { useBusinessContext } from '@/business/context/BusinessContext';

export function RoleList() {
  const { bizUser } = useBusinessContext();
  const { roles, createRole, updateRole, deleteRole } = useTeamRoles(bizUser?.businessId);

  return (
    <div>
      {roles.map(role => (
        <div key={role.id}>{role.name}</div>
      ))}
    </div>
  );
}
```

### 3. Toggle Features
```typescript
import { useFeaturePermissions } from '@/business/hooks';

export function FeatureManager() {
  const { memberFeatures, toggleFeature } = useFeaturePermissions(businessId, memberId);

  return (
    <button onClick={() => toggleFeature('automation', false)}>
      Disable Automation
    </button>
  );
}
```

### 4. Manage Departments
```typescript
import { useDepartments } from '@/business/hooks';

export function DepartmentManager() {
  const { departments, createDepartment, addMemberToDepartment } = useDepartments(businessId);

  return (
    <div>
      {departments.map(dept => (
        <div key={dept.id}>{dept.name}</div>
      ))}
    </div>
  );
}
```

### 5. Permission Checking
```typescript
import { 
  canAccessFeature, 
  canManageRoles,
  resolveTeamMemberPermissions 
} from '@/business/utils/permissionHelpers';

// Check if can access feature
if (canAccessFeature(permissions, 'leads', 'write')) {
  // User can write to leads
}

// Check complex permissions
const effective = resolveTeamMemberPermissions(
  member,
  rolePermissions,
  departmentPermissions,
  memberOverrides
);

// Check management capabilities
if (canManageRoles(permissions)) {
  // Show role management UI
}
```

---

## Routes to Add

```typescript
// src/business/routes.tsx
import TeamRoleManager from '@/business/pages/TeamRoleManager';
import TeamFeaturePermissions from '@/business/pages/TeamFeaturePermissions';
import DepartmentPipelines from '@/business/pages/DepartmentPipelines';

export const routes = [
  // ... existing routes
  { path: '/app/settings/team-roles', element: <TeamRoleManager /> },
  { path: '/app/settings/feature-permissions', element: <TeamFeaturePermissions /> },
  { path: '/app/settings/departments', element: <DepartmentPipelines /> },
];
```

---

## Database Migration

```bash
# Run in Supabase SQL editor:
# supabase/migrations/20260503_multi_tenancy_enhancements.sql
```

Or use Supabase CLI:
```bash
supabase migration up
```

---

## Predefined Roles

| Role | Leads | Campaigns | Automation | Finance | Reports | Settings | Team |
|------|-------|-----------|-----------|---------|---------|----------|------|
| Owner | admin | admin | admin | admin | admin | admin | admin |
| Manager | admin | admin | admin | read | admin | read | readwrite |
| Sales Rep | readwrite | read | read | none | read | none | none |
| Support | read | none | none | none | none | none | none |
| Viewer | read | read | none | read | read | none | none |

---

## Permission Levels

- **none** - No access
- **read** - Can view only
- **readwrite** - Can view and modify
- **admin** - Full control including deletion

---

## Key Hooks Signature

### useTeamRoles
```typescript
const {
  roles: TeamRole[];
  loading: boolean;
  error: string | null;
  createRole: (role: RoleData) => Promise<TeamRole | null>;
  updateRole: (id: string, updates: Partial<RoleData>) => Promise<TeamRole | null>;
  deleteRole: (id: string) => Promise<boolean>;
  getRoleById: (id: string) => TeamRole | undefined;
  getRoleByName: (name: string) => TeamRole | undefined;
} = useTeamRoles(businessId);
```

### useFeaturePermissions
```typescript
const {
  memberFeatures: Record<string, boolean>;
  loading: boolean;
  error: string | null;
  toggleFeature: (feature: Feature, enabled: boolean) => Promise<boolean>;
  setFeatures: (features: Record<Feature, boolean>) => Promise<boolean>;
  isFeatureEnabled: (feature: Feature) => boolean;
} = useFeaturePermissions(businessId, memberId);
```

### useDepartments
```typescript
const {
  departments: Department[];
  currentDepartment: Department | null;
  loading: boolean;
  error: string | null;
  createDepartment: (name: string, desc?: string, managerId?: string) => Promise<Department | null>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<Department | null>;
  deleteDepartment: (id: string) => Promise<boolean>;
  setCurrentDepartment: (dept: Department | null) => void;
  getDepartmentById: (id: string) => Department | undefined;
  addMemberToDepartment: (deptId: string, memberId: string) => Promise<boolean>;
  removeMemberFromDepartment: (deptId: string, memberId: string) => Promise<boolean>;
  getDepartmentMembers: (deptId: string) => Promise<TeamMember[]>;
} = useDepartments(businessId);
```

---

## Permission Resolution Priority

1. **Level 1 (Base):** Role permissions
2. **Level 2 (Override):** Member-specific overrides
3. **Level 3 (Restrict):** Department restrictions (can only reduce)
4. **Result:** Effective permissions

Example:
```
Role: 'admin' on leads
Override: 'readwrite' on leads  ← Takes precedence
Department Restrict: 'read'     ← Further restricts to 'read'
Final: 'read' (most restrictive)
```

---

## Common Patterns

### Pattern 1: Conditional Rendering
```typescript
const { canWrite } = useRBAC();

if (!canWrite('reports')) {
  return <AccessDenied />;
}
```

### Pattern 2: Feature Toggle
```typescript
const { isFeatureEnabled } = useFeaturePermissions(businessId, memberId);

{isFeatureEnabled('automation') && <AutomationSection />}
```

### Pattern 3: Bulk Role Assignment
```typescript
const { createRole } = useTeamRoles(businessId);

for (const roleData of rolesToCreate) {
  await createRole(roleData);
}
```

### Pattern 4: Department Switching
```typescript
const { departments, currentDepartment, setCurrentDepartment } = useDepartments(businessId);

<select onChange={(e) => setCurrentDepartment(departments.find(d => d.id === e.target.value))}>
  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
</select>
```

---

## Debugging

### Check Effective Permissions
```typescript
import { resolveTeamMemberPermissions, summarizePermissions } from '@/business/utils';

const effective = resolveTeamMemberPermissions(member, role, dept, overrides);
console.log(summarizePermissions(effective));
// Output: "Admin: leads | Edit: campaigns | View: reports"
```

### Verify Permission Check
```typescript
import { canPerformAction } from '@/business/utils';

const level = 'readwrite';
console.log(canPerformAction(level, 'write')); // true
console.log(canPerformAction(level, 'delete')); // false
```

### List Accessible Features
```typescript
import { getAccessibleFeatures } from '@/business/utils';

const readable = getAccessibleFeatures(permissions, 'read');
console.log(readable); // ['leads', 'campaigns', 'reports', ...]
```

---

## Type Imports

```typescript
// Types
import type {
  TeamMember,
  TeamRole,
  Department,
  Feature,
  PermLevel,
  FeaturePermissions,
} from '@/business/types/team-management';

// Utilities
import {
  canAccessFeature,
  canManageRoles,
  resolveTeamMemberPermissions,
  summarizePermissions,
} from '@/business/utils/permissionHelpers';

// Hooks
import {
  useTeamRoles,
  useFeaturePermissions,
  useDepartments,
} from '@/business/hooks';
```

---

## What's Included

✓ Type definitions with full JSDoc
✓ Extended RBACContext with department support
✓ 3 production-ready custom hooks
✓ 20+ permission helper functions
✓ 3 complete UI components
✓ Database schema with RLS policies
✓ 5 predefined system roles
✓ Comprehensive audit logging
✓ Full TypeScript support

---

## Next: Run Database Migration

```bash
# In Supabase dashboard or via CLI:
psql < supabase/migrations/20260503_multi_tenancy_enhancements.sql

# Or use Supabase CLI:
supabase migration up 20260503_multi_tenancy_enhancements
```

---

## Support

For detailed information:
1. Read `MULTI_TENANCY_IMPLEMENTATION_GUIDE.md` for comprehensive docs
2. Check `src/business/types/team-management.ts` for type definitions
3. Review hook implementations for usage patterns
4. See components for UI examples

---

**Last Updated:** May 3, 2026
**Version:** 1.0
