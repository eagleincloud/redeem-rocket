import { createContext, useContext, ReactNode } from 'react';
import { useBusinessContext } from './BusinessContext';

type Feature = 'leads' | 'campaigns' | 'invoices' | 'analytics' | 'notifications' | 'auctions' | 'requirements' | 'settings' | 'team';
type PermLevel = 'none' | 'read' | 'readwrite' | 'admin';

interface RBACContextValue {
  canRead:  (feature: Feature) => boolean;
  canWrite: (feature: Feature) => boolean;
  isAdmin:  (feature: Feature) => boolean;
  isOwner:  boolean;
}

const RBACContext = createContext<RBACContextValue>({
  canRead:  () => true,
  canWrite: () => true,
  isAdmin:  () => true,
  isOwner:  true,
});

export function RBACProvider({ children }: { children: ReactNode }) {
  const { bizUser } = useBusinessContext();

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

  return (
    <RBACContext.Provider value={{
      canRead:  (f) => ['read', 'readwrite', 'admin'].includes(getLevel(f)),
      canWrite: (f) => ['readwrite', 'admin'].includes(getLevel(f)),
      isAdmin:  (f) => getLevel(f) === 'admin',
      isOwner,
    }}>
      {children}
    </RBACContext.Provider>
  );
}

export const useRBAC = () => useContext(RBACContext);
