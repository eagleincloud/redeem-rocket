import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/app/components/ui/button';
import { Switch } from '@/app/components/ui/switch';
import { Badge } from '@/app/components/ui/badge';
import FeatureRequestDialog from '@/business/pages/NewOnboarding/FeatureRequestDialog';
import { saveAppData, getAppData } from '@/business/utils/onboarding/appState';
import {
  Users, MessageSquare, Tag, Bot, BarChart2, Mail,
  Calendar, Zap, Shield, Lightbulb, Sparkles, Star,
  CreditCard, Package, Bell, Gift, Share2, HeadphonesIcon,
  MapPin, Layers, Store, ChevronDown, ChevronUp, Check,
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: any;
  iconColor: string;
  price: string;
  category: string;
  benefits: string[];
  recommendedFor?: string[];
}

const allFeatures: Feature[] = [
  {
    id: 'lead-management',
    name: 'Lead Management CRM',
    description: 'Capture, track and convert leads into customers',
    icon: Users, iconColor: '#3B82F6',
    price: '₹499/month',
    category: 'CRM',
    benefits: ['Lead pipeline board', 'Follow-up reminders', 'Lead scoring & tags', 'Contact history'],
    recommendedFor: ['Consulting', 'Real Estate', 'Education', 'Healthcare', 'Finance & Legal'],
  },
  {
    id: 'whatsapp-marketing',
    name: 'WhatsApp Marketing',
    description: 'Send personalised bulk campaigns via WhatsApp',
    icon: MessageSquare, iconColor: '#25D366',
    price: '₹699/month',
    category: 'Marketing',
    benefits: ['Bulk messaging', 'Template library', 'Delivery analytics', 'Auto replies'],
    recommendedFor: ['Retail', 'Restaurant', 'Salon & Spa', 'Fitness & Gym', 'E-commerce'],
  },
  {
    id: 'coupons-offers',
    name: 'Coupons & Offers',
    description: 'Create discount codes and track redemptions',
    icon: Tag, iconColor: '#F59E0B',
    price: '₹299/month',
    category: 'Marketing',
    benefits: ['QR code coupons', 'Redemption tracking', 'Expiry control', 'Bulk generation'],
    recommendedFor: ['Retail', 'Restaurant', 'E-commerce', 'Hospitality', 'Events'],
  },
  {
    id: 'loyalty-program',
    name: 'Loyalty Program',
    description: 'Reward repeat customers with points and perks',
    icon: Star, iconColor: '#EF4444',
    price: '₹399/month',
    category: 'Retention',
    benefits: ['Points system', 'Rewards catalogue', 'Tier levels (Gold, Silver)', 'Birthday rewards'],
    recommendedFor: ['Retail', 'Restaurant', 'Salon & Spa', 'Fitness & Gym', 'E-commerce'],
  },
  {
    id: 'ai-assistant',
    name: 'AI Business Assistant',
    description: 'Smart AI that suggests campaigns and predicts trends',
    icon: Bot, iconColor: '#8B5CF6',
    price: '₹999/month',
    category: 'AI & Automation',
    benefits: ['Campaign suggestions', 'Predictive analytics', 'Auto-generated content', 'Smart scheduling'],
    recommendedFor: ['Technology', 'E-commerce', 'Consulting', 'Real Estate'],
  },
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    description: 'Deep business insights with custom dashboards',
    icon: BarChart2, iconColor: '#06B6D4',
    price: '₹599/month',
    category: 'Analytics',
    benefits: ['Custom dashboards', 'Revenue tracking', 'Customer journey maps', 'CSV export'],
    recommendedFor: ['E-commerce', 'Technology', 'Consulting', 'Finance & Legal'],
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing',
    description: 'Design and send beautiful email campaigns',
    icon: Mail, iconColor: '#EC4899',
    price: '₹499/month',
    category: 'Marketing',
    benefits: ['Drag & drop builder', 'A/B testing', 'Automated sequences', 'Open rate tracking'],
    recommendedFor: ['E-commerce', 'Consulting', 'Education', 'Technology', 'Non-Profit'],
  },
  {
    id: 'appointment-booking',
    name: 'Appointment Booking',
    description: 'Let customers book slots online, 24/7',
    icon: Calendar, iconColor: '#10B981',
    price: '₹399/month',
    category: 'Operations',
    benefits: ['Online booking page', 'Google Calendar sync', 'Auto reminders', 'Staff management'],
    recommendedFor: ['Salon & Spa', 'Healthcare', 'Fitness & Gym', 'Consulting', 'Photography'],
  },
  {
    id: 'marketing-automation',
    name: 'Marketing Automation',
    description: 'Build automated workflows triggered by actions',
    icon: Zap, iconColor: '#F97316',
    price: '₹799/month',
    category: 'AI & Automation',
    benefits: ['Visual flow builder', 'Trigger-based actions', 'Multi-channel sequences', 'Re-engagement flows'],
    recommendedFor: ['E-commerce', 'Technology', 'Consulting', 'Education'],
  },
  {
    id: 'online-payments',
    name: 'Online Payments',
    description: 'Accept payments directly through the app',
    icon: CreditCard, iconColor: '#14B8A6',
    price: '₹699/month',
    category: 'Operations',
    benefits: ['UPI, cards, wallets', 'Invoice generation', 'Payment reminders', 'Refund management'],
    recommendedFor: ['Retail', 'E-commerce', 'Consulting', 'Healthcare', 'Events'],
  },
  {
    id: 'sms-marketing',
    name: 'SMS Campaigns',
    description: 'Reach customers with targeted SMS messages',
    icon: Bell, iconColor: '#6366F1',
    price: '₹349/month',
    category: 'Marketing',
    benefits: ['Bulk SMS', 'Personalisation tags', 'Opt-out management', 'Click tracking'],
    recommendedFor: ['Retail', 'Restaurant', 'Automotive', 'Healthcare'],
  },
  {
    id: 'referral-program',
    name: 'Referral Program',
    description: 'Turn customers into brand ambassadors',
    icon: Share2, iconColor: '#84CC16',
    price: '₹449/month',
    category: 'Retention',
    benefits: ['Unique referral links', 'Reward tracking', 'Social sharing', 'Leaderboard'],
    recommendedFor: ['E-commerce', 'Technology', 'Fitness & Gym', 'Education'],
  },
  {
    id: 'inventory-management',
    name: 'Inventory Management',
    description: 'Track stock levels and get low-stock alerts',
    icon: Package, iconColor: '#78716C',
    price: '₹549/month',
    category: 'Operations',
    benefits: ['Real-time stock tracking', 'Low-stock alerts', 'Barcode scanning', 'Supplier management'],
    recommendedFor: ['Retail', 'Restaurant', 'E-commerce', 'Automotive'],
  },
  {
    id: 'review-management',
    name: 'Review & Reputation',
    description: 'Collect, display and manage customer reviews',
    icon: Star, iconColor: '#FBBF24',
    price: '₹349/month',
    category: 'CRM',
    benefits: ['Review collection', 'Google review sync', 'Response templates', 'Rating widgets'],
    recommendedFor: ['Restaurant', 'Salon & Spa', 'Healthcare', 'Hospitality', 'Photography'],
  },
  {
    id: 'live-chat',
    name: 'Live Chat Support',
    description: 'Real-time chat widget for instant customer support',
    icon: HeadphonesIcon, iconColor: '#0EA5E9',
    price: '₹449/month',
    category: 'CRM',
    benefits: ['Website chat widget', 'Chatbot automation', 'Ticket routing', 'Canned responses'],
    recommendedFor: ['E-commerce', 'Technology', 'Consulting', 'Healthcare'],
  },
  {
    id: 'multi-location',
    name: 'Multi-Location',
    description: 'Manage multiple branches from one dashboard',
    icon: MapPin, iconColor: '#EF4444',
    price: '₹899/month',
    category: 'Operations',
    benefits: ['Branch management', 'Location analytics', 'Staff per location', 'Consolidated reports'],
    recommendedFor: ['Retail', 'Restaurant', 'Salon & Spa', 'Healthcare', 'Fitness & Gym'],
  },
  {
    id: 'push-notifications',
    name: 'Push Notifications',
    description: 'Send real-time push alerts to your app users',
    icon: Bell, iconColor: '#A855F7',
    price: '₹299/month',
    category: 'Marketing',
    benefits: ['Rich push notifications', 'Segmented sends', 'Scheduled alerts', 'Click analytics'],
    recommendedFor: ['E-commerce', 'Restaurant', 'Retail', 'Fitness & Gym'],
  },
  {
    id: 'gift-cards',
    name: 'Gift Cards & Vouchers',
    description: 'Sell and manage digital gift cards',
    icon: Gift, iconColor: '#F43F5E',
    price: '₹349/month',
    category: 'Retention',
    benefits: ['Digital gift cards', 'Balance tracking', 'Custom designs', 'Bulk gifting'],
    recommendedFor: ['Retail', 'Restaurant', 'Salon & Spa', 'Hospitality'],
  },
  {
    id: 'team-management',
    name: 'Team Management',
    description: 'Manage staff roles, permissions and tasks',
    icon: Layers, iconColor: '#64748B',
    price: '₹499/month',
    category: 'Operations',
    benefits: ['Role-based access', 'Task assignment', 'Attendance tracking', 'Performance metrics'],
    recommendedFor: ['Consulting', 'Healthcare', 'Real Estate', 'Education'],
  },
  {
    id: 'ecommerce-store',
    name: 'E-Commerce Store',
    description: 'Sell products with a full online store experience',
    icon: Store, iconColor: '#22C55E',
    price: '₹999/month',
    category: 'Operations',
    benefits: ['Product catalogue', 'Cart & checkout', 'Order management', 'Shipping integration'],
    recommendedFor: ['Retail', 'E-commerce', 'Hospitality', 'Photography'],
  },
  {
    id: 'data-security',
    name: 'Advanced Security',
    description: 'Enterprise-grade data protection and compliance',
    icon: Shield, iconColor: '#475569',
    price: '₹699/month',
    category: 'Operations',
    benefits: ['End-to-end encryption', 'GDPR compliance', '2FA authentication', 'Audit logs'],
    recommendedFor: ['Healthcare', 'Finance & Legal', 'Technology', 'Consulting'],
  },
];

