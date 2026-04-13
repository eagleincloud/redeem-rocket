import { useState, useEffect } from 'react';
import {
  User, Building2, Link2, Phone, Mail, Calendar, Activity,
  Clock, AlertTriangle, CheckCircle, XCircle, ChevronRight,
  GitBranch, Layers,
} from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  fetchLeadEntity, fetchEntityLineage, fetchSimilarLeadsForLineage,
  type LeadEntity, type LeadLineageEntry, type Lead,
} from '@/app/api/supabase-data';

// ── Stage colours ─────────────────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  new: '#64748b', contacted: '#3b82f6', qualified: '#f59e0b',
  proposal: '#f97316', negotiation: '#a855f7', won: '#22c55e', lost: '#ef4444',
};

const STAGE_LABELS: Record<string, string> = {
  new: 'New', contacted: 'Contacted', qualified: 'Qualified',
  proposal: 'Proposal', negotiation: 'Negotiation', won: 'Won', lost: 'Lost',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatYear(iso: string): string {
  return new Date(iso).getFullYear().toString();
}

function formatValue(v: number): string {
  if (v >= 10_00_000) return `₹${(v / 10_00_000).toFixed(1)}L`;
  if (v >= 1_000)     return `₹${(v / 1_000).toFixed(1)}K`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

// ── Entity type badge ─────────────────────────────────────────────────────────

const ENTITY_EMOJI: Record<string, string> = { person: '👤', company: '🏢', both: '🔗' };
const ENTITY_LABEL: Record<string, string> = { person: 'Person', company: 'Company', both: 'Person & Company' };

// ── Props ─────────────────────────────────────────────────────────────────────

interface LeadLineagePanelProps {
  leadId: string;
  lead?: Lead;
  onOpenLead: (lead: Lead) => void;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ width, height, radius = 6, isDark }: {
  width: string | number; height: number; radius?: number; isDark: boolean;
}) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: isDark ? '#21262d' : '#e5e7eb',
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  );
}

// ── Loading state ─────────────────────────────────────────────────────────────

