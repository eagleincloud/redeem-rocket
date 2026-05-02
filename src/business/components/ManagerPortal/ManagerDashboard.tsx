/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 3
 * Enhanced Manager Dashboard with AI Integration
 */

import React, { useEffect, useState } from 'react';
import { useBusinessContext } from '../../context/BusinessContext';
import { useAIManagerLayer } from '../../hooks/useAIManagerLayer';
import { AIEmailSuggestions } from './AIEmailSuggestions';
import { ConfidenceChart } from './ConfidenceChart';
import { ManagerRecommendations } from './ManagerRecommendations';
import { Calendar, Users, Target, AlertTriangle } from 'lucide-react';

interface DashboardStats {
  totalAssignedDeals: number;
  activeDeals: number;
  pendingActions: number;
  unreviewedAIRecommendations: number;
  escalationsThisWeek: number;
}

interface FocusDeal {
  id: string;
  dealName: string;
  value: number;
  stage: string;
  daysSinceActivity: number;
}

export default function ManagerDashboard() {
  const { currentBusiness } = useBusinessContext();
  const { suggestions, confidence, recommendations, loading: aiLoading } = useAIManagerLayer();

  const [stats, setStats] = useState<DashboardStats>({
    totalAssignedDeals: 0,
    activeDeals: 0,
    pendingActions: 0,
    unreviewedAIRecommendations: 0,
    escalationsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);
  const [focusDeals, setFocusDeals] = useState<FocusDeal[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentBusiness) return;
    loadDashboardStats();
  }, [currentBusiness]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setStats({
        totalAssignedDeals: 12,
        activeDeals: 8,
        pendingActions: 5,
        unreviewedAIRecommendations: 3,
        escalationsThisWeek: 1,
      });
      setFocusDeals([
        { id: '1', dealName: 'Acme Corp Deal', value: 85000, stage: 'proposal', daysSinceActivity: 3 },
        { id: '2', dealName: 'TechStart Inc', value: 35000, stage: 'qualified', daysSinceActivity: 7 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Manager Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-4">
            <p className="text-white/60 text-sm">Total Assigned Deals</p>
            <p className="text-2xl font-bold mt-2">{stats.totalAssignedDeals}</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-4">
            <p className="text-white/60 text-sm">Active Deals</p>
            <p className="text-2xl font-bold mt-2">{stats.activeDeals}</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-4">
            <p className="text-white/60 text-sm">Pending Actions</p>
            <p className="text-2xl font-bold mt-2">{stats.pendingActions}</p>
          </div>
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg p-4">
            <p className="text-white/60 text-sm">AI Recommendations</p>
            <p className="text-2xl font-bold mt-2">{stats.unreviewedAIRecommendations}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AIEmailSuggestions suggestions={suggestions || []} loading={aiLoading} />
          <ConfidenceChart confidence={confidence || 0} loading={aiLoading} />
        </div>

        {recommendations && (
          <div className="mt-6">
            <ManagerRecommendations recommendations={recommendations} />
          </div>
        )}
      </div>
    </div>
  );
}
