/**
 * Layer 7: useManagerDashboard Hook
 * Custom hook for fetching and managing manager dashboard data
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabase';

export interface ManagerStats {
  totalLeads: number;
  conversionRate: number;
  avgResponseTime: number;
  pipelineValue: number;
  dealsClosedThisMonth: number;
  escalationsThisWeek: number;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  stage: string;
  value: number;
  daysInStage: number;
  lastActivity: string;
  priority: 'high' | 'medium' | 'low';
  email?: string;
}

export interface AIRecommendation {
  id: string;
  leadId: string;
  leadName: string;
  type: 'health' | 'action' | 'coaching';
  title: string;
  description: string;
  urgency: 'high' | 'medium' | 'low';
  actionUrl?: string;
  dismissedAt?: string | null;
}

export interface ManagerData {
  stats: ManagerStats | null;
  assignedLeads: Lead[];
  recommendations: AIRecommendation[];
}

export interface UseManagerDashboardReturn {
  data: ManagerData;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  dismissRecommendation: (recId: string) => Promise<void>;
}

/**
 * Hook to fetch and manage manager dashboard data
 * Handles stats, leads, and AI recommendations
 */
export function useManagerDashboard(
  businessId: string
): UseManagerDashboardReturn {
  const [data, setData] = useState<ManagerData>({
    stats: null,
    assignedLeads: [],
    recommendations: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateStats = useCallback((leads: any[]): ManagerStats => {
    const now = new Date();
    const thisMonth = leads.filter(l => {
      const leadDate = new Date(l.created_at);
      return (
        leadDate.getMonth() === now.getMonth() &&
        leadDate.getFullYear() === now.getFullYear()
      );
    });

    const totalValue = leads.reduce((sum, l) => sum + (l.deal_value || 0), 0);
    const wonLeads = leads.filter(l => l.status === 'won').length;
    const conversionRate =
      leads.length > 0 ? Math.round((wonLeads / leads.length) * 100) : 0;

    // Calculate average response time from recent activity logs
    const avgResponseTime =
      leads.length > 0
        ? Math.round(
            leads.reduce(
              (sum, l) => sum + (l.avg_response_hours || 4),
              0
            ) / leads.length
          )
        : 4;

    return {
      totalLeads: leads.length,
      conversionRate,
      avgResponseTime,
      pipelineValue: totalValue,
      dealsClosedThisMonth: thisMonth.filter(
        l => l.status === 'won'
      ).length,
      escalationsThisWeek: 2, // Mock - would come from escalation service
    };
  }, []);

  const formatLeads = useCallback((leads: any[]): Lead[] => {
    const now = new Date();
    return leads.map(l => ({
      id: l.id,
      name: l.name || 'Unknown',
      company: l.company || 'Unknown',
      stage: l.current_stage || 'lead',
      value: l.deal_value || 0,
      daysInStage: Math.floor(
        (now.getTime() - new Date(l.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      lastActivity: formatRelativeTime(
        new Date(l.updated_at || l.created_at)
      ),
      priority: l.priority || 'medium',
      email: l.email,
    }));
  }, []);

  const formatRecommendations = useCallback(
    (recs: any[]): AIRecommendation[] => {
      return recs.map(r => ({
        id: r.id,
        leadId: r.lead_id,
        leadName: r.lead_name || 'Unknown Lead',
        type: r.type || 'action',
        title: r.title || 'Recommendation',
        description: r.description || '',
        urgency: r.urgency || 'medium',
        actionUrl: r.action_url,
        dismissedAt: r.dismissed_at,
      }));
    },
    []
  );

  const fetchManagerData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!businessId) {
        setError('Business ID is required');
        return;
      }

      // Fetch leads
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });

      if (leadsError) throw leadsError;

      // Fetch recommendations
      const { data: recommendations, error: recsError } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('business_id', businessId)
        .is('dismissed_at', null)
        .order('urgency', { ascending: true })
        .limit(5);

      if (recsError) throw recsError;

      // Calculate and format data
      const stats = calculateStats(leads || []);
      const formattedLeads = formatLeads(leads || []);
      const formattedRecommendations = formatRecommendations(
        recommendations || []
      );

      setData({
        stats,
        assignedLeads: formattedLeads,
        recommendations: formattedRecommendations,
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : 'Failed to fetch manager data';
      setError(errorMsg);
      console.error('Error fetching manager data:', err);
    } finally {
      setLoading(false);
    }
  }, [businessId, calculateStats, formatLeads, formatRecommendations]);

  const dismissRecommendation = useCallback(
    async (recId: string) => {
      try {
        await supabase
          .from('ai_recommendations')
          .update({ dismissed_at: new Date().toISOString() })
          .eq('id', recId);

        setData(prev => ({
          ...prev,
          recommendations: prev.recommendations.filter(r => r.id !== recId),
        }));
      } catch (err) {
        console.error('Error dismissing recommendation:', err);
        throw err;
      }
    },
    []
  );

  // Fetch data on mount and when businessId changes
  useEffect(() => {
    if (businessId) {
      fetchManagerData();
    }
  }, [businessId, fetchManagerData]);

  return {
    data,
    loading,
    error,
    refetch: fetchManagerData,
    dismissRecommendation,
  };
}

/**
 * Format date to relative time string (e.g., "5m ago", "3h ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;

  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

/**
 * Hook for fetching single lead details with recommendations
 */
export function useLeadWithRecommendations(
  leadId: string
): {
  lead: any | null;
  recommendations: AIRecommendation[];
  loading: boolean;
  error: string | null;
} {
  const [lead, setLead] = useState<any | null>(null);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!leadId) {
          setError('Lead ID is required');
          return;
        }

        // Fetch lead details
        const { data: leadData, error: leadError } = await supabase
          .from('leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (leadError) throw leadError;

        // Fetch lead-specific recommendations
        const { data: recs, error: recsError } = await supabase
          .from('ai_recommendations')
          .select('*')
          .eq('lead_id', leadId)
          .is('dismissed_at', null);

        if (recsError) throw recsError;

        setLead(leadData);
        setRecommendations(
          (recs || []).map(r => ({
            id: r.id,
            leadId: r.lead_id,
            leadName: r.lead_name || 'Unknown',
            type: r.type || 'action',
            title: r.title || 'Recommendation',
            description: r.description || '',
            urgency: r.urgency || 'medium',
            actionUrl: r.action_url,
            dismissedAt: r.dismissed_at,
          }))
        );
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Failed to fetch lead data';
        setError(errorMsg);
        console.error('Error fetching lead:', err);
      } finally {
        setLoading(false);
      }
    };

    if (leadId) {
      fetchData();
    }
  }, [leadId]);

  return {
    lead,
    recommendations,
    loading,
    error,
  };
}
