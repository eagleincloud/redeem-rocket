/**
 * Admin Authentication Service
 * Handles admin user login and password management
 */

import { supabase } from '@/app/lib/supabase';
import { hashPassword, verifyPassword, validatePasswordStrength } from '@/lib/passwordUtils';

export interface AdminLoginResult {
  ok: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'admin';
    status: 'active' | 'inactive';
  };
}

export interface AdminPasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Login admin user with email and password
 * @param email - Admin email
 * @param password - Admin password
 * @returns Login result with admin info
 */
export async function adminLoginWithPassword(
  email: string,
  password: string,
): Promise<AdminLoginResult> {
  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    // Get admin user by email
    const { data: admin, error: queryError } = await supabase
      .from('admin_users')
      .select('id, email, name, role, status, password_hash')
      .eq('email', email)
      .limit(1)
      .single();

    if (queryError || !admin) {
      return { ok: false, error: 'Email not found. Please check or contact administrator.' };
    }

    // Check if admin is active
    if (admin.status !== 'active') {
      return { ok: false, error: 'This admin account is inactive.' };
    }

    // Check if admin has password set (should always be true)
    if (!admin.password_hash) {
      return { ok: false, error: 'Password not configured. Please contact administrator.' };
    }

    // Verify password
    const isValid = await verifyPassword(password, admin.password_hash);
    if (!isValid) {
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }

    // Update last login timestamp
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', admin.id);

    return {
      ok: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        status: admin.status,
      },
    };
  } catch (err) {
    console.error('Admin login error:', err);
    return { ok: false, error: 'Login failed. Please try again.' };
  }
}

/**
 * Create a new admin user (super admin only)
 * @param email - New admin email
 * @param name - Admin name
 * @param password - Initial password
 * @param role - Admin role
 * @returns Creation result
 */
export async function createAdminUser(
  email: string,
  name: string,
  password: string,
  role: 'super_admin' | 'admin' = 'admin',
): Promise<AdminLoginResult> {
  const validation = validatePasswordStrength(password);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0] };
  }

  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    // Check if admin already exists
    const { data: existing } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', email)
      .limit(1)
      .single();

    if (existing) {
      return { ok: false, error: 'Admin with this email already exists' };
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const { data: newAdmin, error } = await supabase
      .from('admin_users')
      .insert({
        email,
        name,
        password_hash: passwordHash,
        role,
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select('id, email, name, role, status')
      .single();

    if (error || !newAdmin) {
      return { ok: false, error: `Failed to create admin: ${error?.message ?? 'Unknown error'}` };
    }

    return { ok: true, user: newAdmin as any };
  } catch (err) {
    console.error('Create admin error:', err);
    return { ok: false, error: 'Failed to create admin' };
  }
}

/**
 * Update admin password (admin only - their own password)
 * @param adminId - Admin ID
 * @param currentPassword - Current password for verification
 * @param newPassword - New password
 * @returns Update result
 */
export async function updateAdminPassword(
  adminId: string,
  currentPassword: string,
  newPassword: string,
): Promise<AdminLoginResult> {
  const validation = validatePasswordStrength(newPassword);
  if (!validation.valid) {
    return { ok: false, error: validation.errors[0] };
  }

  if (!supabase) {
    return { ok: false, error: 'Supabase not configured' };
  }

  try {
    // Get current password hash
    const { data: admin } = await supabase
      .from('admin_users')
      .select('password_hash')
      .eq('id', adminId)
      .single();

    if (!admin) {
      return { ok: false, error: 'Admin not found' };
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, admin.password_hash);
    if (!isValid) {
      return { ok: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error } = await supabase
      .from('admin_users')
      .update({
        password_hash: newPasswordHash,
        password_set_at: new Date().toISOString(),
      })
      .eq('id', adminId);

    if (error) {
      return { ok: false, error: 'Failed to update password' };
    }

    return { ok: true };
  } catch (err) {
    console.error('Update password error:', err);
    return { ok: false, error: 'Failed to update password' };
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result
 */
export function validateAdminPassword(password: string): AdminPasswordValidationResult {
  return validatePasswordStrength(password);
}
