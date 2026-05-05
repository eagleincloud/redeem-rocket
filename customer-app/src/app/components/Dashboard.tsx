import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import FeatureRequestDialog from './FeatureRequestDialog';
import { getAppData } from '../utils/appState';
import { categoryData, getPresetById } from '../utils/categoryStyles';
import {
  Users, TrendingUp, DollarSign, MessageSquare, Settings,
  Plus, Send, Tag, BarChart2, Calendar, Lightbulb,
  Zap, Star, RefreshCw,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [appData, setAppData] = useState<any>(null);
  const [preset, setPreset] = useState<any>(null);

  useEffect(() => {
    const data = getAppData();
    setAppData(data);
    if (data.category && data.stylePresetId) {
      setPreset(getPresetById(data.category, data.stylePresetId));
    }
  }, []);

  const catInfo = appData?.category ? (categoryData[appData.category] ?? categoryData['Other']) : categoryData['Other'];
  const primaryColor = preset?.primary ?? '#3B82F6';
  const accentColor = preset?.accent ?? '#8B5CF6';
  const businessName = appData?.appName || appData?.businessName || 'My Business';

  const recentActivities = [
    { id: 1, type: 'lead', text: `New lead from ${catInfo.emoji} campaign`, time: '5 min ago', icon: Users, color: '#3B82F6' },
    { id: 2, type: 'campaign', text: 'WhatsApp campaign sent to 250 contacts', time: '1 hour ago', icon: Send, color: '#8B5CF6' },
    { id: 3, type: 'conversion', text: 'Lead converted — Sarah Johnson', time: '2 hours ago', icon: TrendingUp, color: '#10B981' },
    { id: 4, type: 'offer', text: 'New coupon redeemed — 20% off', time: '3 hours ago', icon: Tag, color: '#F59E0B' },
    { id: 5, type: 'lead', text: 'New lead: Mike Davis via Website', time: '4 hours ago', icon: Users, color: '#3B82F6' },
    { id: 6, type: 'review', text: '⭐ 5-star review received!', time: '5 hours ago', icon: Star, color: '#EF4444' },
  ];

  return (
    <div className="p-6 py-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div
        className="rounded-2xl p-6 mb-8 text-white relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
      >
        <div style={{ position: 'absolute', right: -20, top: -20, width: 150, height: 150, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', right: 80, bottom: -30, width: 100, height: 100, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div className="relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 style={{ fontWeight: 700, fontSize: '1.3rem', color: '#FFFFFF', marginBottom: '4px' }}>
                Welcome back! 👋
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Your {appData?.category || 'business'} app is live. Here&apos;s today&apos;s snapshot.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/dashboard/leads')}
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 14px' }}
                >
                  <span style={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 600 }}>📊 View Analytics</span>
                </button>
                <button
                  onClick={() => navigate('/dashboard/leads')}
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '8px', padding: '6px 14px' }}
                >
                  <span style={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 600 }}>🎯 Add Lead</span>
                </button>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              {preset && (
                <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 16px', backdropFilter: 'blur(10px)' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem', marginBottom: '2px' }}>Style</div>
                  <div style={{ color: '#FFFFFF', fontWeight: 700, fontSize: '0.9rem' }}>{preset.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}>{preset.mood}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Leads', value: '142', growth: '+12%', icon: Users, color: primaryColor },
          { label: 'Conversions', value: '23', growth: '+18%', icon: TrendingUp, color: '#10B981' },
          { label: 'Revenue', value: '₹1.24L', growth: '+24%', icon: DollarSign, color: accentColor },
          { label: 'Campaigns Sent', value: '18', growth: '+6%', icon: Send, color: '#F59E0B' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: stat.color + '18' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: stat.color }} />
                  </div>
                  <Badge className="bg-green-50 text-green-700 border-0 text-xs">{stat.growth}</Badge>
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1A1A1A' }}>{stat.value}</div>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Quick Actions */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle style={{ fontSize: '1rem' }}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Add New Lead', icon: Plus, color: primaryColor, path: '/dashboard/leads' },
                { label: 'Send Campaign', icon: Send, color: accentColor, path: '/dashboard/marketing' },
                { label: 'Create Offer', icon: Tag, color: '#F59E0B', path: '/dashboard/marketing' },
                { label: 'Schedule Post', icon: Calendar, color: '#10B981', path: '/dashboard/marketing' },
                { label: 'View Analytics', icon: BarChart2, color: '#6366F1', path: '/dashboard/leads' },
                { label: 'Automate Flow', icon: Zap, color: '#EC4899', path: '/dashboard/automation' },
              ].map((action, i) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={i}
                    className="h-16 flex flex-col gap-1.5 text-white border-0"
                    style={{ backgroundColor: action.color }}
                    onClick={() => navigate(action.path)}
                  >
                    <Icon className="w-4 h-4" />
                    <span style={{ fontSize: '0.75rem' }}>{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Feature Request */}
        <Card className="border-0 shadow-sm" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${accentColor}10)` }}>
          <CardContent className="p-6 flex flex-col items-center text-center justify-center h-full">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
            >
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-gray-900 mb-2" style={{ fontWeight: 700 }}>Need a Feature?</h3>
            <p className="text-sm text-gray-600 mb-4">
              Request custom features built specifically for your {appData?.category || 'business'}
            </p>
            <FeatureRequestDialog
              trigger={
                <Button
                  className="w-full text-white"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                >
                  Request Feature
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="mb-6 border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle style={{ fontSize: '1rem' }}>Recent Activities</CardTitle>
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-gray-500">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {recentActivities.map(activity => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: activity.color + '18' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: activity.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'CRM & Leads', icon: Users, path: '/dashboard/leads', color: primaryColor },
          { label: 'Marketing', icon: MessageSquare, path: '/dashboard/marketing', color: accentColor },
          { label: 'Automation', icon: Zap, path: '/dashboard/automation', color: '#F59E0B' },
          { label: 'Settings', icon: Settings, path: '/dashboard/settings', color: '#6B7280' },
        ].map(item => {
          const Icon = item.icon;
          return (
            <Button
              key={item.path}
              variant="outline"
              className="h-24 flex flex-col gap-2 border-2 hover:border-opacity-80 transition-all"
              style={{ borderColor: item.color + '40' }}
              onClick={() => navigate(item.path)}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: item.color + '18' }}>
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className="text-gray-700" style={{ fontSize: '0.85rem' }}>{item.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
