import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import {
  MessageSquare, Mail, Send, BarChart2, Plus,
  TrendingUp, Users, Eye, MousePointer,
} from 'lucide-react';

const campaigns = [
  {
    id: 1,
    name: 'Summer Sale 2026',
    channel: 'WhatsApp',
    sent: 250,
    delivered: 245,
    opened: 180,
    clicked: 45,
    status: 'Completed',
    date: 'Apr 28, 2026',
  },
  {
    id: 2,
    name: 'New Product Launch',
    channel: 'Email',
    sent: 500,
    delivered: 485,
    opened: 320,
    clicked: 96,
    status: 'Completed',
    date: 'Apr 20, 2026',
  },
  {
    id: 3,
    name: 'Weekend Special',
    channel: 'SMS',
    sent: 150,
    delivered: 150,
    opened: 0,
    clicked: 0,
    status: 'Scheduled',
    date: 'May 3, 2026',
  },
  {
    id: 4,
    name: 'Loyalty Rewards Push',
    channel: 'WhatsApp',
    sent: 320,
    delivered: 318,
    opened: 245,
    clicked: 88,
    status: 'Completed',
    date: 'Apr 10, 2026',
  },
];

const channelIcons: Record<string, JSX.Element> = {
  WhatsApp: <MessageSquare className="w-4 h-4" style={{ color: '#25D366' }} />,
  Email: <Mail className="w-4 h-4 text-blue-500" />,
  SMS: <Send className="w-4 h-4 text-purple-500" />,
};

