import { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { useBusinessContext } from './BusinessContext';
import type { Department } from '@/business/types/team-management';

type Feature = 'leads' | 'campaigns' | 'invoices' | 'analytics' | 'notifications' | 'auctions' | 'requirements' | 'settings' | 'team';
type PermLevel = 'none' | 'read' | 'readwrite' | 'admin';

interface RBACContextValue {
  canRead:  (feature: Feature) => boolean;
  canWrite: (feature: Feature) => boolean;
  isAdmin:  (feature: Feature) => boolean;
  isOwner:  boolean;

  // Department support (new)
  departments: Department[];
  currentDepartment: Department | null;
  setCurrentDepartment: (dept: Department | null) => void;

  // Advanced permission checks
  canManageTeam: () => boolean;
  canManageRoles: () => boolean;
  canInviteMembers: () => boolean;
  canAccessSettings: () => boolean;
  canEditSettings: () => boolean;
}

const RBACContext = createContext<RBACContextValue | null>(null);

export function RBACProvider({ children }: { children: ReactNode }) {
  const { bizUser } = useBusinessContext();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);

  // isOwner is true only for business owners, not team members.
  // bizUser.isTeamMember is set when the session comes from business_team_members table.
  const isOwner = !bizUser?.isTeamMember;

  function getLevel(feature: Feature): PermLevel {
    if (isOwner) return 'admin';
    // Permissions are stored inside teamMemberData.permissions (loaded from DB).
    // If no explicit permission is set for a feature, default to 'readwrite' so
    // team members can use the platform normally — only owner-only features are blocked.
    const perms = (bizUser as any)?.teamMemberData?.permissions as Record<string, PermLevel> | undefined;
    return perms?.[feature] ?? 'readwrite';
  }

  function canPerformAction(level: PermLevel, action: 'read' | 'write' | 'admin'): boolean {
    if (action === 'read') return ['read', 'readwrite', 'admin'].includes(level);
    if (action === 'write') return ['readwrite', 'admin'].includes(level);
    if (action === 'admin') return level === 'admin';
    return false;
  }

  const value = useMemo<RBACContextValue>(() => ({
    canRead:  (f) => canPerformAction(getLevel(f), 'read'),
    canWrite: (f) => canPerformAction(getLevel(f), 'write'),
    isAdmin:  (f) => getLevel(f) === 'admin',
    isOwner,

    departments,
    currentDepartment,
    setCurrentDepartment,

    canManageTeam: () => canPerformAction(getLevel('team'), 'write'),
    canManageRoles: () => getLevel('team') === 'admin',
    canInviteMembers: () => canPerformAction(getLevel('team'), 'write'),
    canAccessSettings: () => canPerformAction(getLevel('settings'), 'read'),
    canEditSettings: () => canPerformAction(getLevel('settings'), 'write'),
  }), [getLevel, isOwner, departments, currentDepartment]);

  return (
    <RBACContext.Provider value={value}>
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
};
