/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 3
 * Enhanced Manager Dashboard with AI Integration
 *
 * Features:
 * - Real-time deal statistics
 * - AI-powered email suggestions
 * - Confidence scoring and risk assessment
 * - Actionable recommendations
 * - Escalation monitoring
 */

import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
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
  const { user } = useAuth();
  const { currentBusiness } = useBusinessContext();
  const {
    generateEmailSuggestions,
    useSuggestion,
    modifySuggestion,
    deleteSuggestion,
    createActionItem,
    suggestions,
    confidence,
    recommendations,
    loading: aiLoading,
  } = useAIManagerLayer();

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
  const [managerId, setManagerId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !currentBusiness) return;
    loadDashboardStats();
  }, [user, currentBusiness]);

  useEffect(() => {
    if (selectedDealId && managerId && currentBusiness) {
      // Generate AI suggestions for selected deal
      const deal = focusDeals.find((d) => d.id === selectedDealId);
      if (deal) {
        generateEmailSuggestions({
          dealId: selectedDealId,
          businessId: currentBusiness.id,
          managerId: managerId,
          dealValue: deal.value,
          stage: deal.stage,
          daysSinceActivity: deal.daysSinceActivity,
        });
      }
    }
  }, [selectedDealId, managerId, currentBusiness]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);

      if (!currentBusiness) return;

      const { data: managerProfiles } = await supabase
        .from('manager_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .eq('business_id', currentBusiness.id)
        .single();

      if (!managerProfiles) {
        setLoading(false);
        return;
      }

      const mgrId = managerProfiles.id;
      setManagerId(mgrId);

      const [
        assignmentsRes,
        actionItemsRes,
        recommendationsRes,
        escalationsRes,
        focusDealsRes,
      ] = await Promise.all([
        supabase
          .from('manager_assignments')
          .select('id, status')
          .eq('manager_id', mgrId)
          .eq('status', 'active'),
        supabase
          .from('manager_action_items')
          .select('id')
          .eq('manager_id', mgrId)
          .in('status', ['pending', 'in_progress']),
        supabase
          .from('ai_email_suggestions')
          .select('id')
          .eq('business_id', currentBusiness.id)
          .eq('reviewed', false),
        supabase
          .from('escalation_log')
          .select('id')
          .eq('business_id', currentBusiness.id)
          .gte(
            'created_at',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          )
          .eq('status', 'pending'),
        supabase
          .from('manager_focus_deals')
          .select(
            'id, deal_id, focus_type, ai_confidence'
          )
          .eq('manager_id', mgrId)
          .eq('status', 'active')
          .limit(5),
      ]);

      // Auto-select first focus deal if available
      if (focusDealsRes.data && focusDealsRes.data.length > 0) {
        setSelectedDealId(focusDealsRes.data[0].deal_id);
      }

      setStats({
        totalAssignedDeals: assignmentsRes.data?.length ?? 0,
        activeDeals: assignmentsRes.data?.filter((a) => a.status === 'active').length ?? 0,
        pendingActions: actionItemsRes.data?.length ?? 0,
        unreviewedAIRecommendations: recommendationsRes.data?.length ?? 0,
        escalationsThisWeek: escalationsRes.data?.length ?? 0,
      });

      // Mock focus deals (in production, fetch real deal data)
      setFocusDeals([
        {
          id: '1',
          dealName: 'Acme Corp - Enterprise Plan',
          value: 75000,
          stage: 'proposal',
          daysSinceActivity: 3,
        },
        {
          id: '2',
          dealName: 'TechStart Inc - Integration',
          value: 45000,
          stage: 'negotiation',
          daysSinceActivity: 7,
        },
        {
          id: '3',
          dealName: 'Global Industries - Multi-Year',
          value: 150000,
          stage: 'close',
          daysSinceActivity: 1,
        },
      ]);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manager Portal</h1>
          <p className="text-gray-600 mt-1">AI-Powered Deal Management & Recommendations</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Deals</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.activeDeals}
              </p>
            </div>
            <Target className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Actions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.pendingActions}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">AI Suggestions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.unreviewedAIRecommendations}
              </p>
            </div>
            <span className="text-2xl">✨</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Team Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">1</p>
            </div>
            <Users className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </div>

        <div
          className={`rounded-lg p-6 ${
            stats.escalationsThisWeek > 0
              ? 'bg-red-50 border border-red-200'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p
                className={`text-sm font-medium ${
                  stats.escalationsThisWeek > 0 ? 'text-red-600' : 'text-gray-600'
                }`}
              >
                Escalations
              </p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  stats.escalationsThisWeek > 0 ? 'text-red-900' : 'text-gray-900'
                }`}
              >
                {stats.escalationsThisWeek}
              </p>
            </div>
            <AlertTriangle
              className={`w-8 h-8 opacity-50 ${
                stats.escalationsThisWeek > 0
                  ? 'text-red-500'
                  : 'text-gray-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* AI Analysis Section */}
      {focusDeals.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Focus Deals Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Focus Deals</h3>
              <div className="space-y-2">
                {focusDeals.map((deal) => (
                  <button
                    key={deal.id}
                    onClick={() => setSelectedDealId(deal.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedDealId === deal.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">
                      {deal.dealName}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      ${deal.value.toLocaleString()} • {deal.stage}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {deal.daysSinceActivity}d since activity
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* Confidence Factors */}
            {confidence && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ConfidenceChart factors={confidence} />
              </div>
            )}

            {/* Recommendations */}
            {recommendations && recommendations.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ManagerRecommendations
                  recommendations={recommendations}
                  onAccept={async (rec) => {
                    if (selectedDealId && managerId) {
                      await createActionItem(
                        selectedDealId,
                        currentBusiness!.id,
                        managerId,
                        rec
                      );
                    }
                  }}
                  loading={aiLoading}
                />
              </div>
            )}

            {/* Email Suggestions */}
            {suggestions && suggestions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <AIEmailSuggestions
                  suggestions={suggestions}
                  onUse={useSuggestion}
                  onModify={modifySuggestion}
                  onDelete={deleteSuggestion}
                  loading={aiLoading}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
