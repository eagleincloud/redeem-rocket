import { useMemo } from 'react';
import {
  TrendingUp, Zap, AlertTriangle, CheckCircle, Clock, Star, Target, Brain,
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import type { Lead } from '@/app/api/supabase-data';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadScoreCardProps {
  lead: Lead;
  activitiesCount?: number;
  followUpsCount?: number;
  overdueFollowUps?: number;
  compact?: boolean;
}

interface ScoreTier {
  label: string;
  emoji: string;
  color: string;
}

interface Insight {
  icon: React.ReactNode;
  text: string;
  positive: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#f97316';

const SOURCE_SCORES: Record<string, number> = {
  scrape: 5, referral: 15, walk_in: 12, website: 10, campaign: 8, csv: 5, manual: 3,
};

const STAGE_SCORES: Record<string, number> = {
  new: 0, contacted: 10, qualified: 20, proposal: 30, negotiation: 40, won: 0, lost: 0,
};

const PRIORITY_SCORES: Record<string, number> = {
  low: 0, medium: 5, high: 10, urgent: 15,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeScore(
  lead: Lead,
  activitiesCount: number,
  followUpsCount: number,
  overdueFollowUps: number,
): number {
  let total = 0;
  if (lead.phone)            total += 15;
  if (lead.email)            total += 10;
  if (lead.company)          total += 8;
  if (lead.deal_value)       total += 10;
  if (lead.product_interest) total += 7;
  total += STAGE_SCORES[lead.stage] ?? 0;
  total += PRIORITY_SCORES[lead.priority] ?? 0;
  if (activitiesCount > 0) total += 10;
  if (followUpsCount > 0)  total += 5;
  if (followUpsCount > 0 && overdueFollowUps === 0) total += 5;
  total += SOURCE_SCORES[lead.source] ?? 0;
  return Math.min(100, total);
}

function getTier(score: number): ScoreTier {
  if (score <= 30)  return { label: 'Cold',    emoji: '❄️',  color: '#64748b' };
  if (score <= 50)  return { label: 'Warm',    emoji: '🙂',  color: '#f59e0b' };
  if (score <= 70)  return { label: 'Hot',     emoji: '🔥',  color: '#f97316' };
  return              { label: 'Burning', emoji: '🚀', color: '#22c55e' };
}

function buildInsights(
  lead: Lead,
  activitiesCount: number,
  followUpsCount: number,
  overdueFollowUps: number,
): Insight[] {
  const insights: Insight[] = [];

  if (!lead.email) {
    insights.push({ icon: <AlertTriangle size={13} />, text: 'No email captured — email reach disabled', positive: false });
  } else {
    insights.push({ icon: <CheckCircle size={13} />, text: 'Email on file — email campaigns enabled', positive: true });
  }

  if (!lead.phone) {
    insights.push({ icon: <AlertTriangle size={13} />, text: 'No phone — WhatsApp & SMS unavailable', positive: false });
  }

  if ((lead.priority === 'high' || lead.priority === 'urgent') && (lead.stage === 'negotiation' || lead.stage === 'proposal')) {
    insights.push({ icon: <Zap size={13} />, text: 'High priority + advanced stage — close now', positive: true });
  }

  if (lead.source === 'referral') {
    insights.push({ icon: <Star size={13} />, text: 'Referral source — 2x conversion likelihood', positive: true });
  } else if (lead.source === 'walk_in') {
    insights.push({ icon: <Star size={13} />, text: 'Walk-in lead — high purchase intent', positive: true });
  }

  if (lead.deal_value && lead.deal_value > 0) {
    insights.push({ icon: <TrendingUp size={13} />, text: `Deal value set — ₹${lead.deal_value.toLocaleString('en-IN')} opportunity`, positive: true });
  } else {
    insights.push({ icon: <AlertTriangle size={13} />, text: 'No deal value — pipeline revenue unclear', positive: false });
  }

  if (overdueFollowUps > 0) {
    insights.push({ icon: <Clock size={13} />, text: `${overdueFollowUps} overdue follow-up${overdueFollowUps > 1 ? 's' : ''} — respond urgently`, positive: false });
  }

  if (activitiesCount === 0) {
    insights.push({ icon: <AlertTriangle size={13} />, text: 'No activities logged — engagement unknown', positive: false });
  } else {
    insights.push({ icon: <CheckCircle size={13} />, text: `${activitiesCount} activit${activitiesCount === 1 ? 'y' : 'ies'} logged — engaged lead`, positive: true });
  }

  if (!lead.company) {
    insights.push({ icon: <AlertTriangle size={13} />, text: 'No company info — B2B targeting limited', positive: false });
  }

  // Return at most 4 insights, prioritising negative ones first
  const negative = insights.filter(i => !i.positive);
  const positive = insights.filter(i => i.positive);
  return [...negative, ...positive].slice(0, 4);
}

function getRecommendedActions(stage: Lead['stage']): string[] {
  switch (stage) {
    case 'new':         return ['Log first contact', 'Send introduction message', 'Qualify budget and needs'];
    case 'contacted':   return ['Schedule a follow-up call', 'Share product catalogue', 'Capture deal value'];
    case 'qualified':   return ['Prepare a tailored proposal', 'Identify decision makers', 'Schedule demo'];
    case 'proposal':    return ['Follow up on proposal', 'Address objections', 'Negotiate terms'];
    case 'negotiation': return ['Finalise pricing', 'Draft contract', 'Set closing deadline'];
    case 'won':         return ['Create invoice', 'Onboard customer', 'Request referral'];
    case 'lost':        return ['Schedule re-engagement in 60 days', 'Log lost reason', 'Analyse deal post-mortem'];
    default:            return ['Review lead details'];
  }
}

// ─── SVG Gauge ────────────────────────────────────────────────────────────────

interface GaugeProps {
  score: number;
  tierColor: string;
  isDark: boolean;
}

function ScoreGauge({ score, tierColor, isDark }: GaugeProps) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * r;
  // Arc runs 270 degrees (from 135° to 405°), we offset to start at the left-bottom
  const arcLength = circumference * 0.75;
  const filled = arcLength * (score / 100);
  const dashArray = `${filled} ${circumference - filled}`;
  // rotate so arc starts at bottom-left (225deg from top = 135deg SVG rotation offset)
  const rotation = 135;

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
      {/* Track */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={isDark ? '#30363d' : '#e5e7eb'}
        strokeWidth={strokeWidth}
        strokeDasharray={`${arcLength} ${circumference - arcLength}`}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${cx} ${cy})`}
      />
      {/* Fill */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={tierColor}
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        strokeDashoffset={0}
        strokeLinecap="round"
        transform={`rotate(${rotation} ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Score number */}
      <text
        x={cx} y={cy - 4}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={28}
        fontWeight={700}
        fill={tierColor}
      >
        {score}
      </text>
      {/* /100 */}
      <text
        x={cx} y={cy + 18}
        textAnchor="middle"
        fontSize={11}
        fill={isDark ? '#8b949e' : '#6b7280'}
      >
        / 100
      </text>
    </svg>
  );
}

// ─── Compact badge ────────────────────────────────────────────────────────────

function CompactBadge({ score, tier }: { score: number; tier: ScoreTier }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      backgroundColor: tier.color + '22',
      color: tier.color,
      border: `1px solid ${tier.color}55`,
      borderRadius: 999,
      padding: '2px 10px',
      fontSize: 12,
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {tier.emoji} {score} {tier.label}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function LeadScoreCard({
  lead,
  activitiesCount = 0,
  followUpsCount = 0,
  overdueFollowUps = 0,
  compact = false,
}: LeadScoreCardProps) {
  const { isDark } = useTheme();

  const score = useMemo(
    () => computeScore(lead, activitiesCount, followUpsCount, overdueFollowUps),
    [lead, activitiesCount, followUpsCount, overdueFollowUps],
  );

  const tier = getTier(score);

  if (compact) return <CompactBadge score={score} tier={tier} />;

  const insights = buildInsights(lead, activitiesCount, followUpsCount, overdueFollowUps);
  const actions = getRecommendedActions(lead.stage);
  const engagementRaw = activitiesCount + followUpsCount * 2;
  const engagementScore = Math.min(100, engagementRaw * 5);

  const bg = isDark ? '#161b22' : '#ffffff';
  const text = isDark ? '#e6edf3' : '#1f2937';
  const subtle = isDark ? '#8b949e' : '#6b7280';
  const border = isDark ? '#30363d' : '#e5e7eb';
  const sectionBg = isDark ? '#0d1117' : '#f9fafb';
  const cardBg = isDark ? '#21262d' : '#f3f4f6';

  return (
    <div style={{
      backgroundColor: bg,
      color: text,
      borderRadius: 14,
      border: `1px solid ${border}`,
      padding: '20px 20px 16px',
      fontFamily: 'inherit',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} color={ACCENT} />
          <span style={{ fontSize: 13, fontWeight: 600, color: ACCENT }}>AI Lead Score</span>
        </div>
        <CompactBadge score={score} tier={tier} />
      </div>

      {/* ── Gauge ── */}
      <div style={{ textAlign: 'center' }}>
        <ScoreGauge score={score} tierColor={tier.color} isDark={isDark} />
        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 700, color: tier.color }}>
          {tier.emoji} {tier.label}
        </div>
        <div style={{ fontSize: 11, color: subtle, marginTop: 2 }}>
          Lead quality indicator
        </div>
      </div>

      {/* ── Insights ── */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: subtle, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Insights
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {insights.map((insight, i) => (
            <div
              key={i}
              style={{
                backgroundColor: cardBg,
                borderRadius: 8,
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 7,
                border: `1px solid ${insight.positive ? '#22c55e22' : '#ef444422'}`,
              }}
            >
              <span style={{ color: insight.positive ? '#22c55e' : '#ef4444', flexShrink: 0, marginTop: 1 }}>
                {insight.icon}
              </span>
              <span style={{ fontSize: 11, color: text, lineHeight: '1.4' }}>
                {insight.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recommended Actions ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <Target size={13} color={ACCENT} />
          <span style={{ fontSize: 11, fontWeight: 600, color: subtle, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Recommended Actions
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {actions.map((action, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                backgroundColor: sectionBg,
                borderRadius: 7,
                border: `1px solid ${border}`,
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: '50%', backgroundColor: ACCENT + '22',
                color: ACCENT, fontSize: 10, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 12, color: text }}>{action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Engagement Score Bar ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <TrendingUp size={12} color={subtle} />
            <span style={{ fontSize: 11, color: subtle }}>Engagement Score</span>
          </div>
          <span style={{ fontSize: 11, fontWeight: 600, color: text }}>{engagementScore}/100</span>
        </div>
        <div style={{
          height: 6, backgroundColor: isDark ? '#30363d' : '#e5e7eb',
          borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${engagementScore}%`,
            backgroundColor: engagementScore >= 70 ? '#22c55e' : engagementScore >= 40 ? ACCENT : '#f59e0b',
            borderRadius: 999,
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: 10, color: subtle, marginTop: 4 }}>
          Based on {activitiesCount} activit{activitiesCount === 1 ? 'y' : 'ies'} + {followUpsCount} follow-up{followUpsCount === 1 ? '' : 's'}
        </div>
      </div>

    </div>
  );
}
