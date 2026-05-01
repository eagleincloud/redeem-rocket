/**
 * Enhanced Feature Selection - Beautiful Marketplace UI
 * Combines simple 5-question selection with advanced feature marketplace
 */

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Zap, Star, Lightbulb } from 'lucide-react';
import {
  Users, MessageSquare, Mail, Bot, BarChart2, Tag, Star as StarIcon,
  CreditCard, Package, Bell, Gift, Share2, MapPin, Layers, Store,
  Shield, HeadphonesIcon, Calendar
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  iconColor: string;
  category: 'core' | 'addon';
  benefits?: string[];
}

const allFeatures: Feature[] = [
  // Core 5 Features
  {
    id: 'products',
    name: 'Products & Services',
    description: 'Manage your product catalog with photos, descriptions, and pricing',
    icon: Package,
    iconColor: '#F59E0B',
    category: 'core',
    benefits: ['Product listings', 'Categories', 'Photos & descriptions', 'Pricing management'],
  },
  {
    id: 'leads',
    name: 'Lead Management',
    description: 'Capture, track and convert leads into customers',
    icon: Users,
    iconColor: '#3B82F6',
    category: 'core',
    benefits: ['Lead pipeline', 'Track prospects', 'Lead scoring', 'Contact history'],
  },
  {
    id: 'email',
    name: 'Email Campaigns',
    description: 'Send automated email sequences and newsletters',
    icon: Mail,
    iconColor: '#EC4899',
    category: 'core',
    benefits: ['Email builder', 'Auto sequences', 'Templates', 'Analytics'],
  },
  {
    id: 'automation',
    name: 'Workflow Automation',
    description: 'Create if-then rules that run automatically',
    icon: Bot,
    iconColor: '#8B5CF6',
    category: 'core',
    benefits: ['Trigger-based actions', 'Multi-channel', 'Auto workflows', 'Logs & monitoring'],
  },
  {
    id: 'social',
    name: 'Social Media Integration',
    description: 'Post across social platforms from one place',
    icon: MessageSquare,
    iconColor: '#06B6D4',
    category: 'core',
    benefits: ['Multi-platform posting', 'Scheduling', 'Analytics', 'Engagement tracking'],
  },
  // Premium Add-ons
  {
    id: 'whatsapp',
    name: 'WhatsApp Marketing',
    description: 'Send bulk campaigns via WhatsApp',
    icon: MessageSquare,
    iconColor: '#25D366',
    category: 'addon',
    benefits: ['Bulk messaging', 'Templates', 'Analytics', 'Auto replies'],
  },
  {
    id: 'loyalty',
    name: 'Loyalty Program',
    description: 'Reward repeat customers with points',
    icon: StarIcon,
    iconColor: '#EF4444',
    category: 'addon',
    benefits: ['Points system', 'Rewards catalog', 'Tier levels', 'Birthday rewards'],
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    description: 'Deep business insights with custom dashboards',
    icon: BarChart2,
    iconColor: '#10B981',
    category: 'addon',
    benefits: ['Custom dashboards', 'Revenue tracking', 'Customer journey', 'CSV export'],
  },
  {
    id: 'payments',
    name: 'Online Payments',
    description: 'Accept payments directly through the app',
    icon: CreditCard,
    iconColor: '#14B8A6',
    category: 'addon',
    benefits: ['UPI, cards, wallets', 'Invoicing', 'Reminders', 'Refund management'],
  },
  {
    id: 'appointments',
    name: 'Appointment Booking',
    description: 'Let customers book slots online',
    icon: Calendar,
    iconColor: '#10B981',
    category: 'addon',
    benefits: ['Online booking', 'Calendar sync', 'Auto reminders', 'Staff management'],
  },
  {
    id: 'support',
    name: 'Live Chat Support',
    description: 'Real-time chat for customer support',
    icon: HeadphonesIcon,
    iconColor: '#0EA5E9',
    category: 'addon',
    benefits: ['Chat widget', 'Chatbot', 'Ticket routing', 'Canned responses'],
  },
];

const bundles = [
  {
    id: 'starter',
    name: 'Starter',
    emoji: '🌱',
    description: 'Perfect for new businesses',
    features: ['products', 'leads', 'email'],
    color: '#3B82F6',
  },
  {
    id: 'growth',
    name: 'Growth',
    emoji: '📈',
    description: 'Accelerate your business',
    features: ['products', 'leads', 'email', 'automation', 'social', 'loyalty'],
    color: '#8B5CF6',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    emoji: '🚀',
    description: 'Full power for scaling',
    features: ['products', 'leads', 'email', 'automation', 'social', 'loyalty', 'analytics', 'payments', 'support'],
    color: '#10B981',
  },
];

interface EnhancedFeatureSelectionProps {
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
}

