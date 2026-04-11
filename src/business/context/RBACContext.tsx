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

  // Business owners (role === 'business' without explicit member permissions) always have full access.
  // Team members would have a 'permissions' field loaded onto bizUser from DB.
  const isOwner = !bizUser || bizUser.role === 'business';

  function getLevel(feature: Feature): PermLevel {
    if (isOwner) return 'admin';
    return ((bizUser as any)?.permissions?.[feature] as PermLevel) ?? 'none';
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
