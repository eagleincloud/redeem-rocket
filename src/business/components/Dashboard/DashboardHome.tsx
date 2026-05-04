/**
 * Dashboard Home Component - Using Figma's shadcn/ui Design System
 * Main dashboard view with KPI cards, metrics charts, quick actions, and recent activity
 *
 * Uses proper Tailwind CSS classes and shadcn/ui components
 * Following the exact design from the Figma file
 *
 * @module components/Dashboard/DashboardHome
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  Send,
  Zap,
  Settings,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  MessageSquare,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Chart data for weekly performance
const chartData = [
  { name: 'Mon', leads: 45, conversions: 8 },
  { name: 'Tue', leads: 52, conversions: 9 },
  { name: 'Wed', leads: 38, conversions: 7 },
  { name: 'Thu', leads: 61, conversions: 12 },
  { name: 'Fri', leads: 55, conversions: 10 },
  { name: 'Sat', leads: 42, conversions: 8 },
  { name: 'Sun', leads: 35, conversions: 6 },
];

// Recent activities
const recentActivities = [
  {
    id: '1',
    title: 'New Lead: John Smith',
    description: 'Added from website form. Company: Tech Corp',
    time: '2h ago',
    icon: Users,
    color: '#3B82F6',
  },
  {
    id: '2',
    title: 'Deal Closed: $5,200',
    description: 'Contract signed with Acme Inc.',
    time: '5h ago',
    icon: TrendingUp,
    color: '#10B981',
  },
  {
    id: '3',
    title: 'Campaign Launched',
    description: 'Sent to 245 subscribers. 32 opens',
    time: '8h ago',
    icon: Send,
    color: '#8B5CF6',
  },
  {
    id: '4',
    title: 'Lead Status Changed',
    description: 'Sarah Johnson → Qualified',
    time: '1d ago',
    icon: RefreshCw,
    color: '#F59E0B',
  },
  {
    id: '5',
    title: 'Demo Call Scheduled',
    description: 'Meeting with Michael Brown tomorrow',
    time: '1d ago',
    icon: Users,
    color: '#EC4899',
  },
];

// Quick actions
const quickActions = [
  {
    label: 'Add Lead',
    description: 'Manually create a new lead',
    icon: Plus,
    color: '#3B82F6',
    route: '/app/leads/new',
  },
  {
    label: 'Email Campaign',
    description: 'Launch a new campaign',
    icon: Send,
    color: '#8B5CF6',
    route: '/app/campaigns/new',
  },
  {
    label: 'Automation',
    description: 'Set up workflow automation',
    icon: Zap,
    color: '#F97316',
    route: '/app/automation/rules/new',
  },
  {
    label: 'Settings',
    description: 'Configure your app',
    icon: Settings,
    color: '#10B981',
    route: '/app/settings',
  },
];

/**
 * Main dashboard home page using Figma's design system
 */
export const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Stats data
  const stats = [
    { label: 'Total Leads', value: '342', change: '+12%', trend: 'up', icon: Users },
    { label: 'Conversions', value: '89', change: '+8%', trend: 'up', icon: TrendingUp },
    { label: 'Revenue', value: '₹34.5L', change: '-3%', trend: 'down', icon: DollarSign },
    { label: 'Campaigns Sent', value: '18', change: '+6%', trend: 'up', icon: Send },
  ];

  const handleRefresh = async () => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your business overview.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const isPositive = stat.trend === 'up';
            return (
              <Card key={idx} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-secondary">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {isPositive ? (
                      <ArrowUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">from last week</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Charts and Actions Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Performance</CardTitle>
              <CardDescription>Leads and conversions trend</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Leads"
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Conversions"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={idx}
                    variant="outline"
                    className="w-full justify-start hover:bg-secondary"
                    onClick={() => navigate(action.route)}
                  >
                    <Icon className="w-4 h-4 mr-2" style={{ color: action.color }} />
                    <div className="text-left">
                      <div className="text-sm font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">{action.description}</div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from your business</CardDescription>
              </div>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div key={activity.id} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                    <div className="p-2 rounded-lg h-fit" style={{ backgroundColor: `${activity.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: activity.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{activity.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
