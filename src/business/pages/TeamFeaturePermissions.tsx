/**
 * TeamFeaturePermissions.tsx
 * Enable/disable features per team member
 * Route: /app/settings/feature-permissions
 */

import { useState, useEffect } from 'react';
import { useFeaturePermissions } from '@/business/hooks/useFeaturePermissions';
import { useRBAC } from '@/business/context/RBACContext';
import { useBusinessContext } from '@/business/context/BusinessContext';
import { supabase } from '@/app/lib/supabase';
import type { TeamMember, Feature } from '@/business/types/team-management';

const AVAILABLE_FEATURES: Array<{ id: Feature; name: string; description: string; icon: string }> = [
  { id: 'leads', name: 'Lead Management', description: 'Create, edit, and manage sales leads', icon: '📋' },
  { id: 'campaigns', name: 'Email Campaigns', description: 'Create and send email campaigns', icon: '📧' },
  { id: 'automation', name: 'Automation', description: 'Set up workflow automation', icon: '⚙️' },
  { id: 'finance', name: 'Finance', description: 'View financial reports and invoices', icon: '💰' },
  { id: 'reports', name: 'Analytics & Reports', description: 'View dashboards and reports', icon: '📊' },
  { id: 'settings', name: 'Settings', description: 'Manage account settings', icon: '⚙️' },
  { id: 'team', name: 'Team Management', description: 'Manage team members and roles', icon: '👥' },
];

export function TeamFeaturePermissions() {
  const { bizUser } = useBusinessContext();
  const { canManageRoles } = useRBAC();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedMember = teamMembers.find(m => m.id === selectedMemberId);
  const { memberFeatures, loading: permLoading, toggleFeature } = useFeaturePermissions(
    bizUser?.businessId,
    selectedMemberId || undefined
  );

  // Load team members
  useEffect(() => {
    if (!bizUser?.businessId || !supabase) {
      setMembersLoading(false);
      return;
    }

    const loadMembers = async () => {
      try {
        setMembersLoading(true);
        const { data, error: err } = await supabase
          .from('business_team_members')
          .select('*')
          .eq('business_id', bizUser.businessId);

        if (err) throw err;

        const members: TeamMember[] = (data || []).map(m => ({
          id: m.id,
          email: m.email,
          name: m.name,
          phone: m.phone,
          role: 'viewer',
          features: {},
          departments: [],
          assignedPipelines: [],
          permissions: m.permissions,
          createdAt: new Date(m.created_at),
          status: m.status,
        }));

        setTeamMembers(members);
        setError(null);

        // Select first member by default
        if (members.length > 0) {
          setSelectedMemberId(members[0].id);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load team members';
        setError(msg);
        console.error('[TeamFeaturePermissions] Error loading members:', err);
      } finally {
        setMembersLoading(false);
      }
    };

    loadMembers();
  }, [bizUser?.businessId]);

  const handleToggleFeature = async (feature: Feature) => {
    if (!selectedMemberId) return;
    const currentValue = memberFeatures[feature] ?? true;
    await toggleFeature(feature, !currentValue);
  };

  if (!canManageRoles()) {
    return (
      <div className="p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600">
          You don't have permission to manage feature permissions.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Feature Permissions</h1>
        <p className="text-gray-400 text-sm mt-1">Enable or disable features for individual team members</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Member Selector */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <label className="block text-sm font-medium mb-2">Select Team Member</label>
        {membersLoading ? (
          <div className="text-gray-400">Loading team members...</div>
        ) : teamMembers.length === 0 ? (
          <div className="text-gray-400">No team members found</div>
        ) : (
          <select
            value={selectedMemberId || ''}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-orange-500"
          >
            <option value="">Select a member...</option>
            {teamMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.email})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Member Details */}
      {selectedMember && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <h3 className="text-lg font-semibold">{selectedMember.name}</h3>
          <p className="text-gray-400 text-sm">{selectedMember.email}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
              {selectedMember.status || 'active'}
            </span>
          </div>
        </div>
      )}

      {/* Features Grid */}
      {selectedMemberId && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AVAILABLE_FEATURES.map(feature => {
            const isEnabled = memberFeatures[feature.id] !== false;

            return (
              <div
                key={feature.id}
                className={`border rounded-lg p-4 transition ${
                  isEnabled
                    ? 'bg-orange-500/10 border-orange-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{feature.icon}</span>
                      <h4 className="font-semibold">{feature.name}</h4>
                    </div>
                    <p className="text-gray-400 text-sm">{feature.description}</p>
                  </div>

                  <button
                    onClick={() => handleToggleFeature(feature.id)}
                    disabled={permLoading}
                    className={`ml-2 px-3 py-1 rounded text-sm font-medium transition ${
                      isEnabled
                        ? 'bg-orange-500/30 text-orange-300 hover:bg-orange-500/40'
                        : 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                    } ${permLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isEnabled ? '✓ Enabled' : '✕ Disabled'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!selectedMemberId && (
        <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-center text-gray-400">
          <p>Select a team member to manage their feature permissions</p>
        </div>
      )}
    </div>
  );
}

export default TeamFeaturePermissions;
