/**
 * Category Comparison & Analytics Utilities
 * Provides utilities for comparing categories and generating insights
 */

import {
  allCategoryConfigs,
  CategoryOnboardingConfig,
  IntegrationConfig,
  MetricConfig,
  OnboardingQuestion,
} from '../config/category-onboarding-matrix';

/**
 * Create a comparison matrix of all categories
 * Useful for dashboard or admin tools
 */
export function createCategoryComparisonMatrix() {
  const categories = Object.values(allCategoryConfigs);

  return {
    categories: categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      description: cat.description,
      targetAudience: cat.targetAudience,
      averageSetupTime: cat.averageSetupTime,
    })),
    comparison: {
      setupTimes: categories.map(cat => ({
        category: cat.name,
        minutes: cat.averageSetupTime,
      })),
      questionCounts: categories.map(cat => ({
        category: cat.name,
        questions: cat.onboardingQuestions.length,
      })),
      coreFeatureCounts: categories.map(cat => ({
        category: cat.name,
        features: cat.coreFeatures.length,
      })),
      integrationCounts: categories.map(cat => ({
        category: cat.name,
        integrations: cat.recommendedIntegrations.length,
      })),
      metricCounts: categories.map(cat => ({
        category: cat.name,
        metrics: cat.keyMetrics.length,
      })),
    },
  };
}

/**
 * Get common integrations across multiple categories
 */
export function getCommonIntegrations(...categoryIds: string[]): string[] {
  if (categoryIds.length === 0) return [];

  const categoryConfigs = categoryIds.map(id => allCategoryConfigs[id]).filter(Boolean);

  if (categoryConfigs.length === 0) return [];

  // Get integrations from first category
  const firstIntegrations = new Set(
    categoryConfigs[0].recommendedIntegrations.map(i => i.name)
  );

  // Find common integrations across all categories
  return categoryIds.slice(1).reduce((common, categoryId) => {
    const config = allCategoryConfigs[categoryId];
    if (!config) return common;

    const categoryIntegrationNames = new Set(
      config.recommendedIntegrations.map(i => i.name)
    );

    return common.filter(name => categoryIntegrationNames.has(name));
  }, Array.from(firstIntegrations));
}

/**
 * Get all unique integrations across categories
 */
export function getAllUniqueIntegrations(): IntegrationConfig[] {
  const integrationMap = new Map<string, IntegrationConfig>();

  Object.values(allCategoryConfigs).forEach(category => {
    category.recommendedIntegrations.forEach(integration => {
      const key = `${integration.name}-${integration.category}`;
      if (!integrationMap.has(key)) {
        integrationMap.set(key, integration);
      }
    });
  });

  return Array.from(integrationMap.values());
}

/**
 * Get integrations by priority level
 */
export function getIntegrationsByPriority(
  categoryId: string,
  priority?: 'critical' | 'high' | 'medium' | 'low'
) {
  const config = allCategoryConfigs[categoryId];
  if (!config) return [];

  if (!priority) {
    return config.recommendedIntegrations;
  }

  return config.recommendedIntegrations.filter(i => i.priority === priority);
}

/**
 * Get integrations by setup complexity
 */
export function getIntegrationsByComplexity(
  categoryId: string,
  complexity?: 'simple' | 'moderate' | 'complex'
) {
  const config = allCategoryConfigs[categoryId];
  if (!config) return [];

  if (!complexity) {
    return config.recommendedIntegrations;
  }

  return config.recommendedIntegrations.filter(i => i.setupComplexity === complexity);
}

/**
 * Estimate total integration setup time for a category
 */
export function estimateTotalIntegrationTime(categoryId: string): number {
  const config = allCategoryConfigs[categoryId];
  if (!config) return 0;

  return config.recommendedIntegrations.reduce(
    (total, integration) => total + integration.estimatedSetupTime,
    0
  );
}

/**
 * Estimate total setup time (onboarding + critical integrations)
 */
