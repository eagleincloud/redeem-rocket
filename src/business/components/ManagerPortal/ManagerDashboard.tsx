import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';

interface DashboardStats {
  totalAssignedDeals: number;
  activeDeals: number;
  pendingActions: number;
  unreviewedAIRecommendations: number;
  escalationsThisWeek: number;
}

export default function ManagerDashboard() {
  const { user } = useAuth();
  const { currentBusiness } = useBusinessContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalAssignedDeals: 0,
    activeDeals: 0,
    pendingActions: 0,
    unreviewedAIRecommendations: 0,
    escalationsThisWeek: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !currentBusiness) return;
    loadDashboardStats();
  }, [user, currentBusiness]);

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

      const managerId = managerProfiles.id;

      const [
        assignmentsRes,
        actionItemsRes,
        recommendationsRes,
        escalationsRes,
      ] = await Promise.all([
        supabase
          .from('manager_assignments')
          .select('id, status')
          .eq('manager_id', managerId)
          .eq('status', 'active'),
        supabase
          .from('manager_action_items')
          .select('id')
          .eq('manager_id', managerId)
          .in('status', ['pending', 'in_progress']),
        supabase
          .from('ai_recommendations')
          .select('id')
          .eq('business_id', currentBusiness.id)
          .eq('is_accepted', null),
        supabase
          .from('escalation_log')
          .select('id')
          .eq('business_id', currentBusiness.id)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .eq('status', 'pending'),
      ]);

      setStats({
        totalAssignedDeals: assignmentsRes.data?.length ?? 0,
        activeDeals: assignmentsRes.data?.filter(a => a.status === 'active').length ?? 0,
        pendingActions: actionItemsRes.data?.length ?? 0,
        unreviewedAIRecommendations: recommendationsRes.data?.length ?? 0,
        escalationsThisWeek: escalationsRes.data?.length ?? 0,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="manager-dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="manager-dashboard">
      <h1>Manager Portal</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.activeDeals}</div>
          <div className="stat-label">Active Deals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pendingActions}</div>
          <div className="stat-label">Pending Actions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.unreviewedAIRecommendations}</div>
          <div className="stat-label">AI Suggestions</div>
        </div>
      </div>
    </div>
  );
}