function LoadingSkeleton({ isDark }: { isDark: boolean }) {
  const card = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? '#30363d' : '#e5e7eb';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Entity header skeleton */}
      <div style={{
        background: card, border: `1px solid ${border}`,
        borderRadius: 10, padding: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
          <Skeleton width={48} height={48} radius={24} isDark={isDark} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Skeleton width="60%" height={18} isDark={isDark} />
            <Skeleton width="35%" height={13} isDark={isDark} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Skeleton width="30%" height={13} isDark={isDark} />
          <Skeleton width="30%" height={13} isDark={isDark} />
          <Skeleton width="25%" height={13} isDark={isDark} />
        </div>
      </div>
      {/* Timeline card skeletons */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32 }}>
            <Skeleton width={14} height={14} radius={7} isDark={isDark} />
            <div style={{ width: 2, flex: 1, marginTop: 4, background: isDark ? '#21262d' : '#e5e7eb' }} />
          </div>
          <div style={{
            flex: 1, background: card, border: `1px solid ${border}`,
            borderRadius: 10, padding: 16, marginBottom: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <Skeleton width={70} height={20} radius={20} isDark={isDark} />
              <Skeleton width={55} height={20} radius={20} isDark={isDark} />
            </div>
            <Skeleton width="75%" height={16} isDark={isDark} />
            <div style={{ height: 8 }} />
            <Skeleton width="45%" height={13} isDark={isDark} />
          </div>
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyLineage({ isDark, accent }: { isDark: boolean; accent: string }) {
  const text   = isDark ? '#e6edf3' : '#1f2937';
  const muted  = isDark ? '#8b949e' : '#6b7280';
  const card   = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? '#30363d' : '#e5e7eb';

  return (
    <div style={{
      background: card, border: `1px solid ${border}`,
      borderRadius: 10, padding: 32, textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 28,
        background: `${accent}20`, display: 'flex',
        alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
      }}>
        <GitBranch size={28} color={accent} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 15, color: text, marginBottom: 8 }}>
        No lineage yet
      </div>
      <div style={{ fontSize: 13, color: muted, lineHeight: 1.6, maxWidth: 280, margin: '0 auto' }}>
        This lead hasn&apos;t been linked to any entity yet. Link it to group with related leads.
      </div>
    </div>
  );
}

// ── AI Insight box ────────────────────────────────────────────────────────────

function AIInsightBox({
  entries, entity, isDark,
}: {
  entries: LeadLineageEntry[];
  entity: LeadEntity;
  isDark: boolean;
}) {
  const card   = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? '#30363d' : '#e5e7eb';
  const text   = isDark ? '#e6edf3' : '#1f2937';

  const wonLeads   = entries.filter(e => e.lead.stage === 'won');
  const allLost    = entries.length > 0 && entries.every(e => e.lead.stage === 'lost');
  const lastStage  = entity.last_stage ?? '';
  const totalDeals = entity.total_deals ?? 0;

  let emoji = '💡';
  let message = 'Review this lead\'s history before taking action.';

  if (totalDeals >= 3) {
    emoji = '🔄';
    message = `Returning contact with ${totalDeals} interactions. High familiarity.`;
  } else if (wonLeads.length > 0) {
    emoji = '✅';
    message = 'Previously converted! Reference past success in your pitch.';
  } else if (allLost) {
    emoji = '⚠️';
    message = 'Previously lost. Review past notes before approaching.';
  } else if (lastStage === 'proposal' || lastStage === 'negotiation') {
    emoji = '🔥';
    message = `Last interaction was in ${STAGE_LABELS[lastStage] ?? lastStage}. Follow up!`;
  }

  return (
    <div style={{
      background: card, border: `1px solid ${border}`,
      borderRadius: 10, padding: 16,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ fontSize: 22, lineHeight: 1, marginTop: 1 }}>{emoji}</div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          AI Insight
        </div>
        <div style={{ fontSize: 13, color: text, lineHeight: 1.55 }}>{message}</div>
      </div>
    </div>
  );
}

// ── Entity header card ────────────────────────────────────────────────────────

function EntityHeaderCard({ entity, isDark, accent }: {
  entity: LeadEntity; isDark: boolean; accent: string;
}) {
  const card   = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? '#30363d' : '#e5e7eb';
  const text   = isDark ? '#e6edf3' : '#1f2937';
  const muted  = isDark ? '#8b949e' : '#6b7280';

  const entityEmoji = ENTITY_EMOJI[entity.entity_type] ?? '👤';
  const entityLabel = ENTITY_LABEL[entity.entity_type] ?? entity.entity_type;

  return (
    <div style={{
      background: card, border: `1px solid ${border}`,
      borderRadius: 10, padding: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 24,
          background: `${accent}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, flexShrink: 0,
        }}>
          {entityEmoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: text, marginBottom: 4 }}>
            {entity.name}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, color: accent,
            background: `${accent}18`, borderRadius: 20,
            padding: '2px 9px', textTransform: 'uppercase', letterSpacing: '0.07em',
          }}>
            {entityLabel}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 0, marginBottom: entity.phone || entity.email ? 12 : 0 }}>
        {[
          { label: 'Deals', value: String(entity.total_deals) },
          { label: 'Total', value: formatValue(entity.total_value) },
          ...(entity.last_stage ? [{ label: 'Last', value: STAGE_LABELS[entity.last_stage] ?? entity.last_stage }] : []),
        ].map((stat, idx, arr) => (
          <div key={stat.label} style={{
            flex: 1, textAlign: 'center',
            borderRight: idx < arr.length - 1 ? `1px solid ${border}` : 'none',
            padding: '4px 0',
          }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: text }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: muted }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Contact row */}
      {(entity.phone || entity.email) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
          {entity.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: muted }}>
              <Phone size={12} color={muted} />
              {entity.phone}
            </div>
          )}
          {entity.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: muted }}>
              <Mail size={12} color={muted} />
              {entity.email}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Single lead timeline card ─────────────────────────────────────────────────

function LeadTimelineCard({
  entry, isCurrent, isDark, accent, onOpenLead,
}: {
  entry: LeadLineageEntry;
  isCurrent: boolean;
  isDark: boolean;
  accent: string;
  onOpenLead: (lead: Lead) => void;
}) {
  const { lead } = entry;
  const card   = isDark ? '#161b22' : '#ffffff';
  const border = isDark ? '#30363d' : '#e5e7eb';
  const text   = isDark ? '#e6edf3' : '#1f2937';
  const muted  = isDark ? '#8b949e' : '#6b7280';
  const subtleBg = isDark ? '#0d1117' : '#f9fafb';

  const isWon  = lead.stage === 'won';
  const isLost = lead.stage === 'lost';
  const stageColor = STAGE_COLORS[lead.stage] ?? '#64748b';
  const priorityColor = PRIORITY_COLORS[(lead as any).priority ?? 'low'] ?? '#64748b';

  let cardBorder = border;
  let cardGlow   = 'none';
  if (isCurrent) {
    cardBorder = accent;
    cardGlow   = `0 0 0 1px ${accent}, 0 4px 16px ${accent}30`;
  } else if (isWon) {
    cardBorder = '#22c55e';
    cardGlow   = '0 0 0 1px #22c55e40, 0 4px 16px #22c55e20';
  } else if (isLost) {
    cardBorder = '#ef4444';
  }

  return (
    <div style={{
      background: card,
      border: `1.5px solid ${cardBorder}`,
      borderRadius: 10,
      padding: 16,
      boxShadow: cardGlow !== 'none' ? cardGlow : '0 2px 8px rgba(0,0,0,0.08)',
      borderLeft: isLost ? `3px solid #ef4444` : `1.5px solid ${cardBorder}`,
      position: 'relative',
    }}>
      {/* "You are here" label for current lead */}
      {isCurrent && (
        <div style={{
          position: 'absolute', top: -11, left: 12,
          fontSize: 10, fontWeight: 700, color: accent,
          background: card, padding: '0 6px',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          ← You are here
        </div>
      )}

      {/* Header row: stage badge + chips + priority dot + open button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {/* Stage badge */}
        <span style={{
          fontSize: 11, fontWeight: 700, color: '#fff',
          background: stageColor, borderRadius: 20, padding: '3px 10px',
          letterSpacing: '0.05em', textTransform: 'uppercase',
        }}>
          {STAGE_LABELS[lead.stage] ?? lead.stage}
        </span>

        {/* Current chip */}
        {isCurrent && (
          <span style={{
            fontSize: 10, fontWeight: 700, color: accent,
            background: `${accent}20`, borderRadius: 20, padding: '2px 8px',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Current
          </span>
        )}

        {/* Won badge */}
        {isWon && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22c55e' }}>
            <CheckCircle size={12} color="#22c55e" /> Won
          </span>
        )}

        {/* Lost badge */}
        {isLost && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444' }}>
            <XCircle size={12} color="#ef4444" /> Lost
          </span>
        )}

        {/* Overdue badge */}
        {entry.overdueFollowUps > 0 && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, fontWeight: 600, color: '#fff',
            background: '#ef4444', borderRadius: 20, padding: '2px 8px',
          }}>
            <AlertTriangle size={11} color="#fff" /> {entry.overdueFollowUps} Overdue
          </span>
        )}

        {/* Priority dot */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: priorityColor }} />
          {!isCurrent && (
            <button
              onClick={() => onOpenLead(lead)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 12, fontWeight: 600, color: accent,
                background: `${accent}18`, border: `1px solid ${accent}50`,
                borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
            >
              Open <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Lead name + company */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: text, marginBottom: 2 }}>
          {lead.name}
        </div>
        {lead.company && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: muted }}>
            <Building2 size={12} color={muted} />
            {lead.company}
          </div>
        )}
      </div>

      {/* Deal value */}
      {(lead.deal_value || lead.closed_value) && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 13, fontWeight: 700,
          color: isWon ? '#22c55e' : text,
          background: isWon ? '#22c55e18' : `${isDark ? '#21262d' : '#f3f4f6'}`,
          borderRadius: 6, padding: '3px 10px', marginBottom: 8,
        }}>
          {isWon && lead.closed_value
            ? formatValue(lead.closed_value)
            : lead.deal_value
            ? formatValue(lead.deal_value)
            : null}
        </div>
      )}

      {/* Latest activity snippet */}
      {entry.latestActivity && (
        <div style={{
          background: subtleBg, borderRadius: 6,
          padding: '8px 10px', marginBottom: 8,
          fontSize: 12, fontStyle: 'italic', color: muted,
          lineHeight: 1.5,
        }}>
          &ldquo;{truncate(entry.latestActivity.body ?? entry.latestActivity.title ?? '', 80)}&rdquo;
        </div>
      )}

      {/* Lost reason */}
      {isLost && (lead as any).lost_reason && (
        <div style={{
          fontSize: 12, color: '#ef4444',
          background: '#ef444412', borderRadius: 6,
          padding: '6px 10px', marginBottom: 8,
        }}>
          Reason: {(lead as any).lost_reason}
        </div>
      )}

      {/* Footer: date + activity/followup counts */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: muted }}>
          <Calendar size={11} color={muted} />
          {formatDate(lead.created_at)}
        </div>
        {entry.activitiesCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: muted }}>
            <Activity size={11} color={muted} />
            {entry.activitiesCount} activit{entry.activitiesCount === 1 ? 'y' : 'ies'}
          </div>
        )}
        {entry.followUpsCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: muted }}>
            <Clock size={11} color={muted} />
            {entry.followUpsCount} follow-up{entry.followUpsCount === 1 ? '' : 's'}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Match reason helper ───────────────────────────────────────────────────────

