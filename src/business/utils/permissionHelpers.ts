/**
 * Permission Checking Utilities
 * Centralized permission logic for RBAC and feature access control
 */

import type { Feature, PermLevel, TeamMember, FeaturePermissions } from '@/business/types/team-management';

// ── Permission Level Hierarchy ───────────────────────────────────────────────

export function canPerformAction(level: PermLevel, action: 'read' | 'write' | 'delete' | 'admin'): boolean {
  if (level === 'none') return false;
  if (action === 'read') return ['read', 'readwrite', 'admin'].includes(level);
  if (action === 'write') return ['readwrite', 'admin'].includes(level);
  if (action === 'delete') return ['admin'].includes(level);
  if (action === 'admin') return level === 'admin';
  return false;
}

export function permissionHierarchy(level: PermLevel): number {
  const levels: Record<PermLevel, number> = {
    none: 0,
    read: 1,
    readwrite: 2,
    admin: 3,
  };
  return levels[level];
}

export function mergePermissions(base: PermLevel, override: PermLevel): PermLevel {
  // Override takes precedence if it's higher in hierarchy
  if (permissionHierarchy(override) > permissionHierarchy(base)) {
    return override;
  }
  return base;
}

// ── Feature Permission Checking ──────────────────────────────────────────────

export function canAccessFeature(
  permissions: FeaturePermissions,
  feature: Feature,
  action: 'read' | 'write' | 'delete' | 'admin' = 'read'
): boolean {
  const level = permissions[feature] || 'none';
  return canPerformAction(level, action);
}

export function getFeaturePermission(
  permissions: FeaturePermissions,
  feature: Feature
): PermLevel {
  return permissions[feature] || 'none';
}

export function filterFeaturesByAccess(
  features: Feature[],
  permissions: FeaturePermissions,
  action: 'read' | 'write' = 'read'
): Feature[] {
  return features.filter(feature => canAccessFeature(permissions, feature, action));
}

// ── Team Member Permission Resolution ────────────────────────────────────────

/**
 * Resolve effective permissions for a team member
 * Merges role permissions with member-specific overrides and department permissions
 */
export function resolveTeamMemberPermissions(
  member: TeamMember,
  rolePermissions: FeaturePermissions,
  departmentPermissions?: FeaturePermissions,
  memberOverrides?: Record<string, PermLevel>
): FeaturePermissions {
  let effective: FeaturePermissions = { ...rolePermissions };

  // Apply department permissions (can only restrict, not expand)
  if (departmentPermissions) {
    for (const feature of Object.keys(effective) as Feature[]) {
      const deptPerm = departmentPermissions[feature];
      if (deptPerm && permissionHierarchy(deptPerm) < permissionHierarchy(effective[feature])) {
        (effective as Record<Feature, PermLevel>)[feature] = deptPerm;
      }
    }
  }

  // Apply member-specific overrides
  if (memberOverrides) {
    for (const [feature, override] of Object.entries(memberOverrides)) {
      const overrideLevel = override as PermLevel;
      (effective as Record<Feature, PermLevel>)[feature as Feature] = overrideLevel;
    }
  }

  return effective;
}

// ── Advanced Permission Checks ───────────────────────────────────────────────

export function canManageTeam(permissions: FeaturePermissions): boolean {
  const teamPerm = getFeaturePermission(permissions, 'team');
  return ['readwrite', 'admin'].includes(teamPerm);
}

export function canManageRoles(permissions: FeaturePermissions): boolean {
  const teamPerm = getFeaturePermission(permissions, 'team');
  return teamPerm === 'admin';
}

export function canInviteMembers(permissions: FeaturePermissions): boolean {
  const teamPerm = getFeaturePermission(permissions, 'team');
  return ['readwrite', 'admin'].includes(teamPerm);
}

export function canViewAnalytics(permissions: FeaturePermissions): boolean {
  const reportsPerm = getFeaturePermission(permissions, 'reports');
  return canPerformAction(reportsPerm, 'read');
}

export function canAccessSettings(permissions: FeaturePermissions): boolean {
  const settingsPerm = getFeaturePermission(permissions, 'settings');
  return canPerformAction(settingsPerm, 'read');
}

export function canEditSettings(permissions: FeaturePermissions): boolean {
  const settingsPerm = getFeaturePermission(permissions, 'settings');
  return canPerformAction(settingsPerm, 'write');
}

// ── Pipeline Access Control ──────────────────────────────────────────────────

export function canAssignLead(
  permissions: FeaturePermissions,
  targetMemberPermissions: FeaturePermissions
): boolean {
  // User must have admin on leads and target must have at least read
  const userLeadPerm = getFeaturePermission(permissions, 'leads');
  const targetLeadPerm = getFeaturePermission(targetMemberPermissions, 'leads');

  return (
    userLeadPerm === 'admin' &&
    canPerformAction(targetLeadPerm, 'read')
  );
}

export function canMovePipelineStage(permissions: FeaturePermissions): boolean {
  const leadsPerm = getFeaturePermission(permissions, 'leads');
  return canPerformAction(leadsPerm, 'write');
}

export function canCreateCampaign(permissions: FeaturePermissions): boolean {
  const campaignsPerm = getFeaturePermission(permissions, 'campaigns');
  return canPerformAction(campaignsPerm, 'write');
}

export function canSendCampaign(permissions: FeaturePermissions): boolean {
  const campaignsPerm = getFeaturePermission(permissions, 'campaigns');
  return canPerformAction(campaignsPerm, 'write');
}

// ── Feature Toggle Resolution ────────────────────────────────────────────────

/**
 * Check if a feature is enabled for a member after considering:
 * 1. Plan-level features (from subscription)
 * 2. Role permissions
 * 3. Member-specific toggles
 * 4. Department restrictions
 */
export function isFeatureEnabledForMember(
  feature: Feature,
  memberPermissions: FeaturePermissions,
  planFeatures?: Set<Feature>,
  memberFeatureToggles?: Record<string, boolean>
): boolean {
  // Check plan-level feature access
  if (planFeatures && !planFeatures.has(feature)) {
    return false;
  }

  // Check member-specific toggle (can disable even if role has access)
  if (memberFeatureToggles && memberFeatureToggles[feature] === false) {
    return false;
  }

  // Check role/permission-level access
  const perm = getFeaturePermission(memberPermissions, feature);
  return perm !== 'none';
}

// ── Batch Permission Checking ────────────────────────────────────────────────

export function getAccessibleFeatures(
  permissions: FeaturePermissions,
  action: 'read' | 'write' | 'admin' = 'read'
): Feature[] {
  const accessible: Feature[] = [];

  for (const [feature, level] of Object.entries(permissions)) {
    if (canPerformAction(level as PermLevel, action)) {
      accessible.push(feature as Feature);
    }
  }

  return accessible;
}

export function summarizePermissions(permissions: FeaturePermissions): string {
  const adminFeatures = getAccessibleFeatures(permissions, 'admin');
  const writeFeatures = getAccessibleFeatures(permissions, 'write').filter(
    f => !adminFeatures.includes(f)
  );
  const readFeatures = getAccessibleFeatures(permissions, 'read').filter(
    f => ![...adminFeatures, ...writeFeatures].includes(f)
  );

  const parts: string[] = [];
  if (adminFeatures.length > 0) parts.push(`Admin: ${adminFeatures.join(', ')}`);
  if (writeFeatures.length > 0) parts.push(`Edit: ${writeFeatures.join(', ')}`);
  if (readFeatures.length > 0) parts.push(`View: ${readFeatures.join(', ')}`);

  return parts.length > 0 ? parts.join(' | ') : 'No access';
}
