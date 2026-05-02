/**
 * DepartmentPipelines.tsx
 * Create and manage department-specific pipelines
 * Route: /app/settings/departments
 */

import { useState, useEffect } from 'react';
import { useDepartments } from '@/business/hooks/useDepartments';
import { useRBAC } from '@/business/context/RBACContext';
import { useBusinessContext } from '@/business/context/BusinessContext';
import { supabase } from '@/app/lib/supabase';
import type { Department, TeamMember } from '@/business/types/team-management';

interface PipelineOption {
  id: string;
  name: string;
}

export function DepartmentPipelines() {
  const { bizUser } = useBusinessContext();
  const { canManageRoles } = useRBAC();
  const { departments, loading, error, createDepartment, updateDepartment, deleteDepartment, getDepartmentMembers } = useDepartments(bizUser?.businessId);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', managerId: '' });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [pipelines, setPipelines] = useState<PipelineOption[]>([]);
  const [selectedDeptMembers, setSelectedDeptMembers] = useState<Map<string, TeamMember[]>>(new Map());

  // Load team members
  useEffect(() => {
    if (!bizUser?.businessId || !supabase) return;

    const loadData = async () => {
      try {
        const [membersRes, pipelinesRes] = await Promise.all([
          supabase
            .from('business_team_members')
            .select('*')
            .eq('business_id', bizUser.businessId),
          supabase
            .from('business_pipelines')
            .select('id, name')
            .eq('business_id', bizUser.businessId),
        ]);

        if (membersRes.data) {
          const members: TeamMember[] = (membersRes.data || []).map(m => ({
            id: m.id,
            email: m.email,
            name: m.name,
            phone: m.phone,
            role: 'viewer',
            features: {},
            departments: [],
            assignedPipelines: [],
            createdAt: new Date(m.created_at),
            status: m.status,
          }));
          setTeamMembers(members);
        }

        if (pipelinesRes.data) {
          setPipelines(pipelinesRes.data);
        }
      } catch (err) {
        console.error('[DepartmentPipelines] Error loading data:', err);
      }
    };

    loadData();
  }, [bizUser?.businessId]);

  // Load department members
  useEffect(() => {
    const loadDeptMembers = async () => {
      const memberMap = new Map<string, TeamMember[]>();

      for (const dept of departments) {
        try {
          const members = await getDepartmentMembers(dept.id);
          memberMap.set(dept.id, members);
        } catch (err) {
          console.error('[DepartmentPipelines] Error loading department members:', err);
        }
      }

      setSelectedDeptMembers(memberMap);
    };

    if (departments.length > 0) {
      loadDeptMembers();
    }
  }, [departments]);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setFormData({ name: '', description: '', managerId: '' });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      managerId: dept.managerId || '',
    });
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Department name is required');
      return;
    }

    if (editingDept) {
      await updateDepartment(editingDept.id, {
        name: formData.name,
        description: formData.description,
        managerId: formData.managerId,
      });
    } else {
      await createDepartment(formData.name, formData.description, formData.managerId || undefined);
    }

    setShowCreateModal(false);
    setEditingDept(null);
  };

  const handleDelete = async (deptId: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) {
      return;
    }

    await deleteDepartment(deptId);
  };

  if (!canManageRoles()) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600">
          You don't have permission to manage departments.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-gray-400 text-sm mt-1">Organize team members into departments with specific pipelines</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium transition"
        >
          + Add Department
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Departments List */}
      {loading ? (
        <div className="text-center text-gray-400">Loading departments...</div>
      ) : departments.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-gray-400">
          <p>No departments yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map(dept => {
            const deptMembers = selectedDeptMembers.get(dept.id) || [];
            const manager = teamMembers.find(m => m.id === dept.managerId);

            return (
              <div key={dept.id} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.08] transition">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{dept.name}</h3>
                    {dept.description && <p className="text-gray-400 text-sm mt-1">{dept.description}</p>}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="px-3 py-1 text-sm bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(dept.id)}
                      className="px-3 py-1 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Department Details */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Manager</p>
                    <p className="font-medium">{manager?.name || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Members</p>
                    <p className="font-medium">{deptMembers.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Created</p>
                    <p className="font-medium">{dept.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Members List */}
                {deptMembers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Team Members</p>
                    <div className="flex flex-wrap gap-2">
                      {deptMembers.map(member => (
                        <span
                          key={member.id}
                          className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded"
                        >
                          {member.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <DepartmentModal
          dept={editingDept}
          formData={formData}
          teamMembers={teamMembers}
          pipelines={pipelines}
          onSave={handleSave}
          onClose={() => setShowCreateModal(false)}
          onChange={(data) => setFormData(data)}
        />
      )}
    </div>
  );
}

// ── Department Modal Component ───────────────────────────────────────────────

interface DepartmentModalProps {
  dept: Department | null;
  formData: { name: string; description: string; managerId: string };
  teamMembers: TeamMember[];
  pipelines: PipelineOption[];
  onSave: () => void;
  onClose: () => void;
  onChange: (data: typeof formData) => void;
}

function DepartmentModal({
  dept,
  formData,
  teamMembers,
  pipelines,
  onSave,
  onClose,
  onChange,
}: DepartmentModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{dept ? 'Edit Department' : 'Create Department'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Department Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Department Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              placeholder="e.g., Sales Department"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              placeholder="Brief description of this department..."
              rows={3}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Manager Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Department Manager</label>
            <select
              value={formData.managerId}
              onChange={(e) => onChange({ ...formData, managerId: e.target.value })}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-orange-500"
            >
              <option value="">No manager assigned</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition"
            >
              {dept ? 'Update Department' : 'Create Department'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DepartmentPipelines;