export function estimateTotalSetupTime(categoryId: string): number {
  const config = allCategoryConfigs[categoryId];
  if (!config) return 0;

  const criticalIntegrations = config.recommendedIntegrations
    .filter(i => i.priority === 'critical')
    .reduce((total, i) => total + i.estimatedSetupTime, 0);

  return config.averageSetupTime + criticalIntegrations;
}

/**
 * Get all questions for a category
 */
export function getCategoryQuestions(categoryId: string): OnboardingQuestion[] {
  const config = allCategoryConfigs[categoryId];
  return config?.onboardingQuestions || [];
}

/**
 * Get questions of a specific type
 */
export function getQuestionsByType(
  categoryId: string,
  type: string
): OnboardingQuestion[] {
  const questions = getCategoryQuestions(categoryId);
  return questions.filter(q => q.type === type);
}

/**
 * Get category metrics
 */
export function getCategoryMetrics(categoryId: string): MetricConfig[] {
  const config = allCategoryConfigs[categoryId];
  return config?.keyMetrics || [];
}

/**
 * Get metrics by frequency
 */
export function getMetricsByFrequency(
  categoryId: string,
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
): MetricConfig[] {
  const metrics = getCategoryMetrics(categoryId);
  return metrics.filter(m => m.frequency === frequency);
}

/**
 * Create a metrics dashboard config from category
 */
export function createMetricsDashboardConfig(categoryId: string) {
  const config = allCategoryConfigs[categoryId];
  if (!config) return null;

  return {
    category: config.name,
    primaryMetrics: config.keyMetrics.slice(0, 3),
    secondaryMetrics: config.keyMetrics.slice(3),
    layout: config.sampleDashboardLayout,
  };
}

/**
 * Compare two categories
 */
export function compareCategories(categoryId1: string, categoryId2: string) {
  const config1 = allCategoryConfigs[categoryId1];
  const config2 = allCategoryConfigs[categoryId2];

  if (!config1 || !config2) return null;

  const commonIntegrations = getCommonIntegrations(categoryId1, categoryId2);
  const commonMetrics = config1.keyMetrics
    .filter(m1 => config2.keyMetrics.some(m2 => m2.name === m1.name))
    .map(m => m.name);

  return {
    category1: {
      name: config1.name,
      setupTime: config1.averageSetupTime,
      questionCount: config1.onboardingQuestions.length,
      integrationCount: config1.recommendedIntegrations.length,
      metricCount: config1.keyMetrics.length,
    },
    category2: {
      name: config2.name,
      setupTime: config2.averageSetupTime,
      questionCount: config2.onboardingQuestions.length,
      integrationCount: config2.recommendedIntegrations.length,
      metricCount: config2.keyMetrics.length,
    },
    commonality: {
      commonIntegrations,
      commonMetricCount: commonMetrics.length,
      setupTimeDifference: Math.abs(config1.averageSetupTime - config2.averageSetupTime),
    },
  };
}

/**
 * Find similar categories (same integrations, metrics, questions)
 */
export function findSimilarCategories(categoryId: string, limit: number = 3) {
  const config = allCategoryConfigs[categoryId];
  if (!config) return [];

  const categoryIds = Object.keys(allCategoryConfigs).filter(id => id !== categoryId);

  const similarities = categoryIds.map(otherId => {
    const comparison = compareCategories(categoryId, otherId);
    if (!comparison) return null;

    // Scoring: common integrations and metrics
    const score =
      comparison.commonality.commonIntegrations.length +
      comparison.commonality.commonMetricCount;

    return {
      categoryId: otherId,
      categoryName: allCategoryConfigs[otherId].name,
      similarityScore: score,
      commonIntegrations: comparison.commonality.commonIntegrations,
    };
  });

  return similarities
    .filter(Boolean)
    .sort((a, b) => (b?.similarityScore || 0) - (a?.similarityScore || 0))
    .slice(0, limit);
}

/**
 * Get stats for all categories
 */
