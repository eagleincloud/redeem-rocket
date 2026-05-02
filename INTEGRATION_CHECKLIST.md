# Multi-Tenancy Integration Checklist

## Pre-Integration Review

- [ ] Review `MULTI_TENANCY_SUMMARY.md` for overview
- [ ] Read `QUICK_START_MULTI_TENANCY.md` for quick reference
- [ ] Check `MULTI_TENANCY_IMPLEMENTATION_GUIDE.md` for details

## Database Setup

- [ ] Access Supabase dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy entire content of `supabase/migrations/20260503_multi_tenancy_enhancements.sql`
- [ ] Run the migration
- [ ] Verify all tables created:
  - [ ] `departments`
  - [ ] `department_members`
  - [ ] `department_pipelines`
  - [ ] `member_feature_permissions`
  - [ ] `department_features`
  - [ ] `team_member_audit_logs`
- [ ] Verify `business_roles` extended with new columns
- [ ] Verify RLS policies applied to all tables
- [ ] Verify indexes created
- [ ] Verify 5 predefined roles inserted

## Frontend Integration

### 1. Update Routes

**File:** `src/business/routes.tsx`

```typescript
// Add imports at top
import TeamRoleManager from '@/business/pages/TeamRoleManager';
import TeamFeaturePermissions from '@/business/pages/TeamFeaturePermissions';
import DepartmentPipelines from '@/business/pages/DepartmentPipelines';

// Add routes to your routes array
{ path: '/app/settings/team-roles', element: <TeamRoleManager /> },
{ path: '/app/settings/feature-permissions', element: <TeamFeaturePermissions /> },
{ path: '/app/settings/departments', element: <DepartmentPipelines /> },
```

- [ ] Routes registered
- [ ] Imports added
- [ ] App compiles without errors

### 2. Update Navigation

**File:** `src/business/pages/SettingsPage.tsx` (or wherever settings menu is)

```typescript
// Add menu items for new pages
<NavLink to="/app/settings/team-roles">
  Role Management
</NavLink>
<NavLink to="/app/settings/feature-permissions">
  Feature Permissions
</NavLink>
<NavLink to="/app/settings/departments">
  Departments
</NavLink>
```

- [ ] Menu items added
- [ ] Navigation links working
- [ ] Pages accessible from settings

### 3. Update RBACContext Usage

**File:** `src/business/context/RBACContext.tsx`

Already extended ✓

**Files that import useRBAC:**
- [ ] Review existing imports
- [ ] No breaking changes expected
- [ ] New properties available for use

### 4. Update Team Management Page

**File:** `src/business/pages/TeamPage.tsx`

```typescript
// Update to use new hooks
import { useTeamRoles } from '@/business/hooks';
import { useRBAC } from '@/business/context/RBACContext';

// In your component
const { roles } = useTeamRoles(businessId);
const { canManageRoles } = useRBAC();
```

- [ ] Import new hooks
- [ ] Use `useTeamRoles` for role display
- [ ] Add link to TeamRoleManager
- [ ] Test integration

## Testing Phase 1: Basic Functionality

### Component Tests

- [ ] TeamRoleManager loads without errors
- [ ] Can view predefined roles
- [ ] Can create custom roles
- [ ] Can edit custom roles
- [ ] Can delete custom roles
- [ ] Modal forms work correctly

- [ ] TeamFeaturePermissions loads without errors
- [ ] Can select team member
- [ ] Can toggle features on/off
- [ ] Changes persist to database
- [ ] Member details display correctly

- [ ] DepartmentPipelines loads without errors
- [ ] Can create departments
- [ ] Can edit departments
- [ ] Can delete departments
- [ ] Can add/remove members
- [ ] Manager assignment works

### Hook Tests

- [ ] useTeamRoles: loads roles
- [ ] useTeamRoles: creates role
- [ ] useTeamRoles: updates role
- [ ] useTeamRoles: deletes role
- [ ] useTeamRoles: error handling