function getMatchReason(current: Lead, other: Lead): string {
  const cp = (current.phone ?? '').replace(/\D/g, '');
  const op = (other.phone ?? '').replace(/\D/g, '');
  if (cp && op && cp === op) return '📞 Same phone';
  if (current.email && other.email && current.email.toLowerCase() === other.email.toLowerCase()) return '✉️ Same email';
  if (current.company && other.company && current.company.toLowerCase().includes(other.company.toLowerCase().slice(0, 4))) return '🏢 Same company';
  return '👤 Similar name';
}

// ── Main component ────────────────────────────────────────────────────────────

export function LeadLineagePanel({ leadId, lead: leadProp, onOpenLead }: LeadLineagePanelProps) {
  const { isDark, theme } = useTheme();
  const accent = theme?.accent ?? '#f97316';

  const [loading, setLoading]           = useState(true);
  const [entity, setEntity]             = useState<LeadEntity | null>(null);
  const [entries, setEntries]           = useState<LeadLineageEntry[]>([]);
  const [similarLeads, setSimilarLeads] = useState<Lead[]>([]);

  const bg     = isDark ? '#0d1117' : '#f9fafb';
  const text   = isDark ? '#e6edf3' : '#1f2937';
  const muted  = isDark ? '#8b949e' : '#6b7280';
  const border = isDark ? '#30363d' : '#e5e7eb';
  const connectorLine = isDark ? '#30363d' : '#d1d5db';

  // Load similar leads when full lead object is provided (fuzzy matching)
  useEffect(() => {
    if (!leadProp) return;
    setLoading(true);
    setSimilarLeads([]);
    fetchSimilarLeadsForLineage(leadProp.business_id, {
      name: leadProp.name,
      phone: leadProp.phone,
      email: leadProp.email,
      company: leadProp.company,
      id: leadProp.id,
    }).then(matches => {
      setSimilarLeads(matches);
    }).finally(() => setLoading(false));
  }, [leadProp?.id]);

  // Load entity + lineage (entity-based, when no full lead object)
  useEffect(() => {
    if (!leadId || leadProp) return;

    setLoading(true);
    setEntity(null);
    setEntries([]);

    fetchLeadEntity(leadId).then(async (ent) => {
      setEntity(ent);
      if (ent) {
        const lineage = await fetchEntityLineage(ent.id);
        // Sort descending by created_at
        lineage.sort((a, b) =>
          new Date(b.lead.created_at).getTime() - new Date(a.lead.created_at).getTime(),
        );
        setEntries(lineage);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [leadId, leadProp]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ background: bg, padding: 16, minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Layers size={18} color={accent} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: text }}>Lead Lineage</div>
          <div style={{ fontSize: 11, color: muted }}>All interactions with this contact</div>
        </div>
      </div>

      {/* Loading */}
      {loading && <LoadingSkeleton isDark={isDark} />}

      {/* ── Fuzzy-match view (when full lead object is provided) ── */}
      {!loading && leadProp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Current lead card */}
          <div style={{
            background: isDark ? '#161b22' : '#ffffff',
            border: `2px solid ${accent}`,
            borderRadius: 10, padding: 14,
            boxShadow: `0 0 0 1px ${accent}40, 0 4px 16px ${accent}20`,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -11, left: 12,
              fontSize: 10, fontWeight: 700, color: accent,
              background: isDark ? '#161b22' : '#ffffff',
              padding: '0 6px', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              📍 Current Lead
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: text }}>{leadProp.name}</div>
            {leadProp.company && (
              <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>{leadProp.company}</div>
            )}
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: '#fff',
                background: STAGE_COLORS[leadProp.stage] ?? '#64748b',
                borderRadius: 20, padding: '2px 10px',
              }}>
                {STAGE_LABELS[leadProp.stage] ?? leadProp.stage}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: accent,
                background: `${accent}20`, borderRadius: 20, padding: '2px 8px',
              }}>
                Current
              </span>
            </div>
          </div>

          {/* Connector line to matches */}
          {similarLeads.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ height: 1, flex: 1, background: connectorLine }} />
              <span style={{
                fontSize: 11, fontWeight: 700, color: muted,
                background: isDark ? '#21262d' : '#e5e7eb',
                borderRadius: 20, padding: '2px 10px',
              }}>
                {similarLeads.length} similar lead{similarLeads.length === 1 ? '' : 's'}
              </span>
              <div style={{ height: 1, flex: 1, background: connectorLine }} />
            </div>
          )}

          {similarLeads.length === 0 && (
            <div style={{
              background: isDark ? '#161b22' : '#ffffff',
              border: `1px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
              borderRadius: 10, padding: 24, textAlign: 'center',
              color: muted, fontSize: 13,
            }}>
              No similar leads found in your history.
            </div>
          )}

          {/* Similar leads */}
          {similarLeads.map((sl, idx) => {
            const isLast = idx === similarLeads.length - 1;
            const matchReason = getMatchReason(leadProp, sl);
            const stageColor = STAGE_COLORS[sl.stage] ?? '#64748b';
            return (
              <div key={sl.id} style={{ display: 'flex', gap: 12, marginBottom: isLast ? 0 : 4 }}>
                {/* Connector dot */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 24, flexShrink: 0, paddingTop: 4 }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 7, flexShrink: 0,
                    background: sl.stage === 'won' ? '#22c55e' : sl.stage === 'lost' ? '#ef4444' : stageColor,
                    border: `2px solid ${isDark ? '#0d1117' : '#f9fafb'}`,
                    zIndex: 1,
                  }} />
                  {!isLast && (
                    <div style={{ width: 2, flex: 1, marginTop: 2, background: connectorLine, minHeight: 20 }} />
                  )}
                </div>

                {/* Card */}
                <div style={{
                  flex: 1, minWidth: 0,
                  background: isDark ? '#161b22' : '#ffffff',
                  border: `1.5px solid ${isDark ? '#30363d' : '#e5e7eb'}`,
                  borderRadius: 10, padding: 14,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: '#fff',
                      background: stageColor, borderRadius: 20, padding: '3px 10px',
                    }}>
                      {STAGE_LABELS[sl.stage] ?? sl.stage}
                    </span>
                    <span style={{
                      fontSize: 11, color: muted, background: isDark ? '#21262d' : '#f3f4f6',
                      borderRadius: 20, padding: '2px 8px',
                    }}>
                      {matchReason}
                    </span>
                    <div style={{ marginLeft: 'auto' }}>
                      <button
                        onClick={() => onOpenLead(sl)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          fontSize: 12, fontWeight: 600, color: accent,
                          background: `${accent}18`, border: `1px solid ${accent}50`,
                          borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                        }}
                      >
                        Open <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: text, marginBottom: 2 }}>{sl.name}</div>
                  {sl.company && (
                    <div style={{ fontSize: 12, color: muted, marginBottom: 4 }}>{sl.company}</div>
                  )}
                  <div style={{ fontSize: 11, color: muted }}>
                    {formatDate(sl.created_at)}
                    {sl.deal_value ? ` · ₹${Number(sl.deal_value).toLocaleString('en-IN')}` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Entity-based lineage view (original behavior) ── */}
      {!loading && !leadProp && (
        <>
          {/* No entity linked */}
          {!entity && (
            <EmptyLineage isDark={isDark} accent={accent} />
          )}

          {/* Entity found */}
          {entity && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Entity header */}
              <EntityHeaderCard entity={entity} isDark={isDark} accent={accent} />

              {/* First-interaction message */}
              {entries.length <= 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: `${accent}12`, border: `1px solid ${accent}40`,
                  borderRadius: 10, padding: '10px 14px',
                  fontSize: 13, color: text,
                }}>
                  <Link2 size={15} color={accent} style={{ flexShrink: 0 }} />
                  This is the first interaction with this entity.
                </div>
              )}

              {/* Timeline */}
              {entries.length > 0 && (
                <div style={{ position: 'relative' }}>
                  {/* Section label */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: muted,
                    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12,
                  }}>
                    Timeline · {entries.length} lead{entries.length === 1 ? '' : 's'}
                  </div>

                  {entries.map((entry, idx) => {
                    const isCurrent = entry.lead.id === leadId;
                    const thisYear  = formatYear(entry.lead.created_at);
                    const prevYear  = idx > 0 ? formatYear(entries[idx - 1].lead.created_at) : null;
                    const showYear  = prevYear !== null && thisYear !== prevYear;
                    const isLast    = idx === entries.length - 1;

                    return (
                      <div key={entry.lead.id}>
                        {/* Year separator badge */}
                        {showYear && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0',
                          }}>
                            <div style={{ height: 1, flex: '0 0 28px', background: connectorLine }} />
                            <span style={{
                              fontSize: 11, fontWeight: 700, color: muted,
                              background: isDark ? '#21262d' : '#e5e7eb',
                              borderRadius: 20, padding: '2px 10px',
                            }}>
                              {thisYear}
                            </span>
                            <div style={{ height: 1, flex: 1, background: connectorLine }} />
                          </div>
                        )}

                        {/* Row: dot + connector + card */}
                        <div style={{ display: 'flex', gap: 12, marginBottom: isLast ? 0 : 12 }}>
                          {/* Left connector column */}
                          <div style={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', width: 24, flexShrink: 0,
                            paddingTop: 4,
                          }}>
                            {/* Dot */}
                            <div style={{
                              width: 14, height: 14, borderRadius: 7, flexShrink: 0,
                              background: isCurrent
                                ? accent
                                : entry.lead.stage === 'won'
                                ? '#22c55e'
                                : entry.lead.stage === 'lost'
                                ? '#ef4444'
                                : STAGE_COLORS[entry.lead.stage] ?? '#64748b',
                              border: isCurrent ? `2px solid ${accent}` : `2px solid ${isDark ? '#0d1117' : '#f9fafb'}`,
                              boxShadow: isCurrent ? `0 0 0 3px ${accent}40` : 'none',
                              zIndex: 1,
                            }} />
                            {/* Connector line */}
                            {!isLast && (
                              <div style={{
                                width: 2, flex: 1, marginTop: 2,
                                background: connectorLine, minHeight: 20,
                              }} />
                            )}
                          </div>

                          {/* Card */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <LeadTimelineCard
                              entry={entry}
                              isCurrent={isCurrent}
                              isDark={isDark}
                              accent={accent}
                              onOpenLead={onOpenLead}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* AI insight */}
              {entries.length > 0 && (
                <AIInsightBox entries={entries} entity={entity} isDark={isDark} />
              )}
            </div>
          )}
        </>
      )}

      {/* keyframe for skeleton pulse */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }`}</style>
    </div>
  );
}
