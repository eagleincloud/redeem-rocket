/**
 * PermissionMatrix Component
 * Phase 4: Visual matrix for managing role-based permissions
 */

import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle, CheckCircle, Edit2, Plus } from 'lucide-react';

interface PermissionItem {
  id: string;
  entity_type: string;
  action: string;
  is_allowed: boolean;
  scope: 'all' | 'own_team' | 'assigned_only' | 'created_by_user' | 'owned_by_department';
  readable_fields: string[];
  editable_fields: string[];
}

interface Role {
  id: string;
  name: string;
  is_system: boolean;
  permissions: PermissionItem[];
}

interface PermissionMatrixProps {
  businessId: string;
  roles: Role[];
  onPermissionChange?: (roleId: string, permissions: PermissionItem[]) => void;
  isLoading?: boolean;
}

const ENTITY_TYPES = [
  'leads', 'contacts', 'deals', 'invoices', 'products',
  'orders', 'campaigns', 'team', 'reports', 'settings'
];

const ACTIONS = ['create', 'read', 'update', 'delete', 'export'];

const SCOPES = [
  { value: 'all', label: 'All', description: 'Full access to all entities' },
  { value: 'own_team', label: 'Own Team', description: 'Only team members they work with' },
  { value: 'assigned_only', label: 'Assigned', description: 'Only entities assigned to them' },
  { value: 'created_by_user', label: 'Created', description: 'Only entities they created' },
  { value: 'owned_by_department', label: 'Department', description: 'Entities in their department' },
];

export const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  businessId,
  roles,
  onPermissionChange,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<string | null>(
    roles[0]?.id || null
  );
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [editingPermission, setEditingPermission] = useState<string | null>(null);
  const [expandedEntity, setExpandedEntity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update permissions when role changes
  useEffect(() => {
    if (selectedRole) {
      const role = roles.find((r) => r.id === selectedRole);
      if (role) {
        setPermissions(role.permissions || []);
      }
    }
  }, [selectedRole, roles]);

  const handleTogglePermission = (
    entity_type: string,
    action: string,
    currentValue: boolean
  ) => {
    setPermissions((prev) => {
      const existing = prev.findIndex(
        (p) => p.entity_type === entity_type && p.action === action
      );

      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          is_allowed: !currentValue,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            id: `${entity_type}_${action}`,
            entity_type,
            action,
            is_allowed: !currentValue,
            scope: 'all',
            readable_fields: [],
            editable_fields: [],
          },
        ];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;

    setError(null);
    setSuccess(null);

    try {
      // TODO: Replace with actual API call
      // await saveRolePermissions(businessId, selectedRole, permissions);
      onPermissionChange?.(selectedRole, permissions);
      setSuccess('Permissions updated successfully');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save permissions'
      );
    }
  };

  const getPermissionStatus = (entity: string, action: string) => {
    return permissions.find(
      (p) => p.entity_type === entity && p.action === action
    )?.is_allowed ?? false;
  };

  const currentRole = roles.find((r) => r.id === selectedRole);

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-700">{success}</span>
        </div>
      )}

      {/* Header and Role Selection */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Permission Matrix
        </h2>

        <div className="flex gap-2 flex-wrap mb-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                selectedRole === role.id
                  ? 'border-blue-600 bg-blue-50 text-blue-900'
                  : 'border-gray-300 hover:border-gray-400'
              } ${role.is_system ? 'font-semibold' : ''}`}
            >
              {role.name}
              {role.is_system && (
                <span className="ml-2 text-xs text-gray-600">(System)</span>
              )}
            </button>
          ))}

          <button className="px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 flex items-center gap-2 text-gray-700 hover:text-gray-900">
            <Plus className="w-4 h-4" />
            New Role
          </button>
        </div>
      </div>

      {currentRole && (
        <>
          {/* Role Info */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{currentRole.name}</h3>
                {currentRole.is_system && (
                  <p className="text-sm text-gray-600">System role - limited customization</p>
                )}
              </div>
              <button className="p-2 text-blue-600 hover:bg-blue-100 rounded">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Permission Matrix */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-[200px,repeat(5,minmax(100px,1fr))] gap-0 bg-gray-50 border-b">
              <div className="p-4 font-semibold text-gray-900">Entity Type</div>
              {ACTIONS.map((action) => (
                <div
                  key={action}
                  className="p-4 font-semibold text-center text-gray-900 border-l"
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </div>
              ))}
            </div>

            {/* Entity Rows */}
            {ENTITY_TYPES.map((entity, idx) => (
              <div key={entity}>
                <div className="grid grid-cols-[200px,repeat(5,minmax(100px,1fr))] gap-0 border-b hover:bg-gray-50">
                  <div className="p-4 font-medium text-gray-900">
                    <button
                      onClick={() =>
                        setExpandedEntity(
                          expandedEntity === entity ? null : entity
                        )
                      }
                      className="w-full text-left hover:text-blue-600"
                    >
                      {entity.charAt(0).toUpperCase() +
                        entity.slice(1)}
                    </button>
                  </div>

                  {ACTIONS.map((action) => {
                    const isAllowed = getPermissionStatus(entity, action);

                    return (
                      <div
                        key={`${entity}_${action}`}
                        className="p-4 flex items-center justify-center border-l"
                      >
                        <button
                          onClick={() =>
                            handleTogglePermission(
                              entity,
                              action,
                              isAllowed
                            )
                          }
                          className={`p-2 rounded transition-all ${
                            isAllowed
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                          title={
                            isAllowed
                              ? `Allow ${action}`
                              : `Deny ${action}`
                          }
                        >
                          {isAllowed ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <X className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Expanded Details */}
                {expandedEntity === entity && (
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          Access Scope
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {SCOPES.map((scope) => (
                            <button
                              key={scope.value}
                              className="p-2 text-left border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                            >
                              <div className="font-medium text-sm">
                                {scope.label}
                              </div>
                              <div className="text-xs text-gray-600">
                                {scope.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 block mb-2">
                          Field-Level Permissions
                        </label>
                        <p className="text-xs text-gray-600 mb-2">
                          Specify which custom fields users with this role can read/edit
                        </p>
                        <button className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100">
                          Configure Fields
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary and Actions */}
          <div className="flex items-center justify-between border-t pt-6">
            <div className="text-sm text-gray-600">
              {permissions.filter((p) => p.is_allowed).length} permissions
              enabled
            </div>

            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Reset to Default
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

PermissionMatrix.displayName = 'PermissionMatrix';
