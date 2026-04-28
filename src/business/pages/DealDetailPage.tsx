/**
 * PHASE 7: AI + MANAGER LAYER - CHECKPOINT 5
 * Deal Detail Page - Integrated Deal Management
 *
 * Integrates all Phase 7 components:
 * - AI Email Suggestions
 * - Confidence Scoring
 * - Escalation Workflows
 * - Manager Assignment
 * - Action Items Management
 *
 * Route: /app/deals/:dealId
 */

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/app/lib/supabase';
import { useAuth } from '@/business/context/AuthContext';
import { useBusinessContext } from '@/business/context/BusinessContext';
import { useAIManagerLayer } from '@/business/hooks/useAIManagerLayer';

import {
  AIEmailSuggestions,
  ConfidenceChart,
  ManagerRecommendations,
  EscalationWorkflow,
  ManagerAssignment,
  ActionItemsManager,
} from '@/business/components/ManagerPortal';

import { ArrowLeft, Sparkles, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Deal {
  id: string;
  name: string;
  value: number;
  stage: string;
  customerName?: string;
  companyName?: string;
  daysInStage?: number;
}

interface DealActionItem {
  id: string;
  title: string;
  description?: string;
  actionType: string;
  priority: string;
  status: string;
  dueAt: string;
  aiSuggested: boolean;
}

export default function DealDetailPage() {
  const { dealId } = useParams<{ dealId: string }>();
  const navigate = useNavigate();
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

  const [deal, setDeal] = useState<Deal | null>(null);
  const [actionItems, setActionItems] = useState<DealActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEscalationFlow, setShowEscalationFlow] = useState(false);
  const [managerId, setManagerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'ai' | 'actions' | 'escalate' | 'assign'
  >('overview');

  // Load deal details
  useEffect(() => {
    if (!dealId || !currentBusiness) return;
    loadDealDetails();
  }, [dealId, currentBusiness]);

  // Load manager ID
  useEffect(() => {
    if (!user || !currentBusiness) return;
    loadManagerId();
  }, [user, currentBusiness]);

  // Generate AI suggestions when deal loads
  useEffect(() => {
    if (deal && managerId && currentBusiness) {
      generateEmailSuggestions({
        dealId: deal.id,
        businessId: currentBusiness.id,
        managerId: managerId,
        dealValue: deal.value,
        stage: deal.stage,
        daysSinceActivity: deal.daysInStage,
        customerName: deal.customerName,
        companyName: deal.companyName,
      });
    }
  }, [deal, managerId, currentBusiness]);

  const loadDealDetails = async () => {
    try {
      setLoading(true);

      // In production, fetch from database
      // For now, mock data
      const mockDeal: Deal = {
        id: dealId!,
        name: 'Enterprise Software Implementation',
        value: 125000,
        stage: 'proposal',
        customerName: 'John Smith',
        companyName: 'Acme Corporation',
        daysInStage: 5,
      };

      setDeal(mockDeal);

      // Load action items
      const mockActionItems: DealActionItem[] = [
        {
          id: '1',
          title: 'Send proposal document',
          actionType: 'send_proposal',
          priority: 'high',
          status: 'completed',
          dueAt: new Date().toISOString(),
          aiSuggested: true,
          description: 'Send detailed SOW and pricing',
        },
        {
          id: '2',
          title: 'Schedule demo call',
          actionType: 'schedule_call',
          priority: 'critical',
          status: 'pending',
          dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          aiSuggested: true,
          description: 'Walk through key features with decision makers',
        },
      ];

      setActionItems(mockActionItems);
    } catch (error) {
      console.error('Error loading deal details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadManagerId = async () => {
    try {
      const { data } = await supabase
        .from('manager_profiles')
        .select('id')
        .eq('user_id', user!.id)
        .eq('business_id', currentBusiness!.id)
        .single();

      if (data) {
        setManagerId(data.id);
      }
    } catch (error) {
      console.error('Error loading manager ID:', error);
    }
  };

  const tabClasses = (tab: string) => `
    px-4 py-2 font-medium text-sm border-b-2 transition-colors
    ${
      activeTab === tab
        ? 'text-blue-600 border-blue-600'
        : 'text-gray-600 border-gray-200 hover:text-gray-900'
    }
  `;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading deal details...</div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">Deal not found</h3>
          <button
            onClick={() => navigate('/app/manager-portal')}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            ← Back to Manager Portal
          </button>
        </div>
      </div>
    );
  }

  const stageColors: Record<string, string> = {
    initial_contact: 'bg-blue-100 text-blue-800',
    qualification: 'bg-purple-100 text-purple-800',
    proposal: 'bg-yellow-100 text-yellow-800',
    negotiation: 'bg-orange-100 text-orange-800',
    close: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/manager-portal')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{deal.name}</h1>
            <p className="text-gray-600 mt-1">
              {deal.customerName} at {deal.companyName}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">
            ${deal.value.toLocaleString()}
          </p>
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${
              stageColors[deal.stage.toLowerCase()] || stageColors.initial_contact
            }`}
          >
            {deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-semibold uppercase mb-2">
            Days in Stage
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {deal.daysInStage || 0}
          </p>
        </div>

        {confidence && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold uppercase mb-2">
              Overall Confidence
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(confidence.overallConfidence * 100)}%
            </p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 font-semibold uppercase mb-2">
            Action Items
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {actionItems.filter((a) => a.status !== 'completed').length}
          </p>
        </div>

        {recommendations && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600 font-semibold uppercase mb-2">
              Recommendations
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {recommendations.length}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8 overflow-x-auto">
          <button className={tabClasses('overview')} onClick={() => setActiveTab('overview')}>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Overview
            </span>
          </button>
          <button className={tabClasses('ai')} onClick={() => setActiveTab('ai')}>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Analysis
            </span>
          </button>
          <button className={tabClasses('actions')} onClick={() => setActiveTab('actions')}>
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Actions ({actionItems.length})
            </span>
          </button>
          <button className={tabClasses('assign')} onClick={() => setActiveTab('assign')}>
            <span className="flex items-center gap-2">
              👤 Assignment
            </span>
          </button>
          <button className={tabClasses('escalate')} onClick={() => setActiveTab('escalate')}>
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Escalate
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Deal Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Customer</p>
                  <p className="text-gray-900 mt-1">{deal.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Company</p>
                  <p className="text-gray-900 mt-1">{deal.companyName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Deal Value</p>
                  <p className="text-gray-900 mt-1">${deal.value.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Current Stage</p>
                  <p className="text-gray-900 mt-1 capitalize">{deal.stage}</p>
                </div>
              </div>
            </div>

            {confidence && (
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
                <ConfidenceChart
                  factors={confidence}
                  dealValue={deal.value}
                  daysInactiveStage={deal.daysInStage}
                />
              </div>
            )}
          </div>
        )}

        {/* AI Analysis Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            {confidence && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ConfidenceChart
                  factors={confidence}
                  dealValue={deal.value}
                  daysInactiveStage={deal.daysInStage}
                />
              </div>
            )}

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

            {recommendations && recommendations.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <ManagerRecommendations
                  recommendations={recommendations}
                  onAccept={async (rec) => {
                    if (managerId) {
                      await createActionItem(
                        deal.id,
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
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <ActionItemsManager
              dealId={deal.id}
              items={actionItems}
              onAdd={async (item) => {
                setActionItems([...actionItems, { ...item, id: Date.now().toString() } as any]);
              }}
              onUpdate={async (id, changes) => {
                setActionItems(
                  actionItems.map((item) =>
                    item.id === id ? { ...item, ...changes } : item
                  )
                );
              }}
              onDelete={async (id) => {
                setActionItems(actionItems.filter((item) => item.id !== id));
              }}
              onComplete={async (id) => {
                setActionItems(
                  actionItems.map((item) =>
                    item.id === id ? { ...item, status: 'completed' } : item
                  )
                );
              }}
            />
          </div>
        )}

        {/* Assignment Tab */}
        {activeTab === 'assign' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <ManagerAssignment
              dealId={deal.id}
              dealName={deal.name}
              dealValue={deal.value}
              availableManagers={[
                {
                  id: '1',
                  name: 'Sarah Johnson',
                  email: 'sarah@company.com',
                  title: 'Senior Account Manager',
                  activeDealCount: 3,
                  closureRate: 0.85,
                  closedDealsMonth: 2,
                  successMetrics: {
                    winRate: 0.85,
                    avgCycleDays: 45,
                    revenueClosed: 450000,
                  },
                },
              ]}
            />
          </div>
        )}

        {/* Escalate Tab */}
        {activeTab === 'escalate' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <EscalationWorkflow
              deal={deal}
              managers={[
                {
                  id: '2',
                  name: 'Michael Chen',
                  email: 'michael@company.com',
                },
              ]}
              onEscalate={async (escalation) => {
                console.log('Escalating deal:', escalation);
                setShowEscalationFlow(false);
              }}
              onCancel={() => setShowEscalationFlow(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
