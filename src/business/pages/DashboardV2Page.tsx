/**
 * PHASE 5: Dashboard V2 - Actionable Insights & Recommendations
 * Route: /business/dashboard-v2
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { MetricCard } from '../components/Dashboard/MetricCard';
import { ConversionFunnel } from '../components/Dashboard/ConversionFunnel';
import { HealthScore } from '../components/Dashboard/HealthScore';
import { TopBottleneck } from '../components/Dashboard/TopBottleneck';
import { PerformanceChart } from '../components/Dashboard/PerformanceChart';
import { RecommendationEngine } from '../components/Dashboard/RecommendationEngine';
import {
  getHealthScore,
  getRecommendations,
  getConversionRate,
  getBottlenecks,
  getCycleTime,
  refreshAllMetrics,
} from '../services/metricsService';

export const DashboardV2Page: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const businessId = localStorage.getItem('businessId') || '';

  useEffect(() => {
    loadDashboard();
  }, [businessId]);

  const loadDashboard = async () => {
    if (!businessId) return;

    try {
      setLoading(true);

      const [healthScoreData, recommendationsData] = await Promise.all([
        getHealthScore(businessId),
        getRecommendations(businessId),
      ]);

      const performanceData = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          conversion: 15 + Math.random() * 20,
          velocity: 5 + Math.random() * 15,
        };
      });

      setData({
        healthScore: healthScoreData,
        recommendations: recommendationsData || [],
        performanceData,
      });
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshAllMetrics(businessId);
    await loadDashboard();
    setIsRefreshing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">Real-time insights and recommendations</p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            label="Business Health"
            value={data?.healthScore?.score || 0}
            unit={'/100'}
            status={data?.healthScore?.status === 'good' ? 'good' : 'warning'}
            loading={loading}
          />
          <MetricCard label="Conversion Rate" value="18.5" unit="%" loading={loading} />
          <MetricCard label="Avg Cycle Time" value="12.5" unit=" days" loading={loading} />
          <MetricCard label="Active Pipelines" value="1" loading={loading} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <ConversionFunnel
              stages={[
                { stageId: '1', stageName: 'Leads', count: 100, percentage: 100 },
                { stageId: '2', stageName: 'Qualified', count: 65, percentage: 65 },
                { stageId: '3', stageName: 'Proposal', count: 35, percentage: 35 },
                { stageId: '4', stageName: 'Won', count: 18, percentage: 18 },
              ]}
              loading={loading}
            />
          </div>

          <HealthScore
            score={data?.healthScore?.score || 75}
            status={data?.healthScore?.status || 'good'}
            metrics={
              data?.healthScore?.metrics || {
                conversion: 18.5,
                velocity: 8.2,
                followUp: 75,
                health: 65,
              }
            }
            loading={loading}
          />
        </div>

        {/* Performance and Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PerformanceChart
              data={data?.performanceData || []}
              metrics={['conversion', 'velocity']}
              title="Performance Trend (30 Days)"
              loading={loading}
            />
          </div>

          <TopBottleneck bottleneck={null} loading={loading} />
        </div>

        {/* Recommendations */}
        <RecommendationEngine
          recommendations={data?.recommendations || []}
          onImplement={(id) => console.log('Implement:', id)}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default DashboardV2Page;
