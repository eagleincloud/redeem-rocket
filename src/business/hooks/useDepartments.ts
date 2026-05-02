/**
 * Hook: useDepartments
 * Manage departments and department membership
 */

import { useState, useCallback, useEffect } from 'react';
import type { Department, TeamMember } from '@/business/types/team-management';
import { supabase } from '@/app/lib/supabase';

interface UseDepartmentsResult {
  departments: Department[];
  currentDepartment: Department | null;
  loading: boolean;
  error: string | null;
  createDepartment: (name: string, description?: string, managerId?: string) => Promise<Department | null>;
  updateDepartment: (deptId: string, updates: Partial<Department>) => Promise<Department | null>;
  deleteDepartment: (deptId: string) => Promise<boolean>;
  setCurrentDepartment: (dept: Department | null) => void;
  getDepartmentById: (deptId: string) => Department | undefined;
  addMemberToDepartment: (deptId: string, memberId: string) => Promise<boolean>;
  removeMemberFromDepartment: (deptId: string, memberId: string) => Promise<boolean>;
  getDepartmentMembers: (deptId: string) => Promise<TeamMember[]>;
}

export function useDepartments(businessId?: string): UseDepartmentsResult {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load departments
  useEffect(() => {
    if (!businessId || !supabase) {
      setLoading(false);
      return;
    }

    const loadDepartments = async () => {
      try {
        setLoading(true);
        const { data, error: err } = await supabase
          .from('departments')
          .select('*')
          .eq('business_id', businessId);

        if (err) throw err;

        const depts: Department[] = (data || []).map(dept => ({
          id: dept.id,
          businessId: dept.business_id,
          name: dept.name,
          description: dept.description,
          managerId: dept.manager_id,
          members: [],  // Will be loaded separately if needed
          pipelines: [],
          features: {},
          createdAt: new Date(dept.created_at),
          updatedAt: new Date(dept.updated_at),
        }));

        setDepartments(depts);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load departments';
        setError(msg);
        console.error('[useDepartments] Error loading departments:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDepartments();
  }, [businessId]);

  const createDepartment = useCallback(async (
    name: string,
    description?: string,
    managerId?: string
  ): Promise<Department | null> => {
    if (!businessId || !supabase) {
      setError('Business ID not available');
      return null;
    }

    try {
      const { data, error: err } = await supabase
        .from('departments')
        .insert({
          business_id: businessId,
          name,
          description,
          manager_id: managerId,
        })
        .select()
        .single();

      if (err) throw err;

      const newDept: Department = {
        id: data.id,
        businessId: data.business_id,
        name: data.name,
        description: data.description,
        managerId: data.manager_id,
        members: [],
        pipelines: [],
        features: {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setDepartments(prev => [...prev, newDept]);
      setError(null);
      return newDept;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create department';
      setError(msg);
      console.error('[useDepartments] Error creating department:', err);
      return null;
    }
  }, [businessId]);

  const updateDepartment = useCallback(async (
    deptId: string,
    updates: Partial<Department>
  ): Promise<Department | null> => {
    if (!supabase) {
      setError('Supabase not available');
      return null;
    }

    try {
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.managerId !== undefined) updateData.manager_id = updates.managerId;

      const { data, error: err } = await supabase
        .from('departments')
        .update(updateData)
        .eq('id', deptId)
        .select()
        .single();

      if (err) throw err;

      const updatedDept: Department = {
        id: data.id,
        businessId: data.business_id,
        name: data.name,
        description: data.description,
        managerId: data.manager_id,
        members: [],
        pipelines: [],
        features: {},
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setDepartments(prev => prev.map(d => (d.id === deptId ? updatedDept : d)));
      if (currentDepartment?.id === deptId) {
        setCurrentDepartment(updatedDept);
      }
      setError(null);
      return updatedDept;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update department';
      setError(msg);
      console.error('[useDepartments] Error updating department:', err);
      return null;
    }
  }, [currentDepartment]);

  const deleteDepartment = useCallback(async (deptId: string): Promise<boolean> => {
    if (!supabase) {
      setError('Supabase not available');
      return false;
    }

    try {
      const { error: err } = await supabase
        .from('departments')
        .delete()
        .eq('id', deptId);

      if (err) throw err;

      setDepartments(prev => prev.filter(d => d.id !== deptId));
      if (currentDepartment?.id === deptId) {
        setCurrentDepartment(null);
      }
      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete department';
      setError(msg);
      console.error('[useDepartments] Error deleting department:', err);
      return false;
    }
  }, [currentDepartment]);

  const getDepartmentById = useCallback((deptId: string) => {
    return departments.find(d => d.id === deptId);
  }, [departments]);

  const addMemberToDepartment = useCallback(async (deptId: string, memberId: string) => {
    if (!supabase) {
      setError('Supabase not available');
      return false;
    }

    try {
      const { error: err } = await supabase
        .from('department_members')
        .insert({ department_id: deptId, member_id: memberId });

      if (err) throw err;

      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add member to department';
      setError(msg);
      console.error('[useDepartments] Error adding member:', err);
      return false;
    }
  }, []);

  const removeMemberFromDepartment = useCallback(async (deptId: string, memberId: string) => {
    if (!supabase) {
      setError('Supabase not available');
      return false;
    }

    try {
      const { error: err } = await supabase
        .from('department_members')
        .delete()
        .eq('department_id', deptId)
        .eq('member_id', memberId);

      if (err) throw err;

      setError(null);
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove member from department';
      setError(msg);
      console.error('[useDepartments] Error removing member:', err);
      return false;
    }
  }, []);

  const getDepartmentMembers = useCallback(async (deptId: string): Promise<TeamMember[]> => {
    if (!supabase) {
      setError('Supabase not available');
      return [];
    }

    try {
      const { data, error: err } = await supabase
        .from('department_members')
        .select('business_team_members(*)')
        .eq('department_id', deptId);

      if (err) throw err;

      return (data || []).map((row: any) => ({
        id: row.business_team_members.id,
        email: row.business_team_members.email,
        name: row.business_team_members.name,
        phone: row.business_team_members.phone,
        role: 'viewer',  // Default fallback
        features: {},
        departments: [deptId],
        assignedPipelines: [],
        createdAt: new Date(row.business_team_members.created_at),
        status: row.business_team_members.status,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load department members';
      setError(msg);
      console.error('[useDepartments] Error loading members:', err);
      return [];
    }
  }, []);

  return {
    departments,
    currentDepartment,
    loading,
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    setCurrentDepartment,
    getDepartmentById,
    addMemberToDepartment,
    removeMemberFromDepartment,
    getDepartmentMembers,
  };
}
