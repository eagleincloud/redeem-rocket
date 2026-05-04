import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Mail, Users, CreditCard, Link2, Trash2 } from 'lucide-react';

interface TabContent {
  id: 'business' | 'team' | 'integrations' | 'billing';
  label: string;
  icon: React.ReactNode;
}

const TABS: TabContent[] = [
  { id: 'business', label: 'Business Info', icon: <span>📋</span> },
  { id: 'team', label: 'Team Members', icon: <Users style={{ width: 'var(--space-4)', height: 'var(--space-4)' }} /> },
  { id: 'integrations', label: 'Integrations', icon: <Link2 style={{ width: 'var(--space-4)', height: 'var(--space-4)' }} /> },
  { id: 'billing', label: 'Billing', icon: <CreditCard style={{ width: 'var(--space-4)', height: 'var(--space-4)' }} /> },
];

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'team_member';
  joinedAt: string;
}

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected';
  icon: string;
  description: string;
}

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'business' | 'team' | 'integrations' | 'billing'>(
    'business'
  );

  // Business Info State
  const [businessName, setBusinessName] = useState('Acme Corp');
  const [businessEmail, setBusinessEmail] = useState('admin@acmecorp.com');
  const [businessPhone, setBusinessPhone] = useState('+1 (555) 123-4567');
  const [businessWebsite, setBusinessWebsite] = useState('https://acmecorp.com');
  const [timeZone, setTimeZone] = useState('America/New_York');
  const [businessDirty, setBusinessDirty] = useState(false);

  // Team Members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah@acmecorp.com',
      role: 'owner',
      joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Mike Davis',
      email: 'mike@acmecorp.com',
      role: 'manager',
      joinedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'Emma Wilson',
      email: 'emma@acmecorp.com',
      role: 'team_member',
      joinedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]);

  const [newTeamEmail, setNewTeamEmail] = useState('');
  const [newTeamRole, setNewTeamRole] = useState<'manager' | 'team_member'>('team_member');

  // Integrations
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'Gmail',
      type: 'email',
      status: 'connected',
      icon: '📧',
      description: 'Send and track emails',
    },
    {
      id: '2',
      name: 'Slack',
      type: 'messaging',
      status: 'disconnected',
      icon: '💬',
      description: 'Get notifications in Slack',
    },
    {
      id: '3',
      name: 'Zapier',
      type: 'automation',
      status: 'connected',
      icon: '⚙️',
      description: 'Connect to 1000+ apps',
    },
    {
      id: '4',
      name: 'Stripe',
      type: 'payment',
      status: 'connected',
      icon: '💳',
      description: 'Accept payments',
    },
  ]);

  const relativeTime = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const d = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    if (d < 7) return `${d} days ago`;
    if (d < 30) return `${Math.floor(d / 7)} weeks ago`;
    return `${Math.floor(d / 30)} months ago`;
  };

  const handleSaveBusinessInfo = () => {
    // In real app, would call API to save
    console.log({
      businessName,
      businessEmail,
      businessPhone,
      businessWebsite,
      timeZone,
    });
    setBusinessDirty(false);
  };

  const handleAddTeamMember = () => {
    if (newTeamEmail.trim()) {
      // In real app, would call API to invite
      console.log('Invite team member:', newTeamEmail, newTeamRole);
      setNewTeamEmail('');
      setNewTeamRole('team_member');
    }
  };

  const handleRemoveTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter((member) => member.id !== id));
  };

  const handleToggleIntegration = (id: string) => {
    setIntegrations(
      integrations.map((integration) =>
        integration.id === id
          ? {
              ...integration,
              status: integration.status === 'connected' ? 'disconnected' : 'connected',
            }
          : integration
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your business account and preferences</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/app/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'text-foreground border-b-primary'
                  : 'text-muted-foreground border-b-transparent hover:text-foreground'
              }`}
            >
              {typeof tab.icon === 'string' ? tab.icon : tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Business Info Tab */}
        {activeTab === 'business' && (
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>Update your business details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    setBusinessDirty(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => {
                    setBusinessEmail(e.target.value);
                    setBusinessDirty(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessPhone">Business Phone</Label>
                <Input
                  id="businessPhone"
                  value={businessPhone}
                  onChange={(e) => {
                    setBusinessPhone(e.target.value);
                    setBusinessDirty(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={businessWebsite}
                  onChange={(e) => {
                    setBusinessWebsite(e.target.value);
                    setBusinessDirty(true);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Time Zone</Label>
                <Select value={timeZone} onValueChange={(value) => {
                  setTimeZone(value);
                  setBusinessDirty(true);
                }}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT)</SelectItem>
                    <SelectItem value="Europe/Paris">Central European Time</SelectItem>
                    <SelectItem value="Asia/Tokyo">Japan Standard Time</SelectItem>
                    <SelectItem value="Australia/Sydney">Australian Eastern Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBusinessDirty(false);
                  }}
                  disabled={!businessDirty}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveBusinessInfo}
                  disabled={!businessDirty}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members Tab */}
        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* Invite New Member */}
            <Card>
              <CardHeader>
                <CardTitle>Add Team Member</CardTitle>
                <CardDescription>Invite someone to your team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="teamEmail">Email Address</Label>
                  <Input
                    id="teamEmail"
                    type="email"
                    placeholder="team@company.com"
                    value={newTeamEmail}
                    onChange={(e) => setNewTeamEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamRole">Role</Label>
                  <Select value={newTeamRole} onValueChange={(value) => setNewTeamRole(value as 'manager' | 'team_member')}>
                    <SelectTrigger id="teamRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team_member">Team Member (Can view and edit)</SelectItem>
                      <SelectItem value="manager">Manager (Full access except billing)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={handleAddTeamMember}>
                    Send Invite
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Team Members List */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>{teamMembers.length} members</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 rounded-lg bg-secondary border border-border flex justify-between items-start"
                  >
                    <div>
                      <p className="m-0 text-sm font-semibold text-foreground">
                        {member.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {member.email}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {member.role === 'owner' ? 'Owner' : member.role === 'manager' ? 'Manager' : 'Team Member'} • Joined {relativeTime(member.joinedAt)}
                      </p>
                    </div>

                    {member.role !== 'owner' && (
                      <button
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="p-1 text-red-600 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Integrations Tab */}
        {activeTab === 'integrations' && (
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect third-party services to Redeem Rocket</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="p-4 rounded-lg bg-secondary border border-border flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {integration.icon}
                    </span>
                    <div>
                      <p className="m-0 text-sm font-semibold text-foreground">
                        {integration.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {integration.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        integration.status === 'connected'
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-slate-500/10 text-slate-600'
                      }`}
                    >
                      {integration.status === 'connected' ? '✓ Connected' : 'Not Connected'}
                    </div>

                    <Button
                      variant={integration.status === 'connected' ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleToggleIntegration(integration.id)}
                    >
                      {integration.status === 'connected' ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>Manage your subscription</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Current Plan */}
              <div className="p-6 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="m-0 text-sm text-muted-foreground">
                      Current Plan
                    </p>
                    <p className="mt-2 text-2xl font-bold text-blue-600">
                      Professional
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      $99/month • Unlimited leads, campaigns, and team members
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change Plan
                  </Button>
                </div>
              </div>

              {/* Billing History */}
              <div>
                <h3 className="m-0 text-sm font-semibold text-foreground mb-4">
                  Billing History
                </h3>

                <div className="space-y-3">
                  {[
                    { date: 'May 1, 2026', amount: '$99.00', status: 'Paid' },
                    { date: 'April 1, 2026', amount: '$99.00', status: 'Paid' },
                    { date: 'March 1, 2026', amount: '$99.00', status: 'Paid' },
                  ].map((invoice, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-md bg-secondary border border-border flex justify-between items-center"
                    >
                      <p className="m-0 text-sm text-foreground">
                        {invoice.date}
                      </p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-foreground">
                          {invoice.amount}
                        </span>
                        <span className="text-xs font-semibold text-green-600">
                          {invoice.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