export function EnhancedFeatureSelection({ selectedFeatures, onFeaturesChange }: EnhancedFeatureSelectionProps) {
  const [expandedFeatures, setExpandedFeatures] = useState<string[]>([]);
  const [activeBundleId, setActiveBundleId] = useState<string | null>(null);

  const toggleFeature = (featureId: string) => {
    const newFeatures = selectedFeatures.includes(featureId)
      ? selectedFeatures.filter(id => id !== featureId)
      : [...selectedFeatures, featureId];
    onFeaturesChange(newFeatures);
    setActiveBundleId(null);
  };

  const applyBundle = (bundleFeatures: string[]) => {
    onFeaturesChange(bundleFeatures);
  };

  const toggleExpanded = (featureId: string) => {
    setExpandedFeatures(prev =>
      prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId]
    );
  };

  const coreFeatures = allFeatures.filter(f => f.category === 'core');
  const addonFeatures = allFeatures.filter(f => f.category === 'addon');

  return (
    <div className="space-y-6">
      {/* Quick Start Bundles */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Quick Start Bundles
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {bundles.map(bundle => {
            const isSelected = bundle.features.every(f => selectedFeatures.includes(f));
            return (
              <button
                key={bundle.id}
                onClick={() => applyBundle(bundle.features)}
                className={`relative p-4 rounded-2xl border-2 transition-all text-left ${
                  isSelected ? 'border-opacity-100 shadow-lg' : 'border-white/20 hover:border-white/30'
                }`}
                style={{
                  backgroundColor: isSelected ? `${bundle.color}15` : 'rgba(255,255,255,0.05)',
                  borderColor: isSelected ? bundle.color : 'rgba(255,255,255,0.2)',
                }}
              >
                {bundle.popular && (
                  <div className="absolute -top-2 left-4 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{bundle.emoji}</span>
                  <span className="font-semibold text-white">{bundle.name}</span>
                </div>
                <p className="text-white/60 text-sm mb-2">{bundle.description}</p>
                <p className="text-xs text-white/50">{bundle.features.length} features</p>
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: bundle.color }}>
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Core Features */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-400" />
          Essential Features
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {coreFeatures.map(feature => {
            const Icon = feature.icon;
            const isSelected = selectedFeatures.includes(feature.id);
            const isExpanded = expandedFeatures.includes(feature.id);

            return (
              <div
                key={feature.id}
                className={`rounded-xl border-2 transition-all p-4 cursor-pointer ${
                  isSelected ? 'border-white/40' : 'border-white/20 hover:border-white/30'
                }`}
                style={{ backgroundColor: isSelected ? `${feature.iconColor}15` : 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.iconColor}30` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <h4 className="text-white font-semibold text-sm">{feature.name}</h4>
                      <button
                        onClick={() => toggleFeature(feature.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isSelected ? 'bg-white' : 'border-white/30 hover:border-white/50'
                        }`}
                        style={{ borderColor: isSelected ? feature.iconColor : undefined, backgroundColor: isSelected ? feature.iconColor : undefined }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </div>
                    <p className="text-white/60 text-xs mt-1">{feature.description}</p>
                  </div>
                </div>

                {isExpanded && feature.benefits && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-white/70">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {feature.benefits && (
                  <button
                    onClick={() => toggleExpanded(feature.id)}
                    className="mt-2 text-xs text-white/50 hover:text-white/70 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>Hide details <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>See details <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Premium Add-ons */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-400" />
          Premium Add-ons
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {addonFeatures.map(feature => {
            const Icon = feature.icon;
            const isSelected = selectedFeatures.includes(feature.id);
            const isExpanded = expandedFeatures.includes(feature.id);

            return (
              <div
                key={feature.id}
                className={`rounded-xl border-2 transition-all p-4 cursor-pointer ${
                  isSelected ? 'border-white/40' : 'border-white/20 hover:border-white/30'
                }`}
                style={{ backgroundColor: isSelected ? `${feature.iconColor}15` : 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${feature.iconColor}30` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: feature.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <h4 className="text-white font-semibold text-sm">{feature.name}</h4>
                      <button
                        onClick={() => toggleFeature(feature.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isSelected ? 'bg-white' : 'border-white/30 hover:border-white/50'
                        }`}
                        style={{ borderColor: isSelected ? feature.iconColor : undefined, backgroundColor: isSelected ? feature.iconColor : undefined }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </div>
                    <p className="text-white/60 text-xs mt-1">{feature.description}</p>
                  </div>
                </div>

                {isExpanded && feature.benefits && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <ul className="space-y-1">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-xs text-white/70">
                          <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {feature.benefits && (
                  <button
                    onClick={() => toggleExpanded(feature.id)}
                    className="mt-2 text-xs text-white/50 hover:text-white/70 flex items-center gap-1"
                  >
                    {isExpanded ? (
                      <>Hide details <ChevronUp className="w-3 h-3" /></>
                    ) : (
                      <>See details <ChevronDown className="w-3 h-3" /></>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection Summary */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-semibold">{selectedFeatures.length} features selected</p>
            <p className="text-white/60 text-sm">Core + Premium features for your business</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{selectedFeatures.length}</p>
            <p className="text-white/60 text-xs">features</p>
          </div>
        </div>
      </div>
    </div>
  );
}
