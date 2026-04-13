import { useState, useEffect, useRef } from 'react';
import { Clock, ChevronDown, ChevronUp, Link2, ExternalLink, X, Zap } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';
import {
  searchSimilarLeads, fetchLeadMiniTimeline,
  linkLeads,
  type LeadMatchResult, type LeadActivity,
} from '@/app/api/supabase-data';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  businessId: string;
  query: { name?: string; phone?: string; email?: string; company?: string };
  excludeId?: string;
  onViewLead: (leadId: string) => void;
  onLinkLead: (result: LeadMatchResult) => void;
}

// ── Stage / activity helpers ──────────────────────────────────────────────────

const STAGE_COLORS: Record<string, string> = {
  new: '#64748b', contacted: '#3b82f6', qualified: '#f59e0b',
  proposal: '#f97316', negotiation: '#a855f7', won: '#22c55e', lost: '#ef4444',
};

const ACTIVITY_ICONS: Record<string, string> = {
  note: '📝', call: '📞', email: '✉️', whatsapp: '💬', sms: '📱',
  meeting: '🤝', stage_change: '🔀', follow_up_set: '⏰', follow_up_done: '✅',
  proposal_sent: '📄', won: '🏆', lost: '❌',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30)  return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function confidenceColor(score: number): string {
  if (score >= 85) return '#22c55e';
  if (score >= 65) return '#f59e0b';
  return '#64748b';
}

// ── Mini Timeline ─────────────────────────────────────────────────────────────

