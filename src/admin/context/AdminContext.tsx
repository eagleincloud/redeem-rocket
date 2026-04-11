import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  status: 'active' | 'inactive';
}

interface AdminContextValue {
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser | null) => void;
  isAuthenticated: boolean;
  logout: () => void;
}

// ── Dev bypass ───────────────────────────────────────────────────────────────
// Set DEV_BYPASS = true to skip login entirely while building features.

const DEV_BYPASS = false; // Set to true during admin development

const DEV_ADMIN: AdminUser = {
  id: 'admin-dev-1',
  email: 'admin@redeemrocket.in',
  name: 'Admin Dev',
  role: 'super_admin',
  status: 'active',
};

// ── Storage helpers ───────────────────────────────────────────────────────────

const STORAGE_KEY = 'admin_user';

function loadAdminUser(): AdminUser | null {
  if (DEV_BYPASS) return DEV_ADMIN;      // always logged in during dev
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

function saveAdminUser(user: AdminUser | null) {
  if (DEV_BYPASS) return;              // skip localStorage in dev mode
  if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEY);
}

// ── Context ───────────────────────────────────────────────────────────────────

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUserState] = useState<AdminUser | null>(loadAdminUser);

  const setAdminUser = useCallback((user: AdminUser | null) => {
    saveAdminUser(user);
    setAdminUserState(user);
  }, []);

  const logout = useCallback(() => {
    if (DEV_BYPASS) return;             // no-op in dev mode
    saveAdminUser(null);
    setAdminUserState(null);
  }, []);

  const value = useMemo<AdminContextValue>(() => ({
    adminUser,
    setAdminUser,
    isAuthenticated: Boolean(adminUser),
    logout,
  }), [adminUser, setAdminUser, logout]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdminContext(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdminContext must be used within AdminProvider');
  return ctx;
}

// Alias for convenience
export function useAdmin() {
  return useAdminContext();
}

// Helper to use context with shorter property names
export function useAuthAdmin() {
  const ctx = useAdminContext();
  return {
    user: ctx.adminUser,
    setUser: ctx.setAdminUser,
    isAuthenticated: ctx.isAuthenticated,
    logout: ctx.logout,
  };
}
