/**
 * Hook: useTeamRoles
 * Manage team roles and their permissions
 */

import { useState, useCallback, useEffect } from 'react';
import type { TeamRole, FeaturePermissions } from '@/business/types/team-management';
import { supabase } from '@/app/lib/supabase';

interface UseTeamRolesResult {
  roles: TeamRole[];
  loading: boolean;
  error: string | null;
  createRole: (role: Omit<TeamRole, 'id' | 'createdAt'>) => Promise<TeamRole | null>;
  updateRole: (roleId: string, updates: Partial<Omit<TeamRole, 'id' | 'createdAt'>>) => Promise<TeamRole | null>;
  deleteRole: (roleId: string) => Promise<boolean>;
  getRoleById: (roleId: string) => TeamRole | undefined;
  getRoleByName: (name: string) => TeamRole | undefined;
}

export function useTeamRoles(businessId?: string): UseTeamRolesResult {
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load roles from database
  useEffect(() => {
    if (!businessId || !supabase) {
      setLoading(false);
      return;
    }

    const loadRoles = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('business_roles')
          .select('*')
          .eq('business_id', businessId);

        if (err) throw err;

        const formattedRoles: TeamRole[] = (data || []).map(role => ({
          id: role.id,
          businessId: role.business_id,
          name: role.name,
          description: role.description,
          permissions: role.permissions || {},
          isCustom: role.is_custom ?? true,
          isSystem: role.is_system ?? false,
          createdAt: new Date(role.created_at),
        }));

        setRoles(formattedRoles);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load roles';
        setError(msg);
        console.error('[useTeamRoles] Error loading roles:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [businessId]);

  const createRole = useCallback(async (roleData: Omit<TeamRole, 'id' | 'createdAt'>) => {
    if (!businessId || !supabase) {
      setError('Business ID not available');
      return null;
    }

    try {
      const { data, error: err } = await supabase
        .from('business_roles')
        .insert({
          business_id: businessId,
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
          is_custom: roleData.isCustom,
          is_system: roleData.isSystem,
        })
        .select()
        .single();

      if (err) throw err;

      const newRole: TeamRole = {
        id: data.id,
        businessId: data.business_id,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isCustom: data.is_custom,
        isSystem: data.is_system,
        createdAt: new Date(data.created_at),
      };

      setRoles(prev => [...prev, newRole]);
      setError(null);
      return newRole;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create role';
      setError(msg);
      console.error('[useTeamRoles] Error creating role:', err);
      return null;
    }
  }, [businessId]);

  const updateRole = useCallback(async (
    roleId: string,
    updates: Partial<Omit<TeamRole, 'id' | 'createdAt'>>
  ) => {
    if (!supabase) {
      setError('Supabase not available');
      return null;
    }

    try {
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.permissions !== undefined) updateData.permissions = updates.permissions;
      if (updates.isCustom !== undefined) updateData.is_custom = updates.isCustom;
      if (updates.isSystem !== undefined) updateData.is_system = updates.isSystem;

      const { data, error: err } = await supabase
        .from('business_roles')
        .update(updateData)
        .eq('id', roleId)
        .select()
        .single();

      if (err) throw err;

      const updatedRole: TeamRole = {
        id: data.id,
        businessId: data.business_id,
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isCustom: data.is_custom,
        isSystem: data.is_system,
        createdAt: new Date(data.created_at),
      };

      setRoles(prev => prev.map(r => (r.id === roleId ? updatedRole : r)));
      setError(null);
      return updatedRole;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update role';
      setError(msg);
      console.error('[useTeamRoles] Error updating role:', err);
      return null;
    }
  }, []);

  const deleteRole = useCallback(async (roleId: string) => {
    if (!supabase) {
      setError('Supabase not available');
      return false;
    }

    try {
      const { error: err } = await supabase
        .from('business_roles')
        .delete()
        .eq('id', roleId);

      if (err) throw err;

      setRoles(prev => prev.filter(r => r.id !== roleId));
      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete role';
      setError(msg);
      console.error('[useTeamRoles] Error deleting role:', err);
      return false;
    }
  }, []);

  const getRoleById = useCallback((roleId: string) => {
    return roles.find(r => r.id === roleId);
  }, [roles]);

  const getRoleByName = useCallback((name: string) => {
    return roles.find(r => r.name === name);
  }, [roles]);

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    getRoleById,
    getRoleByName,
  };
}
