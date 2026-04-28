/**
 * AdvancedPermissionMatrix Component
 * Role-based field access control
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Edit, Lock, Info } from 'lucide-react';

interface Props {
  fields: any[];
  roles: any[];
  permissions: any[];
  onPermissionsChange?: (permissions: any[]) => void;
  isLoading?: boolean;
}

const PERMISSION_INFO: Record<string, any> = {
  view: { label: 'View', color: 'bg-blue-100 text-blue-700' },
  edit: { label: 'Edit', color: 'bg-green-100 text-green-700' },
  read_only: { label: 'Read Only', color: 'bg-yellow-100 text-yellow-700' },
  hidden: { label: 'Hidden', color: 'bg-gray-100 text-gray-700' },
};

export const AdvancedPermissionMatrix: React.FC<Props> = ({
  fields,
  roles,
  permissions,
  onPermissionsChange,
  isLoading = false,
}) => {
  const [viewMode, setViewMode] = useState<'matrix' | 'detail'>('matrix');
  const [selectedRole, setSelectedRole] = useState<string | null>(roles[0]?.id || null);

  const getPermission = (fieldId: string, roleId: string) => {
    return permissions.find(p => p.fieldId === fieldId && p.roleId === roleId);
  };

  const setPermission = (fieldId: string, roleId: string, permType: string) => {
    const existing = getPermission(fieldId, roleId);
    const newPerm = { id: existing?.id || Math.random().toString(), fieldId, roleId, permissionType: permType };
    
    if (existing) {
      const updated = permissions.map(p => p.id === existing.id ? newPerm : p);
      onPermissionsChange?.(updated);
    } else {
      onPermissionsChange?.([...permissions, newPerm]);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Permission Matrix</h3>

      <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Fields</th>
              {roles.map(role => (
                <th key={role.id} className="px-4 py-3 text-center text-sm font-semibold border-l">
                  {role.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map(field => (
              <tr key={field.id} className="border-b">
                <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r">
                  {field.fieldName}
                </td>
                {roles.map(role => {
                  const perm = getPermission(field.id, role.id);
                  const current = perm?.permissionType || 'hidden';

                  return (
                    <td key={role.id} className="px-2 py-3 text-center border-l">
                      <div className="flex gap-1 justify-center flex-wrap">
                        {Object.entries(PERMISSION_INFO).map(([key, info]) => (
                          <button
                            key={key}
                            onClick={() => setPermission(field.id, role.id, key)}
                            className={`px-2 py-1 rounded text-xs font-bold ${
                              current === key ? info.color : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }`}
                            disabled={isLoading}
                          >
                            {key[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {Object.entries(PERMISSION_INFO).map(([key, info]) => (
          <div key={key} className={`p-4 rounded-lg ${info.color}`}>
            <p className="font-semibold">{info.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedPermissionMatrix;
