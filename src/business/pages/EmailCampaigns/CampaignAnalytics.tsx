import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Download } from 'lucide-react';

interface AnalyticsData {
  name: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  bounced: number;
}

// Mock analytics data
const MOCK_ANALYTICS: AnalyticsData = {
  name: 'Welcome Series',
  sent: 1245,
  delivered: 1240,
  opened: 521,
  clicked: 99,
  unsubscribed: 12,
  bounced: 5,
};

// Chart data
const chartData = [
  { name: 'Day 1', sent: 520, opened: 180, clicked: 32 },
  { name: 'Day 2', sent: 380, opened: 145, clicked: 28 },
  { name: 'Day 3', sent: 245, opened: 98, clicked: 19 },
  { name: 'Day 4', opened: 98, clicked: 20 },
];

export const CampaignAnalytics: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const analytics = MOCK_ANALYTICS;

  const metrics = useMemo(() => {
    const deliveryRate = ((analytics.delivered / analytics.sent) * 100).toFixed(1);
    const openRate = ((analytics.opened / analytics.delivered) * 100).toFixed(1);
    const clickRate = ((analytics.clicked / analytics.opened) * 100).toFixed(1);
    const bounceRate = ((analytics.bounced / analytics.sent) * 100).toFixed(2);

    return { deliveryRate, openRate, clickRate, bounceRate };
  }, [analytics]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Campaign Analytics</h1>
              <p className="text-sm text-muted-foreground mt-1">{analytics.name}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/app/campaigns')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            { label: 'Sent', value: analytics.sent, color: 'text-blue-600' },
            { label: 'Delivered', value: `${metrics.deliveryRate}%`, subtitle: `${analytics.delivered} emails`, color: 'text-green-600' },
            { label: 'Opened', value: `${metrics.openRate}%`, subtitle: `${analytics.opened} opens`, color: 'text-purple-600' },
            { label: 'Clicked', value: `${metrics.clickRate}%`, subtitle: `${analytics.clicked} clicks`, color: 'text-amber-600' },
            { label: 'Bounced', value: `${metrics.bounceRate}%`, subtitle: `${analytics.bounced} emails`, color: 'text-red-600' },
            { label: 'Unsubscribed', value: analytics.unsubscribed, color: 'text-gray-600' },
          ].map((metric) => (
            <Card key={metric.label} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col gap-1">
                  <p className="m-0 text-xs text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className={`m-0 text-2xl font-bold ${metric.color}`}>
                    {metric.value}
                  </p>
                  {metric.subtitle && (
                    <p className="m-0 text-xs text-muted-foreground">
                      {metric.subtitle}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Over Time</CardTitle>
            <CardDescription>Daily open and click rates</CardDescription>
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
                  dataKey="sent"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Sent"
                />
                <Line
                  type="monotone"
                  dataKey="opened"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="Opened"
                />
                <Line
                  type="monotone"
                  dataKey="clicked"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Clicked"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel Visualization */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Lead progression through email steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Sent', value: analytics.sent, percent: 100 },
              { label: 'Delivered', value: analytics.delivered, percent: Math.round((analytics.delivered / analytics.sent) * 100) },
              { label: 'Opened', value: analytics.opened, percent: Math.round((analytics.opened / analytics.sent) * 100) },
              { label: 'Clicked', value: analytics.clicked, percent: Math.round((analytics.clicked / analytics.sent) * 100) },
            ].map((step) => (
              <div key={step.label} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-foreground">
                    {step.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {step.value} ({step.percent}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-600"
                    style={{ width: `${step.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalytics;
