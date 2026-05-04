import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { BarChart3, Users, Building2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdminMetric {
  label: string;
  value: number | string;
  trend?: number;
  comparison?: 'beating' | 'on-track' | 'behind';
  color: string;
}

// Glassmorphic card component
const GlassCard: React.FC<{ children: React.ReactNode; header?: string; className?: string }> = ({ children, header, className = '' }) => (
  <div className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg ${className}`}>
    {header && (
      <div className="border-b border-white/10 px-6 py-4">
        <h2 className="text-xl font-bold text-foreground">{header}</h2>
      </div>
    )}
    {children}
  </div>
);

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();

  // Mock data
  const adminMetrics = useMemo(() => {
    const metrics: AdminMetric[] = [
      {
        label: 'Total Businesses',
        value: 2847,
        trend: 12,
        comparison: 'beating',
        color: '#3B82F6',
      },
      {
        label: 'Active Users',
        value: 12543,
        trend: 8,
        comparison: 'beating',
        color: '#10B981',
      },
      {
        label: 'Total Revenue',
        value: '$847,320',
        trend: 23,
        comparison: 'beating',
        color: '#8B5CF6',
      },
      {
        label: 'System Health',
        value: '99.8%',
        trend: 0,
        comparison: 'on-track',
        color: '#F59E0B',
      },
    ];
    return metrics;
  }, []);

  const chartData = useMemo(
    () => [
      { name: 'Week 1', businesses: 420, revenue: 34200, users: 1240 },
      { name: 'Week 2', businesses: 385, revenue: 31800, users: 1120 },
      { name: 'Week 3', businesses: 510, revenue: 42300, users: 1540 },
      { name: 'Week 4', businesses: 478, revenue: 39500, users: 1430 },
      { name: 'Week 5', businesses: 612, revenue: 50800, users: 1820 },
      { name: 'Week 6', businesses: 645, revenue: 53400, users: 1950 },
      { name: 'Week 7', businesses: 687, revenue: 56900, users: 2050 },
      { name: 'Week 8', businesses: 721, revenue: 59600, users: 2150 },
    ],
    []
  );

  const topBusinesses = useMemo(
    () => [
      { name: 'Tech Startup Inc', users: 245, revenue: '$24,500', status: 'active' },
      { name: 'Fashion Boutique Co', users: 178, revenue: '$18,200', status: 'active' },
      { name: 'E-commerce Global', users: 342, revenue: '$35,800', status: 'active' },
      { name: 'Service Solutions Ltd', users: 156, revenue: '$16,100', status: 'active' },
      { name: 'Digital Marketing Pro', users: 198, revenue: '$20,400', status: 'active' },
    ],
    []
  );

  const systemStatus = useMemo(
    () => [
      { name: 'Database', status: 'operational', latency: '12ms' },
      { name: 'API Server', status: 'operational', latency: '45ms' },
      { name: 'Email Service', status: 'operational', latency: '120ms' },
      { name: 'Storage', status: 'operational', latency: '18ms' },
      { name: 'Cache', status: 'operational', latency: '2ms' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">System overview and key metrics</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full overflow-auto">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminMetrics.map((metric) => (
            <GlassCard key={metric.label} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: metric.color }}>
                    {metric.value}
                  </p>
                </div>
                {metric.trend !== undefined && (
                  <div className={`text-sm font-semibold ${metric.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {metric.trend > 0 ? '+' : ''}{metric.trend}%
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Growth Chart */}
        <GlassCard header="Platform Growth" className="p-6">
          <p className="text-sm text-muted-foreground mb-6">Businesses, Revenue, and Users - Last 8 weeks</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,158,27,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(15,29,45,0.8)', border: '1px solid rgba(255,158,27,0.3)' }} />
              <Legend />
              <Line type="monotone" dataKey="businesses" stroke="#FF9E1B" name="New Businesses" strokeWidth={2} />
              <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue (÷100)" strokeWidth={2} />
              <Line type="monotone" dataKey="users" stroke="#87CEEB" name="New Users" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Top Businesses & System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Businesses */}
          <GlassCard header="Top Businesses" className="p-6">
            <p className="text-sm text-muted-foreground mb-6">By user count and revenue</p>
            <div className="flex flex-col gap-4">
              {topBusinesses.map((business, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg backdrop-blur-md bg-white/5 border border-white/10 flex justify-between items-center"
                >
                  <div>
                    <p className="m-0 text-sm font-semibold text-foreground">
                      {business.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {business.users} users
                    </p>
                  </div>
                  <p className="m-0 text-sm font-semibold text-green-600">
                    {business.revenue}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* System Status */}
          <GlassCard header="System Status" className="p-6">
            <p className="text-sm text-muted-foreground mb-6">Service health and latency</p>
            <div className="flex flex-col gap-4">
              {systemStatus.map((service, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg backdrop-blur-md bg-white/5 border border-white/10 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-green-600" />
                    <div>
                      <p className="m-0 text-sm font-semibold text-foreground">
                        {service.name}
                      </p>
                    </div>
                  </div>
                  <p className="m-0 text-xs text-muted-foreground">
                    {service.latency}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Quick Actions */}
        <GlassCard header="Quick Actions" className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: '👥', label: 'Manage Users', action: '/admin/users' },
              { icon: '🏢', label: 'Manage Businesses', action: '/admin/businesses' },
              { icon: '📊', label: 'View Analytics', action: '/admin/analytics' },
              { icon: '⚙️', label: 'System Settings', action: '/admin/settings' },
              { icon: '📧', label: 'Email Campaigns', action: '/admin/campaigns' },
              { icon: '🔐', label: 'Security', action: '/admin/security' },
            ].map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.action)}
                className="p-4 rounded-lg backdrop-blur-md bg-white/5 border border-white/10 cursor-pointer text-center transition-all hover:bg-white/10 hover:border-primary"
              >
                <div className="text-2xl mb-2">
                  {action.icon}
                </div>
                <p className="m-0 text-xs font-semibold text-muted-foreground">
                  {action.label}
                </p>
              </button>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminDashboard;
