/**
 * Campaign Analytics Component
 * Charts and metrics for email campaign performance
 * Displays send volume, open rate, click rate, and funnel
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, MailOpen, Click } from 'lucide-react';
import { getCampaignAnalytics, getCampaignTracking, CampaignAnalytics } from '@/app/api/email';

interface CampaignAnalyticsProps {
  campaignId: string;
  dateRange?: { startDate: string; endDate: string };
}

export const CampaignAnalyticsComponent: React.FC<CampaignAnalyticsProps> = ({
  campaignId,
  dateRange,
}) => {
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [trackingData, setTrackingData] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [campaignId, dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [analyticsData, trackingResponse] = await Promise.all([
        getCampaignAnalytics(campaignId, dateRange),
        getCampaignTracking(campaignId, { limit: 1000 }),
      ]);

      setAnalytics(analyticsData);
      setTrackingData(trackingResponse.tracking);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin mb-4 text-2xl">⚙️</div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
        <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const deliveryRate = analytics.sent_count > 0
    ? ((analytics.delivered_count / analytics.sent_count) * 100).toFixed(1)
    : 0;

  const bounceRate = analytics.sent_count > 0
    ? ((analytics.bounced_count / analytics.sent_count) * 100).toFixed(1)
    : 0;

  // Engagement funnel data
  const funnel = [
    { label: 'Sent', count: analytics.sent_count, color: '#3B82F6' },
    { label: 'Delivered', count: analytics.delivered_count, color: '#10B981' },
    { label: 'Opened', count: analytics.open_count, color: '#F59E0B' },
    { label: 'Clicked', count: analytics.click_count, color: '#8B5CF6' },
    { label: 'Converted', count: analytics.conversion_count, color: '#EC4899' },
  ];

  // Calculate engagement data by day (if available)
  const dailyData = trackingData.reduce((acc: Record<string, number>, record) => {
    const date = new Date(record.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = 0;
    acc[date]++;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Total Sent</p>
          <p className="text-3xl font-bold text-gray-900">{analytics.sent_count}</p>
          <p className="text-xs text-gray-500 mt-2">emails</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Delivery Rate</p>
          <p className="text-3xl font-bold text-green-600">{deliveryRate}%</p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.delivered_count} of {analytics.sent_count}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <MailOpen className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-gray-600">Open Rate</p>
          </div>
          <p className="text-3xl font-bold text-amber-600">{analytics.open_rate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">{analytics.open_count} opens</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Click className="w-4 h-4 text-purple-600" />
            <p className="text-sm text-gray-600">Click Rate</p>
          </div>
          <p className="text-3xl font-bold text-purple-600">{analytics.click_rate.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-2">{analytics.click_count} clicks</p>
        </div>
      </div>

      {/* Funnel Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Funnel</h3>
        <div className="space-y-4">
          {funnel.map((stage, index) => {
            const percentage = analytics.sent_count > 0
              ? ((stage.count / analytics.sent_count) * 100).toFixed(1)
              : 0;

            return (
              <div key={stage.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stage.label}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stage.count} ({percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="h-3 rounded-full transition"
                    style={{
                      width: `${Math.min(parseFloat(percentage as string), 100)}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Bounce Rate</p>
          <p className="text-3xl font-bold text-red-600">{bounceRate}%</p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.bounced_count} bounces
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Unsubscribes</p>
          <p className="text-3xl font-bold text-orange-600">
            {trackingData.filter(r => r.delivery_status === 'unsubscribed').length}
          </p>
          <p className="text-xs text-gray-500 mt-2">emails unsubscribed</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <p className="text-sm text-gray-600 mb-2">Conversions</p>
          <p className="text-3xl font-bold text-blue-600">{analytics.conversion_count}</p>
          <p className="text-xs text-gray-500 mt-2">
            {analytics.sent_count > 0
              ? ((analytics.conversion_count / analytics.sent_count) * 100).toFixed(1)
              : 0}
            % conversion rate
          </p>
        </div>
      </div>

      {/* Daily Breakdown */}
      {Object.keys(dailyData).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Breakdown</h3>
          <div className="flex items-end gap-2 h-48">
            {Object.entries(dailyData).map(([date, count]) => {
              const maxCount = Math.max(...Object.values(dailyData) as number[]);
              const percentage = ((count as number) / maxCount) * 100;

              return (
                <div
                  key={date}
                  className="flex-1 bg-blue-600 rounded-t hover:bg-blue-700 transition"
                  style={{ height: `${percentage}%` }}
                  title={`${date}: ${count} emails`}
                />
              );
            })}
          </div>
          <div className="flex gap-2 mt-4 text-xs text-gray-600 overflow-x-auto pb-2">
            {Object.keys(dailyData).map(date => (
              <div key={date} className="whitespace-nowrap text-center flex-1">
                {date}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
