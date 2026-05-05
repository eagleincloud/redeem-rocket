import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, Filter, Plus, Phone, Mail, MessageSquare, Clock, TrendingUp } from 'lucide-react';

const leads = [
  {
    id: 1,
    name: 'John Smith',
    company: 'Tech Corp',
    phone: '+1 (555) 123-4567',
    email: 'john@techcorp.com',
    stage: 'New',
    priority: 'High',
    source: 'Website',
    lastActivity: '5 min ago',
    avatar: 'JS',
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    company: 'Marketing Plus',
    phone: '+1 (555) 234-5678',
    email: 'sarah@marketingplus.com',
    stage: 'Contacted',
    priority: 'Medium',
    source: 'Referral',
    lastActivity: '2 hours ago',
    avatar: 'SJ',
  },
  {
    id: 3,
    name: 'Mike Davis',
    company: 'Startup Inc',
    phone: '+1 (555) 345-6789',
    email: 'mike@startup.com',
    stage: 'Qualified',
    priority: 'High',
    source: 'Social Media',
    lastActivity: '1 day ago',
    avatar: 'MD',
  },
  {
    id: 4,
    name: 'Emily Chen',
    company: 'Design Studio',
    phone: '+1 (555) 456-7890',
    email: 'emily@design.com',
    stage: 'Proposal',
    priority: 'Low',
    source: 'Email Campaign',
    lastActivity: '2 days ago',
    avatar: 'EC',
  },
  {
    id: 5,
    name: 'Rahul Sharma',
    company: 'Nexus Solutions',
    phone: '+91 98765 43210',
    email: 'rahul@nexus.in',
    stage: 'Won',
    priority: 'High',
    source: 'WhatsApp',
    lastActivity: '3 days ago',
    avatar: 'RS',
  },
  {
    id: 6,
    name: 'Priya Nair',
    company: 'Bloom Retail',
    phone: '+91 87654 32109',
    email: 'priya@bloom.in',
    stage: 'Contacted',
    priority: 'Medium',
    source: 'Instagram',
    lastActivity: '4 hours ago',
    avatar: 'PN',
  },
];

const stageColors: Record<string, string> = {
  'New': 'bg-blue-100 text-blue-800',
  'Contacted': 'bg-yellow-100 text-yellow-800',
  'Qualified': 'bg-purple-100 text-purple-800',
  'Proposal': 'bg-orange-100 text-orange-800',
  'Won': 'bg-green-100 text-green-800',
  'Lost': 'bg-red-100 text-red-800',
};

const priorityColors: Record<string, string> = {
  'High': 'bg-red-100 text-red-800',
  'Medium': 'bg-orange-100 text-orange-800',
  'Low': 'bg-gray-100 text-gray-800',
};

const avatarColors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function LeadsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');

  const filteredLeads = leads.filter(lead => {
    const matchesSearch =
      !searchQuery ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage =
      selectedStage === 'all' || lead.stage.toLowerCase() === selectedStage;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="p-6 py-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: '1.3rem' }}>Lead Management</h2>
          <p className="text-gray-500 text-sm mt-0.5">{leads.length} total leads • {leads.filter(l => l.stage === 'New').length} new</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Lead
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'New Leads', value: '28', color: '#3B82F6', icon: '🆕' },
          { label: 'Contacted', value: '45', color: '#F59E0B', icon: '📞' },
          { label: 'Qualified', value: '32', color: '#8B5CF6', icon: '✅' },
          { label: 'Conversion Rate', value: '16.2%', color: '#10B981', icon: '📈' },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ fontSize: '1.1rem' }}>{stat.icon}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger className="w-full sm:w-48 h-10">
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="won">Won</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 h-10">
          <Filter className="w-4 h-4" />
          More Filters
        </Button>
      </div>

      {/* Leads List */}
      <div className="space-y-3">
        {filteredLeads.map((lead, idx) => (
          <Card key={lead.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: avatarColors[idx % avatarColors.length], fontWeight: 700, fontSize: '0.85rem' }}
                >
                  {lead.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-gray-900" style={{ fontWeight: 600 }}>{lead.name}</span>
                    <Badge className={stageColors[lead.stage]}>{lead.stage}</Badge>
                    <Badge className={priorityColors[lead.priority]}>{lead.priority}</Badge>
                    <Badge variant="secondary" className="text-xs">{lead.source}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{lead.company}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" />
                      {lead.phone}
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {lead.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {lead.lastActivity}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" className="gap-1 hidden sm:flex">
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 hidden sm:flex">
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </Button>
                  <Button variant="outline" size="sm">
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredLeads.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No leads match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
