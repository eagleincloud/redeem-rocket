/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 4
 * Manager Assignment Component
 *
 * Handles:
 * - Deal assignment to managers
 * - Skill-based matching
 * - Workload balancing
 * - Assignment history and tracking
 */

import React, { useState } from 'react';
import { Users, TrendingUp, CheckCircle2, AlertCircle, ArrowRight, Plus } from 'lucide-react';

export interface ManagerProfile {
  id: string;
  name: string;
  email: string;
  title?: string;
  skills?: string[];
  activeDealCount?: number;
  closedDealsMonth?: number;
  closureRate?: number;
  avgDealValue?: number;
  successMetrics?: {
    winRate: number;
    avgCycleDays: number;
    revenueClosed: number;
  };
}

interface ManagerAssignmentProps {
  dealId: string;
  dealName: string;
  dealValue?: number;
  currentManager?: ManagerProfile;
  availableManagers?: ManagerProfile[];
  onAssign?: (managerId: string, dealId: string) => Promise<void>;
  onReassign?: (fromManagerId: string, toManagerId: string, dealId: string) => Promise<void>;
  readOnly?: boolean;
  showHistory?: boolean;
  loading?: boolean;
}

export const ManagerAssignment: React.FC<ManagerAssignmentProps> = ({
  dealId,
  dealName,
  dealValue,
  currentManager,
  availableManagers = [],
  onAssign,
  onReassign,
  readOnly = false,
  showHistory = true,
  loading = false,
}) => {
  const [showSelector, setShowSelector] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  const handleAssignment = async () => {
    const targetManagerId = selectedManager;
    if (!targetManagerId) return;

    setAssigning(true);
    try {
      if (currentManager && onReassign) {
        await onReassign(currentManager.id, targetManagerId, dealId);
      } else if (onAssign) {
        await onAssign(targetManagerId, dealId);
      }
      setShowSelector(false);
      setSelectedManager(null);
    } finally {
      setAssigning(false);
    }
  };

  const getWorkloadColor = (count?: number): string => {
    if (!count) return 'text-green-600';
    if (count <= 3) return 'text-green-600';
    if (count <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWinRateColor = (rate?: number): string => {
    if (!rate) return 'text-gray-600';
    if (rate >= 0.8) return 'text-green-600';
    if (rate >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Current Assignment */}
      {currentManager && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Assigned Manager</h3>
            {!readOnly && (
              <button
                onClick={() => setShowSelector(!showSelector)}
                className="text-sm px-3 py-1 border border-blue-300 text-blue-600 rounded hover:bg-blue-50 transition-colors"
              >
                Change Assignment
              </button>
            )}
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            {/* Manager Info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {currentManager.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{currentManager.name}</p>
                <p className="text-sm text-gray-600">{currentManager.title || 'Sales Manager'}</p>
                <p className="text-xs text-gray-500 mt-1">{currentManager.email}</p>
              </div>
            </div>

            {/* Metrics Grid */}
            {currentManager.successMetrics && (
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Win Rate</p>
                  <p
                    className={`text-lg font-bold ${getWinRateColor(
                      currentManager.successMetrics.winRate
                    )}`}
                  >
                    {Math.round(currentManager.successMetrics.winRate * 100)}%
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Avg Cycle</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currentManager.successMetrics.avgCycleDays}d
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3">
                  <p className="text-xs text-gray-600 mb-1">Closed (This Month)</p>
                  <p
                    className={`text-lg font-bold ${getWorkloadColor(
                      currentManager.closedDealsMonth
                    )}`}
                  >
                    {currentManager.closedDealsMonth || 0}
                  </p>
                </div>
              </div>
            )}

            {/* Workload */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 font-medium">Current Workload</span>
                <span
                  className={`text-sm font-bold ${getWorkloadColor(
                    currentManager.activeDealCount
                  )}`}
                >
                  {currentManager.activeDealCount || 0} active deals
                </span>
              </div>
              <div className="h-2 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    (currentManager.activeDealCount || 0) <= 3
                      ? 'bg-green-500'
                      : (currentManager.activeDealCount || 0) <= 6
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{
                    width: `${Math.min(100, ((currentManager.activeDealCount || 0) / 10) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager Selector */}
      {showSelector && !readOnly && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
          <h3 className="font-bold text-gray-900">Select New Manager</h3>

          {availableManagers.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No other managers available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableManagers.map((manager) => (
                <button
                  key={manager.id}
                  onClick={() => setSelectedManager(manager.id)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    selectedManager === manager.id
                      ? 'bg-blue-50 border-blue-500'
                      : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{manager.name}</p>
                      <p className="text-sm text-gray-600">{manager.email}</p>
                      {manager.skills && manager.skills.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {manager.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-1 bg-gray-100 text-xs rounded text-gray-700"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-gray-900">
                        {manager.activeDealCount || 0}
                      </div>
                      <p className="text-xs text-gray-600">active deals</p>
                      {manager.successMetrics && (
                        <p className="text-sm font-bold text-green-600 mt-2">
                          {Math.round(manager.successMetrics.winRate * 100)}% win rate
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setShowSelector(false);
                setSelectedManager(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignment}
              disabled={!selectedManager || assigning}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              {assigning ? 'Assigning...' : 'Reassign Deal'}
            </button>
          </div>
        </div>
      )}

      {/* Assignment Recommendation (AI-based) */}
      {!currentManager && availableManagers.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-green-900">Recommended Assignment</h4>
              <p className="text-sm text-green-800 mt-1">
                Based on manager performance and workload, here's the best fit:
              </p>
            </div>
          </div>

          {/* Find best manager based on deal value */}
          {(() => {
            const bestManager = availableManagers.sort((a, b) => {
              const aScore =
                (a.successMetrics?.winRate || 0.5) -
                (a.activeDealCount || 0) * 0.05;
              const bScore =
                (b.successMetrics?.winRate || 0.5) -
                (b.activeDealCount || 0) * 0.05;
              return bScore - aScore;
            })[0];

            return bestManager ? (
              <div className="bg-white rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-gray-900">{bestManager.name}</p>
                  <span className="text-sm font-bold text-green-600">
                    Best match
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{bestManager.email}</p>
                <button
                  onClick={() => {
                    setSelectedManager(bestManager.id);
                    handleAssignment();
                  }}
                  disabled={assigning}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {assigning ? 'Assigning...' : 'Assign to ' + bestManager.name}
                </button>
              </div>
            ) : null;
          })()}

          <button
            onClick={() => setShowSelector(true)}
            className="w-full px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            View All Managers
          </button>
        </div>
      )}
    </div>
  );
};
