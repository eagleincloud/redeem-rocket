# Phase 4: Actionable Dashboard - Quick Start Guide

## 5-Minute Setup

### 1. Database Migration
```bash
# Apply migration
supabase migration up 20260425_actionable_dashboard

# Verify
supabase migration test 20260425_actionable_dashboard
```

### 2. Environment Setup
```bash
# Add to .env.local
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

### 3. Import Types
```typescript
import type {
  Metric, Insight, Recommendation, Anomaly,
  DashboardState, InsightType, Priority
} from '@/business/types/dashboard';
```

### 4. Use Hooks in Component
```typescript
import { useDashboardState } from '@/business/hooks/useDashboard';

export function MyDashboard() {
  const { data, isLoading, error } = useDashboardState(businessId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Pipeline Value: ${data?.kpiSummary.totalPipelineValue}</h1>
      <h2>Insights: {data?.recentInsights.length}</h2>
      {/* Render insights */}
    </div>
  );
}
```

---

## Common Tasks

### Display KPI Card
```typescript
import { DashboardHome } from '@/business/components/Dashboard';

<DashboardHome
  businessId="biz-123"
  onNavigate={(section) => navigate(`/dashboard/${section}`)}
/>
```

### Show Insights
```typescript
import { InsightPanel } from '@/business/components/Dashboard';

<InsightPanel businessId="biz-123" />
```

### Calculate Metrics
```typescript
import { getMetricsEngine } from '@/business/services/dashboard/metrics-engine';

const engine = getMetricsEngine();
const conversionRate = await engine.calculateConversionRate({
  businessId: 'biz-123',
  periodDays: 30,
});

console.log(`Conversion: ${conversionRate.currentValue}%`);
```

### Generate Insights with AI
```typescript
import { getAIInsightsService } from '@/business/services/dashboard/ai-insights';

const aiService = getAIInsightsService(process.env.ANTHROPIC_API_KEY);
const insight = await aiService.generateInsight(
  { metrics: [metric1, metric2] },
  { businessId: 'biz-123' }
);

console.log(`Insight: ${insight?.title}`);
```

### Detect Anomalies
```typescript
const timeseries = [
  { date: new Date('2026-01-01'), value: 100 },
  { date: new Date('2026-02-01'), value: 110 },
  { date: new Date('2026-03-01'), value: 105 },
  { date: new Date('2026-04-01'), value: 200 }, // Spike!
];

const anomalies = await aiService.detectAnomalies(
  timeseries,
  105, // baseline
  2.0  // std devs threshold
);

anomalies.forEach(a => console.log(`Anomaly: ${a.description}`));
```

### Subscribe to Real-time Updates
```typescript
import { useMetricSubscription } from '@/business/hooks/useDashboard';

export function Dashboard() {
  useMetricSubscription(businessId); // Auto-refresh every 15 min

  const { data: metrics } = useDashboardMetrics(businessId);
  // Component will auto-update when cache invalidates
}
```

---

## File Navigation

| What | Where |
|------|-------|
| Database schema | `supabase/migrations/20260425_actionable_dashboard.sql` |
| Type definitions | `src/business/types/dashboard.ts` |
| AI service | `src/business/services/dashboard/ai-insights.ts` |
| Metrics service | `src/business/services/dashboard/metrics-engine.ts` |
| Dashboard components | `src/business/components/Dashboard/` |
| Custom hooks | `src/business/hooks/useDashboard.ts` |
| Tests | `src/business/components/Dashboard/__tests__/` |
| Documentation | `PHASE_4_ACTIONABLE_DASHBOARD_IMPLEMENTATION.md` |

---

## Key Concepts

### Metrics
Real-time KPI calculations:
- Conversion rate (%)
- Average deal size (USD)
- Pipeline value (USD)
- Sales velocity (days)
- Win/loss rate (%)

**Cache**: 5 minutes

### Insights
AI-analyzed findings:
- Bottleneck: Where leads get stuck
- Performance: Actual vs target
- Forecast: Future predictions
- Anomaly: Unusual patterns
- Trend: Historical direction
- Health: Overall status
- Recommendation: Suggested actions

**Confidence**: 0-100%  
**Impact**: 0-100%

### Recommendations
Actionable next steps:
- Priority: low, medium, high, critical
- Action: call, email, reassign, investigate, etc.
- Effort: trivial, low, medium, high
- Expected impact: Quantified benefit

**Status**: suggested → implemented

### Anomalies
Unusual patterns detected:
- Type: spike, drop, pattern break, data quality
- Severity: low, medium, high, critical
- Confidence: 0-100%
- Standard deviations from baseline

**Detection**: Statistical (Z-score)

---

## Testing

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# Dashboard tests only
npm run test:dashboard
```

---

## Performance Tips