export function getCategoryStats() {
  const categories = Object.values(allCategoryConfigs);

  const stats = {
    totalCategories: categories.length,
    totalQuestions: categories.reduce((sum, c) => sum + c.onboardingQuestions.length, 0),
    totalFeatures: categories.reduce((sum, c) => sum + c.coreFeatures.length, 0),
    totalIntegrations: categories.reduce(
      (sum, c) => sum + c.recommendedIntegrations.length,
      0
    ),
    totalMetrics: categories.reduce((sum, c) => sum + c.keyMetrics.length, 0),
    averageSetupTime:
      categories.reduce((sum, c) => sum + c.averageSetupTime, 0) / categories.length,
    quickestSetup: categories.reduce((min, c) =>
      c.averageSetupTime < min.averageSetupTime ? c : min
    ),
    longestSetup: categories.reduce((max, c) =>
      c.averageSetupTime > max.averageSetupTime ? c : max
    ),
    integrationBreakdown: {
      critical: categories.reduce(
        (sum, c) =>
          sum + c.recommendedIntegrations.filter(i => i.priority === 'critical').length,
        0
      ),
      high: categories.reduce(
        (sum, c) =>
          sum + c.recommendedIntegrations.filter(i => i.priority === 'high').length,
        0
      ),
      medium: categories.reduce(
        (sum, c) =>
          sum + c.recommendedIntegrations.filter(i => i.priority === 'medium').length,
        0
      ),
      low: categories.reduce(
        (sum, c) => sum + c.recommendedIntegrations.filter(i => i.priority === 'low').length,
        0
      ),
    },
    setupComplexityBreakdown: {
      simple: categories.reduce(
        (sum, c) =>
          sum +
          c.recommendedIntegrations.filter(i => i.setupComplexity === 'simple').length,
        0
      ),
      moderate: categories.reduce(
        (sum, c) =>
          sum +
          c.recommendedIntegrations.filter(i => i.setupComplexity === 'moderate').length,
        0
      ),
      complex: categories.reduce(
        (sum, c) =>
          sum +
          c.recommendedIntegrations.filter(i => i.setupComplexity === 'complex').length,
        0
      ),
    },
  };

  return stats;
}

/**
 * Generate a category overview report
 */
export function generateCategoryReport(categoryId: string) {
  const config = allCategoryConfigs[categoryId];
  if (!config) return null;

  const stats = getCategoryStats();
  const similarities = findSimilarCategories(categoryId);
  const totalSetupTime = estimateTotalSetupTime(categoryId);

  return {
    category: {
      id: config.id,
      name: config.name,
      icon: config.icon,
      description: config.description,
      targetAudience: config.targetAudience,
    },
    setup: {
      onboardingTime: config.averageSetupTime,
      criticalIntegrationTime: config.recommendedIntegrations
        .filter(i => i.priority === 'critical')
        .reduce((sum, i) => sum + i.estimatedSetupTime, 0),
      totalEstimatedTime: totalSetupTime,
      complexityDistribution: {
        simple: config.recommendedIntegrations.filter(i => i.setupComplexity === 'simple')
          .length,
        moderate: config.recommendedIntegrations.filter(
          i => i.setupComplexity === 'moderate'
        ).length,
        complex: config.recommendedIntegrations.filter(i => i.setupComplexity === 'complex')
          .length,
      },
    },
    content: {
      questionCount: config.onboardingQuestions.length,
      questionTypes: [...new Set(config.onboardingQuestions.map(q => q.type))],
      coreFeatures: config.coreFeatures,
      integrationCount: config.recommendedIntegrations.length,
      metricCount: config.keyMetrics.length,
    },
    insights: {
      similar: similarities,
      averageSetupTimeComparision: `${totalSetupTime} min vs ${Math.round(stats.averageSetupTime)} min average`,
      integrationComplexity: `${config.recommendedIntegrations.filter(i => i.setupComplexity === 'complex').length} complex integrations`,
    },
  };
}

/**
 * Create an implementation checklist for a category
 */
