/**
 * Permission Manager Component
 * Layer 4 - Role-based access control
 * Configure view/edit/delete permissions per role and feature
 */

import React, { useState, useCallback, useEffect } from 'react';
import { getRoles, updatePermission, RolePermission } from '@/app/api/configurable-system';

interface PermissionManagerProps {
  businessId: string;
  userId: string;
  onSave?: () => void;
  onCancel?: () => void;
}

interface PermissionItem {
  feature: string;
  actions: {
    view: boolean;
    edit: boolean;
    delete: boolean;
    create?: boolean;
  };
}

const FEATURES = [
  { key: 'leads', label: 'Leads', actions: ['view', 'edit', 'delete', 'create'] },
  { key: 'pipelines', label: 'Pipelines', actions: ['view', 'edit', 'delete', 'create'] },
  { key: 'customers', label: 'Customers', actions: ['view', 'edit', 'delete', 'create'] },
  { key: 'emails', label: 'Emails', actions: ['view', 'edit', 'delete', 'send'] },
  { key: 'automation', label: 'Automation', actions: ['view', 'edit', 'delete', 'execute'] },
  { key: 'reports', label: 'Reports', actions: ['view', 'download', 'export'] },
  { key: 'settings', label: 'Settings', actions: ['view', 'edit'] },
];

const PermissionManager = React.memo<PermissionManagerProps>(function PermissionManager({
  businessId,
  userId,
  onSave,
  onCancel,
}) {
  const [roles, setRoles] = useState<RolePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const loadedRoles = await getRoles(businessId);
        setRoles(loadedRoles);
        if (loadedRoles.length > 0) {
          setSelectedRole(loadedRoles[0].id);
          loadRolePermissions(loadedRoles[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roles');
      } finally {
        setIsLoading(false);
      }
    };
    loadRoles();
  }, [businessId]);

  const loadRolePermissions = useCallback((role: RolePermission) => {
    const perms: PermissionItem[] = FEATURES.map(feature => ({
      feature: feature.key,
      actions: {
        view: role.permissions?.[feature.key]?.view ?? true,
        edit: role.permissions?.[feature.key]?.edit ?? false,
        delete: role.permissions?.[feature.key]?.delete ?? false,
        create: role.permissions?.[feature.key]?.create ?? false,
      },
    }));
    setPermissions(perms);
  }, []);

  const handleTogglePermission = useCallback(
    (featureIndex: number, action: string) => {
      const newPermissions = [...permissions];
      newPermissions[featureIndex].actions = {
        ...newPermissions[featureIndex].actions,
        [action]: !newPermissions[featureIndex].actions[action as keyof typeof newPermissions[0]['actions']],
      };
      setPermissions(newPermissions);
    },
    [permissions]
  );

  const handleSave = useCallback(async () => {
    if (!selectedRole) return;

    setIsSaving(true);
    setError(null);

    try {
      const role = roles.find(r => r.id === selectedRole);
      if (!role) throw new Error('Role not found');

      for (const perm of permissions) {
        for (const [action, allowed] of Object.entries(perm.actions)) {
          if (action === 'view' || action === 'edit' || action === 'delete' || action === 'create') {
            await updatePermission(
              selectedRole,
              businessId,
              perm.feature,
              action,
              allowed as boolean
            );
          }
        }
      }
      onSave?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save permissions');
    } finally {
      setIsSaving(false);
    }
  }, [selectedRole, permissions, roles, businessId, onSave]);

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200">
        <p className="text-gray-600">Loading roles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg border border-gray-200">
      <div>
        <h2 className="text-2xl font-bold mb-4">Permission Manager</h2>
        <p className="text-gray-600 text-sm">Configure role-based access control for your platform</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Role Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
        <select
          value={selectedRole || ''}
          onChange={(e) => {
            const roleId = e.target.value;
            setSelectedRole(roleId);
            const role = roles.find(r => r.id === roleId);
            if (role) loadRolePermissions(role);
          }}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.roleName} {role.isSystem ? '(System)' : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Permissions Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Feature</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">View</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Edit</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Delete</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Create</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((perm, idx) => {
              const feature = FEATURES.find(f => f.key === perm.feature);
              return (
                <tr key={perm.feature} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{feature?.label}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.actions.view}
                      onChange={() => handleTogglePermission(idx, 'view')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.actions.edit}
                      onChange={() => handleTogglePermission(idx, 'edit')}
                      disabled={!perm.actions.view}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.actions.delete}
                      onChange={() => handleTogglePermission(idx, 'delete')}
                      disabled={!perm.actions.view}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={perm.actions.create ?? false}
                      onChange={() => handleTogglePermission(idx, 'create')}
                      disabled={!perm.actions.view}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer disabled:opacity-50"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end border-t pt-6">
        <button
          onClick={onCancel}
          disabled={isSaving}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>
    </div>
  );
});

export default PermissionManager;
