/**
 * DynamicNavigation Component
 * Shows sidebar navigation based on selected features during onboarding
 * Allows adding/removing features with creative UI
 */

import { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  featureKey: string;
  category: string;
}

interface DynamicNavigationProps {
  selectedFeatures: string[];
  onToggleFeature: (featureKey: string, enabled: boolean) => void;
  children?: React.ReactNode;
}

// Feature definition with icons and categories
export const AVAILABLE_FEATURES: Record<string, { label: string; icon: LucideIcon; category: string; description: string }> = {
  products: {
    label: 'Products',
    icon: require('lucide-react').Package,
    category: 'Core',
    description: 'Manage your product catalog'
  },
  orders: {
    label: 'Orders',
    icon: require('lucide-react').ShoppingBag,
    category: 'Core',
    description: 'Track customer orders'
  },
  offers: {
    label: 'Offers & Promotions',
    icon: require('lucide-react').Tag,
    category: 'Core',
    description: 'Create discounts and coupons'
  },
  leads: {
    label: 'Lead Management',
    icon: require('lucide-react').UserCheck,
    category: 'Sales',
    description: 'Track potential customers'
  },
  campaigns: {
    label: 'Email Campaigns',
    icon: require('lucide-react').Mail,
    category: 'Marketing',
    description: 'Send automated email sequences'
  },
  automation: {
    label: 'Workflow Automation',
    icon: require('lucide-react').Workflow,
    category: 'Marketing',
    description: 'Create if-then automation rules'
  },
  social: {
    label: 'Social Media',
    icon: require('lucide-react').Share2,
    category: 'Marketing',
    description: 'Post across social platforms'
  },
  inventory: {
    label: 'Inventory Management',
    icon: require('lucide-react').Boxes,
    category: 'Operations',
    description: 'Track stock and movements'
  },
  finance: {
    label: 'Finance & Accounting',
    icon: require('lucide-react').DollarSign,
    category: 'Finance',
    description: 'Manage expenses and reports'
  },
};

export const DynamicNavigation: React.FC<DynamicNavigationProps> = ({
  selectedFeatures,
  onToggleFeature,
}) => {
  const [showAddFeatures, setShowAddFeatures] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Core');

  const availableToAdd = Object.keys(AVAILABLE_FEATURES).filter(
    key => !selectedFeatures.includes(key)
  );

  const categoryGroups = selectedFeatures.reduce((acc, featureKey) => {
    const feature = AVAILABLE_FEATURES[featureKey];
    if (!feature) return acc;

    const category = feature.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ featureKey, ...feature });
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div>
      {/* Selected Features */}
      <div className="p-4 space-y-3">
        {Object.entries(categoryGroups).map(([category, features]) => (
          <div key={category}>
            <button
              onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-gray-400 hover:text-gray-300 transition"
            >
              <ChevronDown
                size={16}
                style={{
                  transform: expandedCategory === category ? 'rotate(0deg)' : 'rotate(-90deg)',
                  transition: 'transform 0.2s'
                }}
              />
              {category}
            </button>

            {expandedCategory === category && (
              <div className="ml-2 space-y-1">
                {features.map(({ featureKey, label, icon: IconComponent }) => (
                  <div
                    key={featureKey}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition group"
                  >
                    <IconComponent size={16} className="text-blue-400" />
                    <span className="flex-1 text-sm text-gray-300">{label}</span>
                    <button
                      onClick={() => onToggleFeature(featureKey, false)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/30 rounded transition"
                      title="Remove feature"
                    >
                      <X size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Features Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={() => setShowAddFeatures(!showAddFeatures)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium text-sm"
        >
          <Plus size={16} />
          Add Features
        </button>

        {/* Feature Picker */}
        {showAddFeatures && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Available Features</h3>

            {availableToAdd.length === 0 ? (
              <p className="text-xs text-gray-500">All features already enabled!</p>
            ) : (
              <div className="grid gap-2">
                {availableToAdd.map(featureKey => {
                  const feature = AVAILABLE_FEATURES[featureKey];
                  const IconComponent = feature.icon;

                  return (
                    <button
                      key={featureKey}
                      onClick={() => {
                        onToggleFeature(featureKey, true);
                        // Auto-hide if last feature added
                        if (availableToAdd.length === 1) {
                          setShowAddFeatures(false);
                        }
                      }}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-700 transition text-left"
                    >
                      <IconComponent size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-200">{feature.label}</div>
                        <div className="text-xs text-gray-500">{feature.description}</div>
                      </div>
                      <Plus size={16} className="text-green-400 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
