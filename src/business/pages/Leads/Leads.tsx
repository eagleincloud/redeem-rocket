import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LeadFilters, type LeadFilterOptions } from './LeadFilters';
import { LeadCard, type LeadCardData } from './LeadCard';
import { Plus, Filter, List, Grid3X3 } from 'lucide-react';

// Mock data
const MOCK_LEADS: LeadCardData[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@techcorp.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Corp',
    stage: 'qualified',
    priority: 'high',
    source: 'website',
    value: 5000,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@acmeinc.com',
    phone: '+1 (555) 234-5678',
    company: 'Acme Inc',
    stage: 'proposal',
    priority: 'urgent',
    source: 'campaign',
    value: 12000,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'michael@globaltech.io',
    company: 'Global Tech',
    stage: 'contacted',
    priority: 'medium',
    source: 'referral',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    name: 'Emma Davis',
    email: 'emma.davis@startup.co',
    phone: '+1 (555) 345-6789',
    company: 'Startup Co',
    stage: 'new',
    priority: 'low',
    source: 'manual',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '5',
    name: 'James Wilson',
    email: 'james@enterprises.com',
    company: 'Big Enterprises',
    stage: 'won',
    priority: 'high',
    source: 'website',
    value: 25000,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    email: 'lisa@innovation.com',
    phone: '+1 (555) 456-7890',
    company: 'Innovation Labs',
    stage: 'negotiation',
    priority: 'high',
    source: 'campaign',
    value: 8500,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

type ViewMode = 'grid' | 'list';

interface Stats {
  total: number;
  new: number;
  qualified: number;
  won: number;
}

export const Leads: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LeadFilterOptions>({
    search: '',
    stage: [],
    priority: [],
    source: [],
    dateRange: 'all',
  });

  // Filter leads
  const filteredLeads = useMemo(() => {
    return MOCK_LEADS.filter((lead) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !lead.name.toLowerCase().includes(searchLower) &&
          !lead.email.toLowerCase().includes(searchLower) &&
          !lead.company?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Stage filter
      if (filters.stage.length > 0 && !filters.stage.includes(lead.stage)) {
        return false;
      }

      // Priority filter
      if (filters.priority.length > 0 && !filters.priority.includes(lead.priority)) {
        return false;
      }

      // Source filter
      if (filters.source.length > 0 && !filters.source.includes(lead.source)) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const now = Date.now();
        const leadDate = new Date(lead.createdAt).getTime();
        const diffMs = now - leadDate;
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        switch (filters.dateRange) {
          case 'today':
            if (diffDays > 1) return false;
            break;
          case 'week':
            if (diffDays > 7) return false;
            break;
          case 'month':
            if (diffDays > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [filters]);

  // Calculate stats
  const stats: Stats = useMemo(() => {
    return {
      total: MOCK_LEADS.length,
      new: MOCK_LEADS.filter((l) => l.stage === 'new').length,
      qualified: MOCK_LEADS.filter((l) => l.stage === 'qualified').length,
      won: MOCK_LEADS.filter((l) => l.stage === 'won').length,
    };
  }, []);

  const handleReset = () => {
    setFilters({
      search: '',
      stage: [],
      priority: [],
      source: [],
      dateRange: 'all',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Leads</h1>
              <p className="text-sm text-muted-foreground mt-1">{filteredLeads.length} of {stats.total} leads</p>
            </div>
            <Button onClick={() => navigate('/app/leads/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Add Lead
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: stats.total, color: 'text-blue-600' },
            { label: 'New', value: stats.new, color: 'text-slate-600' },
            { label: 'Qualified', value: stats.qualified, color: 'text-amber-600' },
            { label: 'Won', value: stats.won, color: 'text-green-600' },
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

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Button
            variant={showFilters ? 'default' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>

          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4 mr-1" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div>
            <LeadFilters
              filters={filters}
              onFiltersChange={setFilters}
              onReset={handleReset}
              isOpen={true}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Leads Grid/List */}
        {filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="p-16">
              <div className="text-center text-muted-foreground">
                <p className="text-base font-medium">No leads found</p>
                <p className="text-sm mt-2">
                  Try adjusting your filters or create a new lead
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'flex flex-col gap-4'
            }
          >
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                {...lead}
                onClick={() => navigate(`/app/leads/${lead.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leads;