- [ ] useFeaturePermissions: loads permissions
- [ ] useFeaturePermissions: toggles feature
- [ ] useFeaturePermissions: batch updates
- [ ] useFeaturePermissions: error handling

- [ ] useDepartments: loads departments
- [ ] useDepartments: creates department
- [ ] useDepartments: updates department
- [ ] useDepartments: deletes department
- [ ] useDepartments: manages members
- [ ] useDepartments: loads members

### Permission Tests

- [ ] Permission helpers work correctly
- [ ] canAccessFeature returns correct values
- [ ] resolveTeamMemberPermissions merges correctly
- [ ] Hierarchy respected (role → override → department)
- [ ] Audit logs created for changes

## Testing Phase 2: Integration

- [ ] Routes accessible from navigation
- [ ] Settings page displays new options
- [ ] TeamPage integrates with hooks
- [ ] RBACContext provides new properties
- [ ] Permission checks work in existing pages
- [ ] No console errors
- [ ] No TypeScript errors

## Testing Phase 3: Security & RLS

- [ ] Team member can't access other business data
- [ ] Row-level security enforced
- [ ] Audit logs only visible to owner/manager
- [ ] Permission changes logged correctly
- [ ] Owner can access all data

## Testing Phase 4: Data Integrity

- [ ] Cascade deletes work (delete department → remove members)
- [ ] Unique constraints enforced
- [ ] Foreign keys validated
- [ ] No orphaned records

## Testing Phase 5: Performance

- [ ] Large team loads in <2s
- [ ] Large role list loads in <1s
- [ ] Feature toggle updates instantly
- [ ] No memory leaks
- [ ] Indexes used efficiently

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Code reviewed
- [ ] Documentation updated

### Deployment

- [ ] Database migration applied to production
- [ ] Verify tables exist in prod
- [ ] Verify predefined roles inserted
- [ ] Deploy code changes
- [ ] Verify routes accessible
- [ ] Verify navigation working

### Post-Deployment

- [ ] All pages accessible
- [ ] Permissions enforced
- [ ] Audit logs created
- [ ] Monitor for errors
- [ ] User feedback collected

## Verification Steps

### Verify Database
```sql
-- Check tables exist
SELECT * FROM information_schema.tables 
WHERE table_name IN (
  'departments', 'department_members', 'department_pipelines',
  'member_feature_permissions', 'department_features', 'team_member_audit_logs'
);

-- Check predefined roles
SELECT * FROM business_roles WHERE is_system = true;

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies;
```

### Verify Frontend
- [ ] TypeScript compilation passes
- [ ] No import errors
- [ ] All hooks load
- [ ] All components load
- [ ] Routes resolve

### Verify Integration
- [ ] Can navigate to new pages
- [ ] Can perform CRUD operations
- [ ] Can see changes in database
- [ ] Can view audit logs

## Rollback Plan (if needed)

```sql
-- Rollback migration
DROP TABLE IF EXISTS team_member_audit_logs CASCADE;
DROP TABLE IF EXISTS department_features CASCADE;
DROP TABLE IF EXISTS member_feature_permissions CASCADE;
DROP TABLE IF EXISTS department_pipelines CASCADE;
DROP TABLE IF EXISTS department_members CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Remove new columns from business_roles (if needed)
ALTER TABLE business_roles 
DROP COLUMN IF EXISTS is_custom,
DROP COLUMN IF EXISTS is_system,
DROP COLUMN IF EXISTS permissions;
```

## Sign-Off

- **Prepared By:** Claude Code
- **Date:** May 3, 2026
- **Status:** ✓ Ready for Integration
- **QA Sign-Off:** [ ] By: _________ Date: _________
- **Deployment Date:** [ ] Date: _________
- **Post-Deployment Verification:** [ ] By: _________ Date: _________

## Notes

- Keep this checklist for reference during integration
- Update status as you progress through items
- Document any issues or changes made
- Update documentation with any deviations
- Retain for audit and future reference

---

**Last Updated:** May 3, 2026
**Version:** 1.0
**Next Review:** After successful deployment