function MiniTimeline({ leadId, border, muted, text }: {
  leadId: string; border: string; muted: string; text: string;
}) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeadMiniTimeline(leadId, 6).then(a => { setActivities(a); setLoading(false); });
  }, [leadId]);

  if (loading) return (
    <div style={{ padding: '8px 0', fontSize: 11, color: muted, textAlign: 'center' }}>
      Loading history…
    </div>
  );

  if (activities.length === 0) return (
    <div style={{ padding: '8px 0', fontSize: 11, color: muted, textAlign: 'center' }}>
      No recorded activities yet.
    </div>
  );

  return (
    <div style={{ paddingTop: 8 }}>
      {activities.map((a, i) => (
        <div key={a.id} style={{
          display: 'flex', gap: 8, paddingBottom: 8,
          borderLeft: i < activities.length - 1 ? `2px solid ${border}` : '2px solid transparent',
          marginLeft: 6, paddingLeft: 10, position: 'relative',
        }}>
          {/* dot */}
          <div style={{
            position: 'absolute', left: -5, top: 2,
            width: 8, height: 8, borderRadius: '50%',
            background: STAGE_COLORS[a.new_stage ?? ''] ?? '#64748b',
            border: `2px solid ${border}`, flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13 }}>{ACTIVITY_ICONS[a.type] ?? '•'}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: text }}>{a.title}</span>
              <span style={{ fontSize: 10, color: muted, marginLeft: 'auto', whiteSpace: 'nowrap' }}>
                {timeAgo(a.created_at)}
              </span>
            </div>
            {a.body && (
              <div style={{
                fontSize: 11, color: muted, marginTop: 2,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {a.body}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Match Card ────────────────────────────────────────────────────────────────

function MatchCard({
  result, businessId, border, card, text, muted, onViewLead, onLinkLead, onDismiss,
}: {
  result: LeadMatchResult; businessId: string;
  border: string; card: string; text: string; muted: string;
  onViewLead: (id: string) => void;
  onLinkLead: (r: LeadMatchResult) => void;
  onDismiss: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [linking, setLinking]   = useState(false);
  const { lead, confidence, matchReason, lastActivity, lastFollowUp } = result;
  const stageColor = STAGE_COLORS[lead.stage] ?? '#64748b';

  async function handleLink() {
    setLinking(true);
    await linkLeads(businessId, lead.id, lead.id, confidence, 'manual');
    onLinkLead(result);
    setLinking(false);
  }

  return (
    <div style={{
      background: card, borderRadius: 10,
      border: `1px solid ${border}`,
      overflow: 'hidden', marginBottom: 8,
    }}>
      {/* Card header */}
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
          {/* Confidence badge */}
          <div style={{
            background: `${confidenceColor(confidence)}22`,
            color: confidenceColor(confidence),
            borderRadius: 6, padding: '2px 7px',
            fontSize: 10, fontWeight: 700, flexShrink: 0,
            border: `1px solid ${confidenceColor(confidence)}44`,
          }}>
            {Math.round(confidence)}% {matchReason}
          </div>
          {/* Dismiss */}
          <button onClick={() => onDismiss(lead.id)} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', color: muted, padding: 2, lineHeight: 1,
          }}>
            <X size={12} />
          </button>
        </div>

        {/* Lead name + stage */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: text }}>{lead.name}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: stageColor,
            background: `${stageColor}18`, border: `1px solid ${stageColor}33`,
            borderRadius: 5, padding: '1px 7px', textTransform: 'capitalize',
          }}>
            {lead.stage}
          </span>
        </div>

        {/* Company + deal value */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {lead.company && (
            <span style={{ fontSize: 11, color: muted }}>{lead.company}</span>
          )}
          {lead.deal_value && (
            <span style={{ fontSize: 11, color: '#f97316', fontWeight: 600 }}>
              ₹{Number(lead.deal_value).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Last activity snippet */}
        {lastActivity && (
          <div style={{
            marginTop: 6, padding: '5px 8px',
            background: `${border}44`, borderRadius: 6,
            display: 'flex', gap: 6, alignItems: 'flex-start',
          }}>
            <Clock size={10} style={{ color: muted, flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 10, color: text, fontWeight: 600 }}>
                {ACTIVITY_ICONS[lastActivity.type]} {lastActivity.title}
              </span>
              <span style={{ fontSize: 10, color: muted, marginLeft: 6 }}>
                {timeAgo(lastActivity.created_at)}
              </span>
              {lastActivity.body && (
                <div style={{
                  fontSize: 10, color: muted, marginTop: 1,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {lastActivity.body}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Overdue follow-up warning */}
        {lastFollowUp && !lastFollowUp.completed && new Date(lastFollowUp.due_at) < new Date() && (
          <div style={{
            marginTop: 5, fontSize: 10, color: '#ef4444',
            background: '#ef444415', borderRadius: 5, padding: '3px 8px',
            border: '1px solid #ef444430',
          }}>
            ⚠️ Overdue follow-up: {lastFollowUp.title}
          </div>
        )}
      </div>

      {/* Expand / collapse timeline */}
      <button onClick={() => setExpanded(e => !e)} style={{
        width: '100%', padding: '6px 12px',
        background: 'none', border: 'none', borderTop: `1px solid ${border}`,
        cursor: 'pointer', color: muted, fontSize: 11,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Hide history' : 'Show full history'}
      </button>

      {/* Timeline */}
      {expanded && (
        <div style={{ padding: '0 12px 10px' }}>
          <MiniTimeline leadId={lead.id} border={border} muted={muted} text={text} />
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex', gap: 6, padding: '8px 12px',
        borderTop: `1px solid ${border}`,
        background: `${border}22`,
      }}>
        <button
          onClick={handleLink}
          disabled={linking}
          style={{
            flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700,
            background: '#f97316', color: '#fff', border: 'none',
            borderRadius: 6, cursor: linking ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            opacity: linking ? 0.6 : 1,
          }}
        >
          <Link2 size={11} />
          {linking ? 'Linking…' : 'Same Person'}
        </button>
        <button
          onClick={() => onViewLead(lead.id)}
          style={{
            flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700,
            background: 'transparent', color: '#3b82f6',
            border: '1px solid #3b82f633', borderRadius: 6, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
          }}
        >
          <ExternalLink size={11} />
          Open Lead
        </button>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function HistoricalMatchPanel({ businessId, query, excludeId, onViewLead, onLinkLead }: Props) {
  const { isDark } = useTheme();
  const [results,   setResults]   = useState<LeadMatchResult[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const card   = isDark ? '#0a1428' : '#f8f4f0';
  const border = isDark ? '#1c2a55' : '#e8d8cc';
  const text   = isDark ? '#e2e8f0' : '#18100a';
  const muted  = isDark ? '#64748b' : '#9a7860';

  const hasQuery = Boolean(
    (query.name?.trim()    && query.name.length > 2)   ||
    (query.phone?.trim()   && query.phone.length > 7)  ||
    (query.email?.trim()   && query.email.includes('@')) ||
    (query.company?.trim() && query.company.length > 2)
  );

  useEffect(() => {
    if (!hasQuery) { setResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const found = await searchSimilarLeads(businessId, query, excludeId);
      setResults(found);
      setLoading(false);
    }, 420);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [businessId, query.name, query.phone, query.email, query.company, excludeId]);

  const visible = results.filter(r => !dismissed.has(r.lead.id));

  if (!hasQuery) return null;

  return (
    <div style={{
      width: '100%',
      borderTop: `1px solid ${border}`,
      paddingTop: 12,
      marginTop: 4,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 10,
      }}>
        <div style={{
          background: '#f9731620', border: '1px solid #f9731640',
          borderRadius: 6, padding: '2px 8px',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          <Zap size={11} color="#f97316" />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f97316' }}>
            AI Match
          </span>
        </div>
        {loading ? (
          <span style={{ fontSize: 11, color: muted }}>Searching history…</span>
        ) : (
          <span style={{ fontSize: 11, color: muted }}>
            {visible.length > 0
              ? `${visible.length} historical match${visible.length > 1 ? 'es' : ''} found`
              : 'No similar records found'}
          </span>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div style={{
          height: 60, borderRadius: 10, border: `1px solid ${border}`,
          background: `${border}44`, animation: 'pulse 1.5s infinite',
        }} />
      )}

      {/* Match cards */}
      {!loading && visible.map(result => (
        <MatchCard
          key={result.lead.id}
          result={result}
          businessId={businessId}
          border={border}
          card={card}
          text={text}
          muted={muted}
          onViewLead={onViewLead}
          onLinkLead={r => { setDismissed(d => new Set([...d, r.lead.id])); onLinkLead(r); }}
          onDismiss={id => setDismissed(d => new Set([...d, id]))}
        />
      ))}

      {!loading && visible.length === 0 && hasQuery && (
        <div style={{
          textAlign: 'center', padding: '12px 0',
          fontSize: 11, color: muted,
        }}>
          ✓ No duplicate records — this appears to be a new contact.
        </div>
      )}
    </div>
  );
}