export function createImplementationChecklist(categoryId: string) {
  const config = allCategoryConfigs[categoryId];
  if (!config) return null;

  return {
    category: config.name,
    checklist: [
      {
        section: 'Onboarding Flow',
        items: [
          `Create ${config.onboardingQuestions.length} onboarding questions`,
          'Implement conditional question display',
          'Validate answers before proceeding',
          'Store answers in database',
        ],
      },
      {
        section: 'Feature Setup',
        items: [
          `Enable ${config.coreFeatures.length} core features: ${config.coreFeatures.join(', ')}`,
          'Configure feature permissions',
          'Set up default feature state',
          'Create feature tutorials',
        ],
      },
      {
        section: 'Integrations',
        items: [
          `Setup ${config.recommendedIntegrations.filter(i => i.priority === 'critical').length} critical integrations`,
          `Suggest ${config.recommendedIntegrations.filter(i => i.priority === 'high').length} high-priority integrations`,
          'Create integration guides',
          'Implement OAuth flows',
          'Build integration status monitoring',
        ],
      },
      {
        section: 'Dashboard',
        items: [
          `Create dashboard with ${config.sampleDashboardLayout.primaryWidgets.length} primary widgets`,
          `Add ${config.sampleDashboardLayout.secondaryWidgets.length} secondary widgets`,
          'Configure ${config.keyMetrics.length} key metrics',
          'Setup metric calculations',
          'Create metric visualizations',
        ],
      },
      {
        section: 'Guidance & Resources',
        items: [
          'Create first action guidance modal',
          `Add ${config.industrySpecificResources.length} industry resources`,
          'Create getting started guide',
          'Record video tutorials',
          'Setup email onboarding sequence',
        ],
      },
      {
        section: 'Testing',
        items: [
          'Test complete onboarding flow',
          'Verify feature enablement',
          'Test integration setup',
          'Validate dashboard display',
          'Test first action completion',
        ],
      },
    ],
  };
}

/**
 * Export category data as JSON for external use
 */
export function exportCategoryAsJSON(categoryId: string): string {
  const config = allCategoryConfigs[categoryId];
  if (!config) return '';

  return JSON.stringify(config, null, 2);
}

/**
 * Export all categories as JSON
 */
export function exportAllCategoriesAsJSON(): string {
  return JSON.stringify(allCategoryConfigs, null, 2);
}

/**
 * Create a simple category selector list
 */
export function createCategorySelector() {
  return Object.values(allCategoryConfigs).map(config => ({
    id: config.id,
    name: config.name,
    icon: config.icon,
    emoji: config.emoji,
    description: config.description,
    targetAudience: config.targetAudience,
    setupTime: config.averageSetupTime,
  }));
}

/**
 * Get category recommendations based on business description
 */
export function recommendCategories(description: string): string[] {
  const keywords: Record<string, string[]> = {
    restaurant: ['restaurant', 'cafe', 'food', 'kitchen', 'delivery', 'menu', 'order'],
    ecommerce: ['store', 'shop', 'product', 'sell', 'inventory', 'shipping', 'customer'],
    saas: ['software', 'app', 'subscription', 'cloud', 'digital', 'platform'],
    professional_services: ['law', 'accounting', 'consulting', 'services', 'client'],
    healthcare: ['clinic', 'salon', 'fitness', 'health', 'appointment', 'wellness'],
    education: ['school', 'course', 'training', 'student', 'coach', 'teach'],
    retail: ['store', 'shop', 'retail', 'sell', 'inventory', 'location'],
    manufacturing: ['manufacture', 'production', 'supply', 'b2b', 'order'],
    real_estate: ['property', 'real estate', 'listing', 'broker', 'agent'],
    automotive: ['car', 'auto', 'dealership', 'vehicle', 'service'],
  };

  const lowerDesc = description.toLowerCase();
  const scores: Record<string, number> = {};

  // Score each category based on keyword matches
  Object.entries(keywords).forEach(([categoryId, categoryKeywords]) => {
    scores[categoryId] = categoryKeywords.filter(keyword =>
      lowerDesc.includes(keyword)
    ).length;
  });

  // Return top 3 recommendations
  return Object.entries(scores)
    .filter(([_, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([categoryId]) => categoryId);
}
