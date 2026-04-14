import { useEffect, useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Eye, Hand, Activity } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';

interface CampaignStats {
  total_recipients: number;
  sent_count: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  failed_count: number;
  bounced_count: number;
}

interface CampaignProgressTrackerProps {
  campaignId: string;
  isActive?: boolean;
  updateInterval?: number;
}

export function CampaignProgressTracker({
  campaignId,
  isActive = true,
  updateInterval = 10000, // 10 seconds
}: CampaignProgressTrackerProps) {
  const [stats, setStats] = useState<CampaignStats>({
    total_recipients: 0,
    sent_count: 0,
    delivered_count: 0,
    opened_count: 0,
    clicked_count: 0,
    failed_count: 0,
    bounced_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Fetch stats from database
  async function fetchStats() {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('outreach_email_tracking')
        .select('status')
        .eq('campaign_id', campaignId);

      if (error) {
        console.error('Error fetching campaign stats:', error);
        return;
      }

      if (!data) return;

      // Aggregate stats
      const newStats: CampaignStats = {
        total_recipients: data.length,
        sent_count: data.filter(d => d.status === 'sent').length,
        delivered_count: data.filter(d => d.status === 'delivered').length,
        opened_count: data.filter(d => d.status === 'opened').length,
        clicked_count: data.filter(d => d.status === 'clicked').length,
        failed_count: data.filter(d => d.status === 'failed').length,
        bounced_count: data.filter(d => d.status === 'bounced').length,
      };

      setStats(newStats);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error aggregating campaign stats:', err);
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [campaignId]);

  // Poll for updates if campaign is active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      fetchStats();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [campaignId, isActive, updateInterval]);

  const percentSent = stats.total_recipients > 0
    ? Math.round((stats.sent_count / stats.total_recipients) * 100)
    : 0;

  const deliveryRate = stats.sent_count > 0
    ? Math.round((stats.delivered_count / stats.sent_count) * 100)
    : 0;

  const openRate = stats.delivered_count > 0
    ? Math.round((stats.opened_count / stats.delivered_count) * 100)
    : 0;

  const clickRate = stats.opened_count > 0
    ? Math.round((stats.clicked_count / stats.opened_count) * 100)
    : 0;

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
    percentage,
  }: {
    icon: typeof Mail;
    label: string;
    value: number;
    color: string;
    percentage?: number;
  }) => (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          background: `${color}15`,
          color: color,
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
          {label}
        </div>
        <div style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b' }}>
          {value.toLocaleString()}
          {percentage !== undefined && (
            <span style={{ fontSize: '14px', color: color, marginLeft: '8px' }}>
              ({percentage}%)
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      data-guide="campaign-stats"
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e2e8f0',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', margin: '0 0 8px 0' }}>
          📊 Campaign Progress
        </h3>
        <p style={{ fontSize: '12px', color: '#64748b', margin: '0' }}>
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>

      {/* Overall progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
            Overall Progress
          </span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#3b82f6' }}>
            {percentSent}%
          </span>
        </div>
        <div
          style={{
            background: '#e2e8f0',
            height: '8px',
            borderRadius: '4px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6 0%, #06b6d4 100%)',
              width: `${percentSent}%`,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
          {stats.sent_count} of {stats.total_recipients} emails sent
        </div>
      </div>

      {/* Stats grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <StatCard
          icon={Mail}
          label="Sent"
          value={stats.sent_count}
          color="#3b82f6"
        />
        <StatCard
          icon={CheckCircle}
          label="Delivered"
          value={stats.delivered_count}
          color="#10b981"
          percentage={deliveryRate}
        />
        <StatCard
          icon={Eye}
          label="Opened"
          value={stats.opened_count}
          color="#a855f7"
          percentage={openRate}
        />
        <StatCard
          icon={Hand}
          label="Clicked"
          value={stats.clicked_count}
          color="#f59e0b"
          percentage={clickRate}
        />
      </div>

      {/* Issues section */}
      {(stats.failed_count > 0 || stats.bounced_count > 0) && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            display: 'flex',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, color: '#dc2626' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#7f1d1d' }}>
              Issues Detected
            </div>
            <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
              {stats.failed_count > 0 && (
                <div>• {stats.failed_count} failed sends</div>
              )}
              {stats.bounced_count > 0 && (
                <div>• {stats.bounced_count} bounced emails</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live indicator */}
      {isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', fontSize: '12px', color: '#10b981' }}>
          <Activity size={14} />
          <span style={{ animation: 'pulse 2s infinite' }}>
            Updating in real-time...
          </span>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