const categoryTabs = ['All', 'CRM', 'Marketing', 'Analytics', 'Retention', 'AI & Automation', 'Operations'];

const bundles = [
  {
    id: 'starter',
    name: 'Starter Bundle',
    tagline: 'Perfect for new businesses',
    price: '₹1,299/month',
    savings: 'Save ₹498',
    features: ['lead-management', 'whatsapp-marketing', 'coupons-offers'],
    color: '#3B82F6',
    emoji: '🌱',
  },
  {
    id: 'growth',
    name: 'Growth Bundle',
    tagline: 'Accelerate your business',
    price: '₹2,799/month',
    savings: 'Save ₹1,496',
    features: ['lead-management', 'whatsapp-marketing', 'coupons-offers', 'loyalty-program', 'advanced-analytics', 'appointment-booking'],
    color: '#8B5CF6',
    emoji: '📈',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Bundle',
    tagline: 'Full power for scaling businesses',
    price: '₹5,499/month',
    savings: 'Save ₹3,292',
    features: ['lead-management', 'whatsapp-marketing', 'coupons-offers', 'loyalty-program', 'ai-assistant', 'advanced-analytics', 'email-marketing', 'appointment-booking', 'marketing-automation', 'online-payments'],
    color: '#10B981',
    emoji: '🚀',
  },
];

