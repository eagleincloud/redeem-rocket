/**
 * Feature Preferences Page
 * Allows business owners to customize which features are visible in their dashboard
 */

import { useState } from 'react';
import { useBusinessContext } from '../context/BusinessContext';
import { useFeaturePreferences, getDefaultPreferences } from '../hooks/useFeaturePreferences';
import { Check, X, RotateCcw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FeaturePreferences } from '../hooks/useFeaturePreferences';

// Feature definitions with descriptions and benefits
const FEATURE_CATALOG: Record<string, {
  label: string;
  icon: string;
  category: string;
  description: string;
  benefits: string[];
  recommendedFor: string[];
}> = {
  products: {
    label: 'Product Catalog',
    icon: '📦',
    category: 'Core',
    description: 'Manage and showcase your products/services with photos, descriptions, and pricing',
    benefits: [
      'Digital product showcase',
      'Inventory tracking',
      'Category management',
      'Pricing automation',
    ],
    recommendedFor: ['Restaurant', 'E-Commerce', 'Fashion', 'Grocery'],
  },
  orders: {
    label: 'Order Management',
    icon: '🛒',
    category: 'Core',
    description: 'Track customer orders, payments, and delivery status in real-time',
    benefits: [
      'Order tracking',
      'Payment integration',
      'Delivery status updates',
      'Order history',
    ],
    recommendedFor: ['Restaurant', 'E-Commerce', 'Grocery', 'Service'],
  },
  offers: {
    label: 'Offers & Promotions',
    icon: '🏷️',
    category: 'Core',
    description: 'Create coupons, discounts, and promotional campaigns',
    benefits: [
      'Discount creation',
      'Coupon management',
      'Promotion analytics',
      'Sales boost',
    ],
    recommendedFor: ['Restaurant', 'E-Commerce', 'Retail'],
  },
  leads: {
    label: 'Lead Management',
    icon: '👥',
    category: 'Sales',
    description: 'Track potential customers through your sales pipeline',
    benefits: [
      'Lead capture',
      'Pipeline tracking',
      'Conversion metrics',
      'Follow-up automation',
    ],
    recommendedFor: ['B2B', 'SaaS', 'Service', 'Real Estate'],
  },
  campaigns: {
    label: 'Email Campaigns',
    icon: '📧',
    category: 'Marketing',
    description: 'Send automated email sequences to engage and convert customers',
    benefits: [
      'Email sequences',
      'Automation triggers',
      'Open rate tracking',
      'Click analytics',
    ],
    recommendedFor: ['All businesses'],
  },
  automation: {
    label: 'Workflow Automation',
    icon: '🤖',
    category: 'Marketing',
    description: 'Create if-then rules to automate repetitive business tasks',
    benefits: [
      'Trigger-based workflows',
      'Conditional actions',
      'Time-saving automation',
      'Process optimization',
    ],
    recommendedFor: ['All businesses'],
  },
  social: {
    label: 'Social Media',
    icon: '📱',
    category: 'Marketing',
    description: 'Post to multiple social platforms and manage engagement',
    benefits: [
      'Multi-platform posting',
      'Scheduling capability',
      'Engagement tracking',
      'Social listening',
    ],
    recommendedFor: ['Fashion', 'Creative', 'Food', 'Retail'],
  },
  inventory: {
    label: 'Inventory Management',
    icon: '📦',
    category: 'Operations',
    description: 'Track stock levels, movements, and purchase orders',
    benefits: [
      'Stock level tracking',
      'Movement logs',
      'Purchase orders',
      'Low stock alerts',
    ],
    recommendedFor: ['E-Commerce', 'Retail', 'Wholesale', 'Manufacturing'],
  },
  finance: {
    label: 'Finance & Accounting',
    icon: '💰',
    category: 'Finance',
    description: 'Manage expenses, revenue, and financial reports',
    benefits: [
      'Expense tracking',
      'Income reporting',
      'Financial dashboards',
      'Tax reports',
    ],
    recommendedFor: ['All businesses'],
  },
};

export const FeaturePreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const { bizUser } = useBusinessContext();
  const { preferences, toggleFeature, getEnabledFeatures } = useFeaturePreferences(bizUser?.id);
  const [savedMessage, setSavedMessage] = useState('');

  const handleReset = () => {
    const defaults = getDefaultPreferences(bizUser?.business_type);
    Object.entries(defaults).forEach(([key, enabled]) => {
      toggleFeature(key, enabled);
    });
    setSavedMessage('Reset to default features for your business type!');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const groupedFeatures = Object.entries(FEATURE_CATALOG).reduce((acc, [key, feature]) => {
    if (!acc[feature.category]) acc[feature.category] = [];
    acc[feature.category].push({ key, ...feature });
    return acc;
  }, {} as Record<string, any[]>);

  const enabledCount = getEnabledFeatures().length;
  const totalCount = Object.keys(FEATURE_CATALOG).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-700 bg-slate-900/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center gap-4">
          <button
            onClick={() => navigate('/app')}
            className="p-2 hover:bg-slate-800 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Feature Preferences</h1>
            <p className="text-sm text-slate-400">
              Customize which features appear in your dashboard
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className="mb-8 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-200">Features Enabled</p>
              <p className="text-2xl font-bold">{enabledCount} of {totalCount}</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition font-medium"
            >
              <RotateCcw size={16} />
              Reset to Defaults
            </button>
          </div>
        </div>

        {/* Success Message */}
        {savedMessage && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 rounded-lg text-green-200">
            {savedMessage}
          </div>
        )}

        {/* Features by Category */}
        <div className="space-y-8">
          {Object.entries(groupedFeatures).map(([category, features]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold mb-4 text-slate-200">{category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map(({ key, label, icon, description, benefits, recommendedFor }) => {
                  const isEnabled = preferences[key] ?? false;

                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-lg border-2 transition cursor-pointer ${
                        isEnabled
                          ? 'bg-slate-700/50 border-green-500'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                      }`}
                      onClick={() => toggleFeature(key, !isEnabled)}
                    >
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="text-2xl">{icon}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{label}</h3>
                          <p className="text-sm text-slate-400">{description}</p>
                        </div>
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                            isEnabled
                              ? 'bg-green-500 border-green-500'
                              : 'border-slate-600'
                          }`}
                        >
                          {isEnabled && <Check size={14} className="text-white" />}
                        </div>
                      </div>

                      {/* Benefits */}
                      <div className="mb-3 pl-10">
                        <p className="text-xs text-slate-500 font-medium mb-2">Benefits:</p>
                        <ul className="text-xs text-slate-400 space-y-1">
                          {benefits.map((benefit, i) => (
                            <li key={i}>✓ {benefit}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended For */}
                      <div className="pl-10">
                        <p className="text-xs text-slate-500 font-medium mb-2">Recommended for:</p>
                        <div className="flex flex-wrap gap-1">
                          {recommendedFor.map((rec, i) => (
                            <span
                              key={i}
                              className="inline-block px-2 py-1 text-xs bg-slate-600/50 rounded text-slate-300"
                            >
                              {rec}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="mt-12 flex gap-4">
          <button
            onClick={() => navigate('/app')}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