1. **Use React.memo** for components
2. **Cache insights** for 1 hour
3. **Batch metric calls** with `getAllKPIMetrics()`
4. **Enable React Query persistence** for offline support
5. **Use materialized views** for expensive queries

---

## Troubleshooting

### "Failed to generate insights"
- Check Anthropic API key is set
- Verify rate limit (10 calls/minute)
- Check Claude API status
- Review error logs

### "Metrics loading slowly"
- Check React Query cache hit rate
- Verify database indexes created
- Review database performance
- Monitor materialized view refresh

### "Dashboard won't load"
- Check Supabase connection
- Verify RLS policies enabled
- Check browser console for errors
- Try clearing React Query cache

---

## API Reference

### MetricsEngine
```typescript
engine.calculateConversionRate(params)
engine.calculateAverageDealSize(params)
engine.calculatePipelineValue(params)
engine.calculateSalesVelocity(params)
engine.calculateWinLossRate(params)
engine.getAllKPIMetrics(params)
engine.getStageVelocity(businessId, pipelineId)
engine.clearCache()
```

### AIInsightsService
```typescript
aiService.generateInsight(metricsData, context)
aiService.generateRecommendations(metricsData, context)
aiService.detectAnomalies(timeseries, baseline, threshold)
aiService.forecastMetrics(historicalData, periodsAhead)
aiService.analyzeTrends(metricsData, period)
aiService.suggestActions(problems, capabilities)
aiService.clearCache()
```

### Custom Hooks
```typescript
useDashboardMetrics(businessId)
useInsights(businessId, limit)
useRecommendations(businessId, status, limit)
useAnomalies(businessId, limit)
useForecasts(businessId)
useKPISummary(businessId)
useDashboardHealth(businessId)
useDashboardState(businessId)
useMetricSubscription(businessId)
useGenerateInsights(businessId)
useGenerateRecommendations(businessId)
useDismissInsight()
useImplementRecommendation()
useRefreshDashboard(businessId)
```

---

## Components

### DashboardHome
Main dashboard view with KPI cards
```typescript
<DashboardHome
  businessId="biz-123"
  onNavigate={(section) => navigate(`/dashboard/${section}`)}
/>
```

### InsightPanel
Browse and filter all insights
```typescript
<InsightPanel businessId="biz-123" />
```

### Others (Stubs)
- BottleneckDetector
- RecommendationEngine
- AnomalyAlerts
- ForecastingPanel
- TrendAnalysis
- PerformanceMetrics
- GoalTracking
- DashboardMetricsCard

---

## Database Queries

### Get recent insights
```sql
SELECT * FROM dashboard_insights
WHERE business_id = 'biz-123'
  AND dismissed = false
ORDER BY created_at DESC
LIMIT 10;
```

### Get pending recommendations
```sql
SELECT * FROM dashboard_recommendations
WHERE business_id = 'biz-123'
  AND implementation->>'status' = 'suggested'
ORDER BY priority DESC;
```

### Get active anomalies
```sql
SELECT * FROM dashboard_anomalies
WHERE business_id = 'biz-123'
  AND resolution->>'resolved' = 'false'
ORDER BY severity DESC;
```

### Get latest metrics
```sql
SELECT DISTINCT ON (metric_type)
  metric_type, current_value, trend, created_at
FROM dashboard_metrics
WHERE business_id = 'biz-123'
ORDER BY metric_type, created_at DESC;
```

---

## Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# Anthropic (Claude API)
ANTHROPIC_API_KEY=sk-ant-...

# Optional
DEBUG_DASHBOARD=true
DASHBOARD_REFRESH_INTERVAL_MS=900000
ANOMALY_STD_DEV_THRESHOLD=2.0
AI_RATE_LIMIT_PER_MINUTE=10
```

---

## Next Steps

1. **Apply database migration** - Create all 8 tables
2. **Set environment variables** - Anthropic API key required
3. **Import types** - Use in components
4. **Use hooks** - Fetch dashboard data
5. **Render components** - Display insights and recommendations
6. **Configure alerts** - Setup anomaly thresholds
7. **Test flow** - Verify end-to-end integration
8. **Monitor performance** - Track metrics and API usage

---

## Resources

- **Full Documentation**: PHASE_4_ACTIONABLE_DASHBOARD_IMPLEMENTATION.md
- **Delivery Summary**: PHASE_4_DELIVERY_SUMMARY.md
- **Database Schema**: supabase/migrations/20260425_actionable_dashboard.sql
- **Type Definitions**: src/business/types/dashboard.ts
- **Services**: src/business/services/dashboard/
- **Components**: src/business/components/Dashboard/
- **Tests**: src/business/components/Dashboard/__tests__/dashboard.test.ts

---

**Questions?** Check the full implementation guide or review the test suite for examples.
