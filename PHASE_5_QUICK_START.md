# Phase 5: Actionable Dashboard - Quick Start Guide

## Accessing the Dashboard

```
URL: http://localhost:5173/app/dashboard-v2
```

## Components Overview

### 1. Health Score (Top Right)
**What it shows**: Overall business health on a 0-100 scale
- **Green (80+)**: Excellent - Everything is running smoothly
- **Blue (60-79)**: Good - Performing well
- **Yellow (40-59)**: Fair - Room for improvement
- **Red (<40)**: Poor - Immediate action needed

**Sub-metrics**:
- Conversion Rate: Sales conversion efficiency
- Lead Velocity: New leads per week
- Follow-up Rate: Automation engagement level
- Overall Health: Combined metric

### 2. Conversion Funnel (Top Left)
**What it shows**: How leads move through your pipeline stages
- Each bar represents a stage (Leads → Qualified → Proposal → Won)
- Numbers show count and percentage
- Red text shows drop-off rate between stages

**How to use**: 
- Identify which stage has the biggest drop-off
- Click stage to drill down into specific leads

### 3. Performance Chart (Bottom Left)
**What it shows**: 30-day trend of key metrics
- Solid line = Conversion rate trend
- Dashed line = Lead velocity trend
- Hover over data points for exact values

**How to use**:
- Spot upward/downward trends
- Compare weeks to identify seasonal patterns

### 4. Top Bottleneck Alert (Bottom Right)
**What it shows**: Your biggest pipeline problem
- **Critical** (Red): >30 days in stage, immediate action needed
- **Warning** (Yellow): 14-30 days, should investigate
- **Normal** (Blue): <14 days, monitoring

**Key metrics**:
- Avg Time in Stage: How long entities stay there
- Entities Affected: Number of stuck deals

### 5. Recommendations Carousel (Middle)
**What it shows**: AI-generated actionable suggestions
- Click card to expand and see full details
- Sorted by priority (Critical → High → Medium → Low)

**Quick Actions**:
- **Implement**: Mark as done and track impact
- **Snooze 4h**: Hide for 4 hours, reappears after
- **Dismiss**: Remove from list

**Example Recommendations**:
- "5 leads stalled 7+ days → Send follow-up"
- "Conversion 15% vs industry 25% → A/B test templates"
- "3 deals closing this week → Confirm fulfillment"
- "30 dormant leads → Launch reactivation campaign"

---

## Using the Dashboard

### Daily Workflow
1. **Check Health Score** (top right)
   - If down from yesterday, investigate why

2. **Review Top Bottleneck** (bottom right)
   - If critical, implement recommended action

3. **Read Recommendations** (middle)
   - Implement 1-2 per day based on priority

4. **Monitor Performance Trend** (bottom left)
   - Are conversions going up or down?

### Weekly Deep Dive
1. **Analyze Conversion Funnel** (top left)
   - Which stage has biggest drop-off?
   - Is it the same every week?

2. **Refresh Metrics** (click refresh button)
   - Get latest calculations
   - See impact of actions from last week

3. **Export Data** (future feature)
   - CSV export for reporting
   - Share with team/management

---

## Understanding Metrics

### Health Score Components

**Conversion Rate (40% weight)**
- Formula: (Won deals / Total deals) × 100
- Industry avg: 20-25%
- Goal: >25%

**Lead Velocity (30% weight)**
- Formula: New leads per week
- Industry avg: 8-12/week
- Goal: >15/week

**Follow-up Rate (20% weight)**
- Formula: % of leads receiving follow-ups
- Industry avg: 60%
- Goal: >80%

**Overall Health (10% weight)**
- Formula: Average of above three
- Indicates pipeline stability

### Bottleneck Severity

**Critical** (Red)
- >30 days in same stage
- >5 entities affected
- Requires immediate action

**Warning** (Yellow)  
- 14-30 days in stage
- 2-5 entities affected
- Monitor and prepare action plan

**Normal** (Blue)
- <14 days in stage
- All healthy
- Keep watching trends

---

## Taking Action

### Example: Address Stalled Leads

**Recommendation**: "5 leads stalled 7+ days in Negotiation"

**Steps**:
1. Click recommendation to expand
2. Read "Action Step": "Contact assigned owners"
3. Go to Leads page, filter by stage
4. Send batch follow-up email
5. Return to dashboard and click "Implement"
6. Health score updates next refresh

### Example: Low Conversion Rate Alert

**Recommendation**: "Conversion 15% vs industry 25%"

**Steps**:
1. Read suggested action: "A/B test email templates"
2. Go to Email Setup or Campaigns page
3. Create A/B test with new template
4. Track metrics for 2 weeks
5. Return to dashboard, "Implement" if working
6. Score should improve after 15 min refresh

### Example: High-Value Deal Closing

**Recommendation**: "3 deals worth $50K closing this week"

**Steps**:
1. Note entity names in recommendation
2. Go to Pipeline board
3. Prepare fulfillment tasks
4. Confirm all contracts/details
5. Schedule delivery/onboarding
6. Move deals to Won stage
7. Click "Implement" → Score increases

---

## Keyboard Shortcuts (Future)

- `R` - Refresh metrics
- `E` - Expand first recommendation
- `?` - Help menu

---

## Troubleshooting

### Dashboard loads slowly
- **Fix**: Wait 2-3 seconds, metrics are cached
- **Alt**: Click refresh to force new calculation

### Health score seems wrong
- **Check**: Ensure your pipeline has deals
- **Check**: Verify last 90 days of activity
- **Fix**: Go to leads/pipeline, add test data

### Recommendations not appearing
- **Likely cause**: Pipeline is healthy, no issues detected
- **Check health score**: If >80, you're doing well!

### Can't see old recommendations
- **Note**: Only 5 most recent shown
- **Future**: Will have archive/history view

---

## Next Steps

1. **Set up automated actions** (Phase 6)
   - Auto-send follow-ups for stalled leads
   - Auto-escalate critical bottlenecks

2. **Custom recommendations** (Future)
   - Based on your industry
   - Based on your team's behavior

3. **Export reports** (Future)
   - Weekly PDF summaries
   - Stakeholder dashboards

4. **Mobile app** (Future)
   - Check health score on the go
   - Quick action buttons

---

## Questions?

For detailed technical info, see: `PHASE_5_COMPLETION_REPORT.md`

For component documentation, see code comments in:
- `src/business/components/Dashboard/*`
- `src/business/pages/DashboardV2Page.tsx`
