import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, AlertCircle, BarChart3, Trash2, Eye } from 'lucide-react';

interface Business {
  id: string;
  name: string;
  ownerEmail: string;
  category: string;
  users: number;
  revenue: number;
  createdAt: string;
  lastActivity: string;
  status: 'active' | 'suspended' | 'trial_expired';
  plan: 'starter' | 'professional' | 'enterprise';
}

// Glassmorphic card component
const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`backdrop-blur-xl bg-white/10 border border-white/20 rounded-lg ${className}`}>
    {children}
  </div>
);

export const AdminBusinesses: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'starter' | 'professional' | 'enterprise'>(
    'all'
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'trial_expired'>(
    'all'
  );

  const [businesses] = useState<Business[]>([
    {
      id: '1',
      name: 'Tech Startup Inc',
      ownerEmail: 'john@techstartup.com',
      category: 'Technology',
      users: 245,
      revenue: 24500,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      plan: 'professional',
    },
    {
      id: '2',
      name: 'Fashion Boutique Co',
      ownerEmail: 'alice@fashionboutique.com',
      category: 'Fashion & Retail',
      users: 178,
      revenue: 18200,
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      plan: 'professional',
    },
    {
      id: '3',
      name: 'E-commerce Global',
      ownerEmail: 'bob@ecommerceglobal.com',
      category: 'E-commerce',
      users: 342,
      revenue: 35800,
      createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      plan: 'enterprise',
    },
    {
      id: '4',
      name: 'Service Solutions Ltd',
      ownerEmail: 'carol@servicesolutions.com',
      category: 'Services',
      users: 156,
      revenue: 16100,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'suspended',
      plan: 'starter',
    },
    {
      id: '5',
      name: 'Digital Marketing Pro',
      ownerEmail: 'david@digitalmarketingpro.com',
      category: 'Marketing',
      users: 198,
      revenue: 20400,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      lastActivity: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'trial_expired',
      plan: 'starter',
    },
  ]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const matchesSearch =
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPlan = planFilter === 'all' || business.plan === planFilter;
      const matchesStatus = statusFilter === 'all' || business.status === statusFilter;

      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [businesses, searchTerm, planFilter, statusFilter]);

  const relativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60_000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return `${Math.floor(d / 7)}w ago`;
  };

  const getPlanColor = (plan: string): string => {
    switch (plan) {
      case 'starter':
        return '#6B7280';
      case 'professional':
        return '#3B82F6';
      case 'enterprise':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'active':
        return '#10B981';
      case 'suspended':
        return '#EF4444';
      case 'trial_expired':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const stats = useMemo(() => {
    return {
      total: businesses.length,
      active: businesses.filter((b) => b.status === 'active').length,
      suspended: businesses.filter((b) => b.status === 'suspended').length,
      trial_expired: businesses.filter((b) => b.status === 'trial_expired').length,
      totalRevenue: businesses.reduce((sum, b) => sum + b.revenue, 0),
    };
  }, [businesses]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Businesses</h1>
            <p className="text-sm text-muted-foreground mt-1">View and manage all businesses on the platform</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-8 p-6 max-w-7xl mx-auto w-full overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Businesses', value: stats.total, color: '#FF9E1B' },
            { label: 'Active', value: stats.active, color: '#10B981' },
            { label: 'Suspended', value: stats.suspended, color: '#EF4444' },
            {
              label: 'Total Revenue',
              value: `$${(stats.totalRevenue / 1000).toFixed(1)}K`,
              color: '#87CEEB',
            },
          ].map((stat) => (
            <GlassCard key={stat.label} className="p-6">
              <div className="flex flex-col gap-1">
                <p className="m-0 text-xs text-muted-foreground">{stat.label}</p>
                <p className="m-0 text-2xl font-bold" style={{ color: stat.color }}>
                  {stat.value}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Filters */}
        <GlassCard className="p-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg backdrop-blur-md bg-white/5 border border-white/10">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by business name or owner email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none text-foreground text-sm outline-none placeholder-muted-foreground"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-6 flex-wrap">
              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Plan:
                </span>
                <div className="flex gap-1">
                  {(['all', 'starter', 'professional', 'enterprise'] as const).map((plan) => (
                    <button
                      key={plan}
                      onClick={() => setPlanFilter(plan)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                        planFilter === plan
                          ? 'bg-primary/90 text-primary-foreground border border-primary'
                          : 'bg-white/10 border border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/20'
                      }`}
                    >
                      {plan === 'all' ? 'All Plans' : plan.charAt(0).toUpperCase() + plan.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Status:
                </span>
                <div className="flex gap-1">
                  {(['all', 'active', 'suspended', 'trial_expired'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
                        statusFilter === status
                          ? 'bg-primary/90 text-primary-foreground border border-primary'
                          : 'bg-white/10 border border-white/20 text-muted-foreground hover:text-foreground hover:bg-white/20'
                      }`}
                    >
                      {status === 'all'
                        ? 'All'
                        : status === 'trial_expired'
                          ? 'Trial Expired'
                          : status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Businesses Table */}
        <GlassCard>
          <div className="p-0">
            {filteredBusinesses.length === 0 ? (
              <div className="text-center p-16 text-muted-foreground">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-base font-medium">No businesses found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Business
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Owner
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground text-xs">
                        Users
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground text-xs">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-muted-foreground text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBusinesses.map((business) => (
                      <tr
                        key={business.id}
                        className="border-b border-white/10 hover:bg-white/5 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="m-0 text-foreground font-semibold">
                              {business.name}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {business.category}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {business.ownerEmail}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground font-semibold">
                          {business.users}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div
                            className="inline-block px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: `${getPlanColor(business.plan)}20`,
                              color: getPlanColor(business.plan),
                            }}
                          >
                            {business.plan.charAt(0).toUpperCase() + business.plan.slice(1)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="inline-block px-2 py-1 rounded text-xs font-semibold"
                            style={{
                              backgroundColor: `${getStatusColor(business.status)}20`,
                              color: getStatusColor(business.status),
                            }}
                          >
                            {business.status === 'trial_expired'
                              ? 'Trial Expired'
                              : business.status.charAt(0).toUpperCase() +
                                business.status.slice(1)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              className="text-blue-600 hover:text-blue-700 p-1 transition-colors"
                              title="View business"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              className="text-purple-600 hover:text-purple-700 p-1 transition-colors"
                              title="View analytics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-700 p-1 transition-colors"
                              title="Delete business"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default AdminBusinesses;