export default function MarketingPage() {
  const [campaignName, setCampaignName] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [message, setMessage] = useState('');

  const handleSendCampaign = () => {
    if (!campaignName || !message) {
      toast.error('Please fill in campaign name and message');
      return;
    }
    toast.success('Campaign sent successfully!', {
      description: `${campaignName} is now being delivered via ${channel}`,
    });
    setCampaignName('');
    setMessage('');
  };

  return (
    <div className="p-6 py-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-gray-900" style={{ fontWeight: 700, fontSize: '1.3rem' }}>Marketing</h2>
          <p className="text-gray-500 text-sm mt-0.5">Campaigns, broadcasts & performance analytics</p>
        </div>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Campaigns', value: '12', icon: BarChart2, color: '#3B82F6' },
          { label: 'Total Sent', value: '2,450', icon: Send, color: '#8B5CF6' },
          { label: 'Avg Open Rate', value: '68.5%', icon: Eye, color: '#10B981' },
          { label: 'Avg Click Rate', value: '18.2%', icon: MousePointer, color: '#F59E0B' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: stat.color + '18' }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1A1A1A' }}>{stat.value}</div>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList className="mb-6 bg-white border border-gray-100 shadow-sm rounded-xl p-1">
          <TabsTrigger value="campaigns" className="rounded-lg">Campaigns</TabsTrigger>
          <TabsTrigger value="create" className="rounded-lg">Create Campaign</TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-lg">Analytics</TabsTrigger>
        </TabsList>

        {/* Campaigns List */}
        <TabsContent value="campaigns">
          <div className="space-y-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {channelIcons[campaign.channel]}
                        <h3 className="text-gray-900" style={{ fontWeight: 600 }}>{campaign.name}</h3>
                        <Badge
                          className={
                            campaign.status === 'Completed'
                              ? 'bg-green-100 text-green-700 border-0'
                              : 'bg-blue-100 text-blue-700 border-0'
                          }
                        >
                          {campaign.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400">{campaign.channel} • {campaign.date}</p>
                    </div>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'Sent', value: campaign.sent, icon: Send, color: '#6366F1' },
                      { label: 'Delivered', value: campaign.delivered, icon: Users, color: '#10B981' },
                      { label: 'Opened', value: campaign.opened, icon: Eye, color: '#3B82F6' },
                      { label: 'Clicked', value: campaign.clicked, icon: MousePointer, color: '#F59E0B' },
                    ].map((metric, i) => {
                      const Icon = metric.icon;
                      return (
                        <div key={i}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className="w-3 h-3" style={{ color: metric.color }} />
                            <p className="text-xs text-gray-500">{metric.label}</p>
                          </div>
                          <p style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1A1A1A' }}>{metric.value}</p>
                          {campaign.status === 'Completed' && metric.label !== 'Sent' && (
                            <p className="text-xs text-gray-400">
                              {Math.round((metric.value / campaign.sent) * 100)}%
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Create Campaign */}
        <TabsContent value="create">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle style={{ fontSize: '1rem' }}>Create New Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g., Spring Sale 2026"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="mt-2 h-11"
                />
              </div>

              <div>
                <Label>Channel</Label>
                <RadioGroup value={channel} onValueChange={setChannel} className="mt-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: '#25D366' },
                      { id: 'email', label: 'Email', icon: Mail, color: '#3B82F6' },
                      { id: 'sms', label: 'SMS', icon: Send, color: '#8B5CF6' },
                    ].map(ch => {
                      const Icon = ch.icon;
                      return (
                        <div
                          key={ch.id}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            channel === ch.id ? 'border-opacity-100 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          style={channel === ch.id ? { borderColor: ch.color, backgroundColor: ch.color + '08' } : {}}
                          onClick={() => setChannel(ch.id)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <RadioGroupItem value={ch.id} id={ch.id} />
                            <Icon className="w-4 h-4" style={{ color: ch.color }} />
                          </div>
                          <Label htmlFor={ch.id} className="cursor-pointer text-sm" style={{ fontWeight: 600 }}>
                            {ch.label}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="message">Message Template</Label>
                <Textarea
                  id="message"
                  placeholder="Enter your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2"
                  rows={5}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use {'{name}'}, {'{company}'} for personalization
                </p>
              </div>

              <div>
                <Label>Audience</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <Button variant="outline" className="gap-2 justify-start">
                    <Users className="w-4 h-4" /> Select from Leads
                  </Button>
                  <Button variant="outline" className="gap-2 justify-start">
                    <TrendingUp className="w-4 h-4" /> Upload CSV
                  </Button>
                </div>
              </div>

              <div>
                <Label>Schedule</Label>
                <RadioGroup defaultValue="now" className="mt-2 flex gap-6">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="now" id="now" />
                    <Label htmlFor="now" className="cursor-pointer">Send Now</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="later" id="later" />
                    <Label htmlFor="later" className="cursor-pointer">Schedule for Later</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button onClick={handleSendCampaign} className="w-full bg-blue-600 hover:bg-blue-700 gap-2">
                <Send className="w-4 h-4" />
                Send Campaign
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="space-y-5">
            {/* Chart placeholder */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle style={{ fontSize: '1rem' }}>Campaign Performance (Last 30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-40 mb-4">
                  {[40, 65, 45, 80, 60, 90, 75, 55, 70, 85, 65, 95, 78, 60].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md transition-all hover:opacity-80"
                      style={{
                        height: `${h}%`,
                        background: i % 3 === 0
                          ? 'linear-gradient(to top, #3B82F6, #8B5CF6)'
                          : '#E5E7EB',
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  {['Apr 15', 'Apr 18', 'Apr 21', 'Apr 24', 'Apr 27', 'Apr 30', 'May 1'].map(d => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Channel Breakdown */}
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { channel: 'WhatsApp', sent: 820, openRate: '73.2%', clickRate: '24.1%', color: '#25D366' },
                { channel: 'Email', sent: 1200, openRate: '64.5%', clickRate: '15.8%', color: '#3B82F6' },
                { channel: 'SMS', sent: 430, openRate: '—', clickRate: '9.3%', color: '#8B5CF6' },
              ].map(ch => (
                <Card key={ch.channel} className="border-0 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ch.channel}</span>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{ch.sent}</div>
                    <p className="text-xs text-gray-400 mb-3">messages sent</p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Open rate</span>
                        <span style={{ fontWeight: 600 }}>{ch.openRate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Click rate</span>
                        <span style={{ fontWeight: 600 }}>{ch.clickRate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
