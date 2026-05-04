import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CampaignCard, type CampaignCardData } from './CampaignCard';
import { Plus } from 'lucide-react';

// Mock campaign data
const MOCK_CAMPAIGNS: CampaignCardData[] = [
  {
    id: '1',
    name: 'Welcome Series',
    triggerType: 'signup',
    stepCount: 3,
    status: 'active',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    sentCount: 1245,
    openRate: 42,
    clickRate: 8,
  },
  {
    id: '2',
    name: 'Abandoned Cart Recovery',
    triggerType: 'abandoned_cart',
    stepCount: 2,
    status: 'active',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    sentCount: 856,
    openRate: 38,
    clickRate: 12,
  },
  {
    id: '3',
    name: 'Post-Purchase Follow-up',
    triggerType: 'purchase',
    stepCount: 4,
    status: 'active',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    sentCount: 2100,
    openRate: 48,
    clickRate: 15,
  },
  {
    id: '4',
    name: 'Product Updates Newsletter',
    triggerType: 'manual',
    stepCount: 1,
    status: 'inactive',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    sentCount: 5200,
    openRate: 35,
    clickRate: 6,
  },
  {
    id: '5',
    name: 'VIP Exclusive Offer',
    triggerType: 'manual',
    stepCount: 2,
    status: 'draft',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    sentCount: 0,
    openRate: 0,
    clickRate: 0,
  },
  {
    id: '6',
    name: 'Re-engagement Campaign',
    triggerType: 'follow_up',
    stepCount: 3,
    status: 'active',
    createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    sentCount: 3400,
    openRate: 32,
    clickRate: 9,
  },
];

type FilterStatus = 'all' | 'active' | 'inactive' | 'draft';

interface Stats {
  totalCampaigns: number;
  active: number;
  totalSent: number;
  avgOpenRate: number;
}

export const EmailCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter campaigns
  const filteredCampaigns = useMemo(() => {
    if (statusFilter === 'all') return MOCK_CAMPAIGNS;
    return MOCK_CAMPAIGNS.filter((campaign) => campaign.status === statusFilter);
  }, [statusFilter]);

  // Calculate stats
  const stats: Stats = useMemo(() => {
    const activeCampaigns = MOCK_CAMPAIGNS.filter((c) => c.status === 'active');
    const totalSent = MOCK_CAMPAIGNS.reduce((sum, c) => sum + c.sentCount, 0);
    const avgOpenRate = Math.round(
      MOCK_CAMPAIGNS.filter((c) => c.sentCount > 0).reduce((sum, c) => sum + c.openRate, 0) /
        MOCK_CAMPAIGNS.filter((c) => c.sentCount > 0).length
    );

    return {
      totalCampaigns: MOCK_CAMPAIGNS.length,
      active: activeCampaigns.length,
      totalSent,
      avgOpenRate,
    };
  }, []);

  const handleCampaignAction = (action: string, id: string) => {
    switch (action) {
      case 'edit':
        navigate(`/app/campaigns/${id}/edit`);
        break;
      case 'analytics':
        navigate(`/app/campaigns/${id}/analytics`);
        break;
      case 'duplicate':
        // Handle duplicate
        break;
      case 'delete':
        // Handle delete
        break;
      case 'toggle':
        // Handle toggle status
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Email Campaigns</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredCampaigns.length} of {stats.totalCampaigns} campaigns
              </p>
            </div>
            <Button onClick={() => navigate('/app/campaigns/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Campaigns', value: stats.totalCampaigns, color: 'text-blue-600' },
            { label: 'Active', value: stats.active, color: 'text-green-600' },
            { label: 'Total Sent', value: stats.totalSent.toLocaleString(), color: 'text-purple-600' },
            { label: 'Avg Open Rate', value: `${stats.avgOpenRate}%`, color: 'text-amber-600' },
          ].map((stat) => (
            <Card key={stat.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="text-center">
                  <p className="m-0 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {['all', 'active', 'inactive', 'draft'].map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(filter as FilterStatus)}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Button>
          ))}
        </div>

        {/* Campaigns Grid */}
        {filteredCampaigns.length === 0 ? (
          <Card>
            <CardContent className="p-16">
              <div className="text-center text-muted-foreground">
                <p className="text-base font-medium">No campaigns found</p>
                <p className="text-sm mt-2">Create a new campaign to get started</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                {...campaign}
                onEdit={() => handleCampaignAction('edit', campaign.id)}
                onViewAnalytics={() => handleCampaignAction('analytics', campaign.id)}
                onDuplicate={() => handleCampaignAction('duplicate', campaign.id)}
                onDelete={() => handleCampaignAction('delete', campaign.id)}
                onToggleStatus={() => handleCampaignAction('toggle', campaign.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailCampaigns;
