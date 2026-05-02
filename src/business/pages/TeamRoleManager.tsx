/**
 * TeamRoleManager.tsx
 * Create and manage custom roles with feature-level permissions
 * Route: /app/settings/team-roles
 */

import { useState, useMemo } from 'react';
import { useTeamRoles } from '@/business/hooks/useTeamRoles';
import { useRBAC } from '@/business/context/RBACContext';
import { useBusinessContext } from '@/business/context/BusinessContext';
import type { TeamRole, FeaturePermissions, Feature, PermLevel } from '@/business/types/team-management';
import { PREDEFINED_ROLES } from '@/business/types/team-management';

const FEATURES: Feature[] = [
  'leads',
  'campaigns',
  'automation',
  'finance',
  'reports',
  'settings',
  'team',
];

type RoleTabType = 'predefined' | 'custom';

export function TeamRoleManager() {
  const { bizUser } = useBusinessContext();
  const { isOwner, canManageRoles } = useRBAC();
  const { roles, loading, error, createRole, updateRole, deleteRole } = useTeamRoles(bizUser?.businessId);

  const [activeTab, setActiveTab] = useState<RoleTabType>('predefined');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {} as FeaturePermissions,
  });

  const predefinedRoles = useMemo(() => {
    return roles.filter(r => r.isSystem);
  }, [roles]);

  const customRoles = useMemo(() => {
    return roles.filter(r => !r.isSystem);
  }, [roles]);

  const handleOpenCreate = () => {
    setEditingRole(null);
    setFormData({
      name: '',
      description: '',
      permissions: { leads: 'read', campaigns: 'read', automation: 'none', finance: 'none', reports: 'read', settings: 'none', team: 'none' },
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (role: TeamRole) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setShowCreateModal(true);
  };

  const handlePermissionChange = (feature: Feature, level: PermLevel) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [feature]: level,
      },
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Role name is required');
      return;
    }

    if (editingRole) {
      const success = await updateRole(editingRole.id, {
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      });

      if (success) {
        setShowCreateModal(false);
        setEditingRole(null);
      }
    } else {
      await createRole({
        businessId: bizUser?.businessId || '',
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
        isCustom: true,
        isSystem: false,
      });
      setShowCreateModal(false);
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!window.confirm('Are you sure you want to delete this role?')) {
      return;
    }

    await deleteRole(roleId);
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block">Loading roles...</div>
      </div>
    );
  }

  if (!canManageRoles()) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600">
          You don't have permission to manage roles.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Role Management</h1>
          <p className="text-gray-400 text-sm mt-1">Create and manage team roles with granular permissions</p>
        </div>
        {activeTab === 'custom' && (
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-white font-medium transition"
          >
            + Create Custom Role
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('predefined')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'predefined'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Predefined Roles ({predefinedRoles.length})
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`px-4 py-2 font-medium border-b-2 transition ${
            activeTab === 'custom'
              ? 'border-orange-500 text-orange-500'
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          Custom Roles ({customRoles.length})
        </button>
      </div>

      {/* Predefined Roles */}
      {activeTab === 'predefined' && (
        <div className="space-y-3">
          {predefinedRoles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={() => handleOpenEdit(role)}
              canEdit={false}
              canDelete={false}
            />
          ))}
        </div>
      )}

      {/* Custom Roles */}
      {activeTab === 'custom' && (
        <div className="space-y-3">
          {customRoles.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-gray-400">
              <p>No custom roles yet. Create one to get started.</p>
            </div>
          ) : (
            customRoles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                onEdit={() => handleOpenEdit(role)}
                onDelete={() => handleDelete(role.id)}
                canEdit={true}
                canDelete={true}
              />
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showCreateModal && (
        <RoleModal
          role={editingRole}
          formData={formData}
          onPermissionChange={handlePermissionChange}
          onSave={handleSave}
          onClose={() => setShowCreateModal(false)}
          onChange={(data) => setFormData(data)}
        />
      )}
    </div>
  );
}

// ── Role Card Component ──────────────────────────────────────────────────────

interface RoleCardProps {
  role: TeamRole;
  onEdit: () => void;
  onDelete?: () => void;
  canEdit: boolean;
  canDelete: boolean;
}

function RoleCard({ role, onEdit, onDelete, canEdit, canDelete }: RoleCardProps) {
  const accessibleFeatures = Object.entries(role.permissions)
    .filter(([_, level]) => level !== 'none')
    .map(([feature]) => feature)
    .join(', ');

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/[0.08] transition">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{role.name}</h3>
            {role.isSystem && <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">System</span>}
            {role.isCustom && <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">Custom</span>}
          </div>
          {role.description && <p className="text-gray-400 text-sm mt-1">{role.description}</p>}
          <p className="text-gray-500 text-xs mt-2">
            Access: {accessibleFeatures || 'No access'}
          </p>
        </div>

        <div className="flex gap-2">
          {canEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1 text-sm bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 rounded transition"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={onDelete}
              className="px-3 py-1 text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded transition"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Role Modal Component ─────────────────────────────────────────────────────

interface RoleModalProps {
  role: TeamRole | null;
  formData: { name: string; description: string; permissions: FeaturePermissions };
  onPermissionChange: (feature: Feature, level: PermLevel) => void;
  onSave: () => void;
  onClose: () => void;
  onChange: (data: typeof formData) => void;
}

function RoleModal({ role, formData, onPermissionChange, onSave, onClose, onChange }: RoleModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">{role ? 'Edit Role' : 'Create Role'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Role Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Role Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              placeholder="e.g., Sales Manager"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
              placeholder="Brief description of this role..."
              rows={3}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Permissions Grid */}
          <div>
            <label className="block text-sm font-medium mb-3">Feature Permissions</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FEATURES.map(feature => (
                <div key={feature} className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <label className="block text-sm font-medium capitalize mb-2">{feature}</label>
                  <select
                    value={formData.permissions[feature] || 'none'}
                    onChange={(e) => onPermissionChange(feature, e.target.value as PermLevel)}
                    className="w-full px-3 py-1 bg-white/10 border border-white/20 rounded text-sm focus:outline-none focus:border-orange-500"
                  >
                    <option value="none">None</option>
                    <option value="read">Read</option>
                    <option value="readwrite">Read & Write</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition"
            >
              {role ? 'Update Role' : 'Create Role'}
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

export default TeamRoleManager;
