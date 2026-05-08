/**
 * Feature Marketplace Component (Work Stream 2)
 * 22 features in grid layout with toggle system, pricing, and bundle selection
 * Real-time cost calculation and feature recommendations
 */

import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import {
  Search,
  ChevronRight,
  Package,
  Megaphone,
  Heart,
  Zap,
  BarChart3,
  Settings,
  ArrowRight,
  Check,
  Info,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FEATURES_CATALOG,
  FeatureDefinition,
  FEATURE_CATEGORIES,
  FEATURE_BUNDLES,
  calculateBundlePrice,
  getFeaturesByBundle
} from '../lib/features-catalog';
import { useFeatures } from '../hooks/useFeatures';

type CategoryKey = 'crm' | 'marketing' | 'retention' | 'automation' | 'analytics' | 'operations' | 'all';

const CATEGORY_ICONS: Record<CategoryKey, React.ReactNode> = {
  all: <Package className="w-5 h-5" />,
  crm: <Package className="w-5 h-5" />,
  marketing: <Megaphone className="w-5 h-5" />,
  retention: <Heart className="w-5 h-5" />,
  automation: <Zap className="w-5 h-5" />,
  analytics: <BarChart3 className="w-5 h-5" />,
  operations: <Settings className="w-5 h-5" />
};

export default function FeatureMarketplace() {
  const { featurePreferences, toggleFeature, loading } = useFeatures();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [showBundles, setShowBundles] = useState(true);

  // Get all features as array
  const allFeatures = Object.values(FEATURES_CATALOG);

  // Filter features by search and category
  const filteredFeatures = useMemo(() => {
    return allFeatures.filter(feature => {
      const matchesSearch = !searchQuery ||
        feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  // Calculate total cost
  const totalCost = useMemo(() => {
    return Object.entries(featurePreferences)
      .filter(([_, enabled]) => enabled)
      .reduce((total, [key]) => {
        const feature = FEATURES_CATALOG[key];
        return total + (feature?.price || 0);
      }, 0);
  }, [featurePreferences]);

  // Get enabled features count
  const enabledCount = Object.values(featurePreferences).filter(Boolean).length;

  // Handle bundle selection
  const handleSelectBundle = (bundleKey: string) => {
    const bundle = FEATURE_BUNDLES[bundleKey as keyof typeof FEATURE_BUNDLES];
    if (!bundle) return;

    // Toggle all features in bundle
    bundle.features.forEach(featureId => {
      if (!featurePreferences[featureId]) {
        toggleFeature(featureId);
      }
    });

    setSelectedBundle(bundleKey);
    toast.success(`${bundle.name} selected! Features enabled.`);
  };

  // Handle feature toggle
  const handleToggleFeature = async (featureId: string) => {
    try {
      await toggleFeature(featureId);
      const newState = !featurePreferences[featureId];
      const feature = FEATURES_CATALOG[featureId];
      toast.success(
        `${feature?.name} ${newState ? 'enabled' : 'disabled'}`
      );
    } catch (error) {
      toast.error('Failed to toggle feature');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feature Marketplace</h1>
              <p className="text-gray-600 mt-2">
                Discover and enable the features your business needs
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Monthly Cost</p>
              <p className="text-3xl font-bold text-blue-600">
                ₹{totalCost.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {enabledCount} feature{enabledCount !== 1 ? 's' : ''} selected
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Total Features</p>
                <p className="text-2xl font-bold text-gray-900">{allFeatures.length}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Selected</p>
                <p className="text-2xl font-bold text-green-600">{enabledCount}</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">6</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Pre-built Bundles */}
        {showBundles && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-600" />
                Pre-built Bundles
              </h2>
              <Button
                variant="ghost"
                onClick={() => setShowBundles(false)}
                className="text-sm"
              >
                Hide bundles
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(FEATURE_BUNDLES).map(([key, bundle]) => (
                <Card
                  key={key}
                  className={`border-2 cursor-pointer transition-all ${
                    selectedBundle === key
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{bundle.name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{bundle.description}</p>
                      </div>
                      {selectedBundle === key && (
                        <Check className="w-6 h-6 text-green-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div>
                      <p className="text-sm text-gray-600">₹{bundle.price}/month</p>
                      <p className="text-xs text-green-600">Save ₹{bundle.savings}/month</p>
                    </div>

                    {/* Features Count */}
                    <p className="text-sm text-gray-700">
                      <strong>{bundle.features.length}</strong> features included
                    </p>

                    {/* Select Button */}
                    <Button
                      onClick={() => handleSelectBundle(key)}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      disabled={loading}
                    >
                      Select Bundle
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search features by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 flex-wrap">
            {['all', ...Object.keys(FEATURE_CATEGORIES)].map((cat) => (
              <Button
                key={cat}
                onClick={() => setSelectedCategory(cat as CategoryKey)}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
              >
                {CATEGORY_ICONS[cat as CategoryKey]}
                {cat === 'all' ? 'All Features' : FEATURE_CATEGORIES[cat as keyof typeof FEATURE_CATEGORIES].label.split(' ')[0]}
              </Button>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {selectedCategory === 'all' ? 'All Features' : FEATURE_CATEGORIES[selectedCategory].label}
            <span className="text-gray-600 text-lg ml-2">({filteredFeatures.length})</span>
          </h2>

          {filteredFeatures.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 text-center text-gray-500">
                No features found matching your search
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feature) => {
                const isEnabled = featurePreferences[feature.id];
                return (
                  <Card
                    key={feature.id}
                    className={`border-2 transition-all ${
                      isEnabled
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{feature.name}</CardTitle>
                          <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleToggleFeature(feature.id)}
                          disabled={loading}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Price Badge */}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          ₹{feature.price}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          /month
                        </Badge>
                      </div>

                      {/* Features List */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-600">Key features:</p>
                        <ul className="space-y-1">
                          {feature.features.slice(0, 3).map((f, i) => (
                            <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                              <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                          {feature.features.length > 3 && (
                            <li className="text-xs text-gray-500 italic">
                              +{feature.features.length - 3} more
                            </li>
                          )}
                        </ul>
                      </div>

                      {/* Setup Required Badge */}
                      {feature.setupRequired && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 flex items-start gap-2">
                          <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-yellow-800">Setup required during activation</p>
                        </div>
                      )}

                      {/* Enable Button */}
                      {!isEnabled && (
                        <Button
                          onClick={() => handleToggleFeature(feature.id)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          size="sm"
                          disabled={loading}
                        >
                          Enable Feature
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}

                      {isEnabled && (
                        <div className="bg-green-100 text-green-800 rounded p-2 text-center text-sm font-semibold">
                          ✓ Enabled
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary */}
        <Card className="mt-12 border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
                <p className="text-blue-100">
                  {enabledCount === 0
                    ? 'Select some features to begin'
                    : `${enabledCount} feature${enabledCount !== 1 ? 's' : ''} selected for ₹${totalCost}/month`}
                </p>
              </div>
              <Button
                className="bg-white text-blue-600 hover:bg-gray-100"
                disabled={enabledCount === 0}
              >
                Continue Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
