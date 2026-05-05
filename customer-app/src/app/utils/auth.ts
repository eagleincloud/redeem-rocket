// Auth utility — localStorage-based multi-user auth for Redeem Rocket
// NOTE: In production, passwords must be hashed server-side. This is a demo-safe frontend impl.

const USERS_KEY = 'rr_users';
const SESSION_KEY = 'rr_session';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  email: string;
  name: string;
}

/** Very simple client-side hash (demo only — not for production) */
function hashPassword(password: string): string {
  let h = 0;
  const s = password + '__rr_2024__';
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return btoa(String(h));
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function getUsers(): AuthUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: AuthUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {}
}

function setSession(session: Session): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {}
}

// ─── Public API ────────────────────────────────────────────────────────────

export function register(
  name: string,
  email: string,
  password: string,
): { success: boolean; error?: string; user?: AuthUser } {
  const users = getUsers();
  const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (exists) return { success: false, error: 'An account with this email already exists.' };

  const user: AuthUser = {
    id: generateId(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);
  setSession({ userId: user.id, email: user.email, name: user.name });
  return { success: true, user };
}

export function login(
  email: string,
  password: string,
): { success: boolean; error?: string; user?: AuthUser } {
  const users = getUsers();
  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

  if (!user) return { success: false, error: 'No account found with this email.' };
  if (user.passwordHash !== hashPassword(password)) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  setSession({ userId: user.id, email: user.email, name: user.name });
  return { success: true, user };
}

export function logout(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export function getSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getSession() !== null;
}

export function getUserById(userId: string): AuthUser | null {
  return getUsers().find(u => u.id === userId) ?? null;
}

export function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): { success: boolean; error?: string } {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return { success: false, error: 'User not found.' };
  if (users[idx].passwordHash !== hashPassword(currentPassword)) {
    return { success: false, error: 'Current password is incorrect.' };
  }
  users[idx].passwordHash = hashPassword(newPassword);
  saveUsers(users);
  return { success: true };
}

export function updateName(userId: string, name: string): void {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx !== -1) {
    users[idx].name = name.trim();
    saveUsers(users);
    // Update session name too
    const session = getSession();
    if (session && session.userId === userId) {
      setSession({ ...session, name: name.trim() });
    }
  }
}

export function getAllUsers(): AuthUser[] {
  return getUsers().map(u => ({ ...u, passwordHash: '***' }));
}