export default function FeatureSelection() {
  const navigate = useNavigate();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [expandedFeature, setExpandedFeature] = useState<string | null>(null);
  const [activeBundleId, setActiveBundleId] = useState<string | null>(null);
  const [businessCategory, setBusinessCategory] = useState('');

  useEffect(() => {
    const data = getAppData();
    setBusinessCategory(data.category || '');
    // Pre-select recommended features for the category
    const recommended = allFeatures
      .filter(f => !data.category || (f.recommendedFor && f.recommendedFor.includes(data.category)))
      .slice(0, 4)
      .map(f => f.id);
    setSelectedFeatures(recommended.length > 0 ? recommended : ['lead-management', 'whatsapp-marketing', 'coupons-offers']);
  }, []);

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId]
    );
    setActiveBundleId(null);
  };

  const applyBundle = (bundle: typeof bundles[0]) => {
    setSelectedFeatures([...bundle.features]);
    setActiveBundleId(bundle.id);
  };

  const displayFeatures = activeTab === 'All'
    ? allFeatures
    : allFeatures.filter(f => f.category === activeTab);

  const recommendedIds = allFeatures
    .filter(f => f.recommendedFor && f.recommendedFor.includes(businessCategory))
    .map(f => f.id);

  const totalCost = selectedFeatures.reduce((sum, id) => {
    const feature = allFeatures.find(f => f.id === id);
    if (!feature) return sum;
    const price = parseInt(feature.price.replace(/[^0-9]/g, ''));
    return sum + price;
  }, 0);

  const handleContinue = () => {
    saveAppData({ selectedFeatures });
    navigate('/register/customize');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-4 py-8 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-32 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-white mb-2" style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            Choose Your Features
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            {businessCategory
              ? `🎯 Showing recommendations for ${businessCategory} businesses`
              : '📦 Select the features that match your business needs'}
          </p>
        </div>

        {/* Bundles */}
        <div className="mb-12">
          <h3 className="text-white mb-4 font-bold text-lg">⚡ Quick Start Bundles</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {bundles.map(bundle => {
              const isActive = activeBundleId === bundle.id;
              return (
                <button
                  key={bundle.id}
                  onClick={() => applyBundle(bundle)}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all duration-300 hover:scale-105 ${
                    isActive
                      ? 'border-opacity-100 shadow-xl shadow-blue-500/20 bg-white/15 backdrop-blur-sm'
                      : 'border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {bundle.popular && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold shadow-lg">⭐ Most Popular</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <span style={{ fontSize: '1.6rem' }}>{bundle.emoji}</span>
                    <span className="text-white font-bold text-lg">{bundle.name}</span>
                  </div>
                  <p className="text-white/60 text-sm mb-4">{bundle.tagline}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-white font-bold text-lg" style={{ color: bundle.color }}>{bundle.price}</span>
                    <Badge className="text-xs bg-green-500/30 text-green-200 border-green-500/50">{bundle.savings}</Badge>
                  </div>
                  <p className="text-xs text-white/50">{bundle.features.length} features included</p>
                  {isActive && (
                    <div className="absolute top-4 right-4">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg" style={{ backgroundColor: bundle.color }}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Feature Selection */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
          {/* Category Tabs */}
          <div className="border-b border-white/10 px-8 pt-8">
            <h3 className="text-white mb-4 font-bold text-lg">🎯 Individual Features</h3>
            <div className="flex gap-2 flex-wrap pb-6">
              {categoryTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg shadow-blue-500/30'
                      : 'border-white/10 text-white/60 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-4">
              {displayFeatures.map(feature => {
                const Icon = feature.icon;
                const isSelected = selectedFeatures.includes(feature.id);
                const isRecommended = recommendedIds.includes(feature.id);
                const isExpanded = expandedFeature === feature.id;

                return (
                  <div
                    key={feature.id}
                    className={`rounded-xl border-2 transition-all duration-300 ${
                      isSelected
                        ? 'border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                          style={{
                            backgroundColor: isSelected ? feature.iconColor + '40' : feature.iconColor + '20',
                            boxShadow: isSelected ? `0 0 12px ${feature.iconColor}40` : 'none'
                          }}
                        >
                          <Icon className="w-6 h-6" style={{ color: feature.iconColor }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-white font-semibold text-sm">{feature.name}</span>
                            {isRecommended && businessCategory && (
                              <Badge className="text-xs px-2 py-0.5 bg-amber-500/30 text-amber-200 border-amber-500/50">
                                ⭐ Recommended
                              </Badge>
                            )}
                          </div>
                          <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{feature.description}</p>
                        </div>
                        <Switch
                          checked={isSelected}
                          onCheckedChange={() => toggleFeature(feature.id)}
                          className="flex-shrink-0"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm" style={{ fontWeight: 600, color: feature.iconColor }}>
                          {feature.price}
                        </span>
                        <button
                          onClick={() => setExpandedFeature(isExpanded ? null : feature.id)}
                          className="flex items-center gap-1 text-xs text-white/50 hover:text-white/80 transition-colors"
                        >
                          {isExpanded ? 'Hide details' : 'See details'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <div className="grid grid-cols-2 gap-1.5">
                            {feature.benefits.map((benefit, idx) => (
                              <div key={idx} className="flex items-center gap-1.5 text-xs text-white/70">
                                <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feature Request Banner */}
        <div className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Need a Custom Feature?</span>
                <Badge className="bg-yellow-400 text-yellow-900 border-0 text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />Popular
                </Badge>
              </div>
              <p className="text-white/80 text-sm">
                Don't see what you need? We build custom features tailored to your business.
              </p>
            </div>
            <FeatureRequestDialog />
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-4 mt-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 px-6 py-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-white" style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {selectedFeatures.length} features selected
                  </span>
                  <p className="text-white/70 text-sm">Total: ₹{totalCost.toLocaleString()}/month</p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleContinue}
              disabled={selectedFeatures.length === 0}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-5 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Customize App →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}