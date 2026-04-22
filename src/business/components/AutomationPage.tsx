import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/app/context/ThemeContext';
import { useBusinessContext } from '../context/BusinessContext';
import { useViewport } from '../hooks/useViewport';
import { supabase } from '@/app/lib/supabase';
import {
  Zap, Plus, Trash2, ToggleLeft, ToggleRight, ChevronDown,
  Mail, MessageSquare, Tag, ArrowRight, Clock, Bell, Users,
  Play, Pause, X, Sparkles, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TriggerType =
  | 'new_lead'
  | 'lead_stage_change'
  | 'lead_score_reach'
  | 'campaign_sent'
  | 'no_activity'
  | 'order_placed'
  | 'form_submitted';

type ActionType =
  | 'send_email'
  | 'send_whatsapp'
  | 'add_tag'
  | 'move_stage'
  | 'assign_member'
  | 'wait'
  | 'notify_owner'
  | 'add_to_campaign';

type ConditionType = 'lead_source' | 'lead_value_gt' | 'tag_contains';

interface TriggerConfig {
  stage?: string;
  score?: number;
  days?: number;
}

interface Condition {
  id: string;
  type: ConditionType;
  value: string;
}

interface Action {
  id: string;
  type: ActionType;
  config: Record<string, string>;
}

interface AutomationRule {
  id: string;
  business_id: string;
  name: string;
  trigger_type: TriggerType;
  trigger_config: TriggerConfig;
  conditions: Condition[];
  actions: Action[];
  is_active: boolean;
  runs?: number;
  created_at?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const TRIGGER_OPTIONS: { value: TriggerType; label: string }[] = [
  { value: 'new_lead', label: 'New lead added' },
  { value: 'lead_stage_change', label: 'Lead stage changes to...' },
  { value: 'lead_score_reach', label: 'Lead score reaches...' },
  { value: 'campaign_sent', label: 'Campaign sent' },
  { value: 'no_activity', label: 'No activity for N days' },
  { value: 'order_placed', label: 'Order placed' },
  { value: 'form_submitted', label: 'Form submitted' },
];

const ACTION_OPTIONS: { value: ActionType; label: string; icon: React.ReactNode }[] = [
  { value: 'send_email', label: 'Send email to lead', icon: <Mail size={14} /> },
  { value: 'send_whatsapp', label: 'Send WhatsApp message', icon: <MessageSquare size={14} /> },
  { value: 'add_tag', label: 'Add tag to lead', icon: <Tag size={14} /> },
  { value: 'move_stage', label: 'Move lead to stage', icon: <ArrowRight size={14} /> },
  { value: 'assign_member', label: 'Assign to team member', icon: <Users size={14} /> },
  { value: 'wait', label: 'Wait N hours/days', icon: <Clock size={14} /> },
  { value: 'notify_owner', label: 'Send notification to owner', icon: <Bell size={14} /> },
  { value: 'add_to_campaign', label: 'Add lead to campaign', icon: <Zap size={14} /> },
];

const CONDITION_OPTIONS: { value: ConditionType; label: string }[] = [
  { value: 'lead_source', label: 'Lead source is' },
  { value: 'lead_value_gt', label: 'Lead value >' },
  { value: 'tag_contains', label: 'Tag contains' },
];

const STAGE_OPTIONS = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome New Lead',
    description: 'Instantly greet every new lead with a warm welcome email.',
    icon: <Sparkles size={20} />,
    color: '#6366f1',
    gradient: 'radial-gradient(ellipse at top left, rgba(99,102,241,0.18) 0%, transparent 70%)',
    trigger_type: 'new_lead' as TriggerType,
    trigger_config: {},
    conditions: [],
    actions: [
      {
        id: 'a1',
        type: 'send_email' as ActionType,
        config: {
          subject: 'Welcome! We\'re glad you\'re here',
          body: 'Hi there! Thank you for reaching out. We\'re excited to connect with you and help you achieve your goals. Expect to hear from us shortly!',
        },
      },
    ],
  },
  {
    id: 'followup',
    name: 'Follow Up Reminder',
    description: 'Get notified when a lead goes quiet for 3 days.',
    icon: <Bell size={20} />,
    color: '#f97316',
    gradient: 'radial-gradient(ellipse at top left, rgba(249,115,22,0.18) 0%, transparent 70%)',
    trigger_type: 'no_activity' as TriggerType,
    trigger_config: { days: 3 },
    conditions: [],
    actions: [
      {
        id: 'a1',
        type: 'notify_owner' as ActionType,
        config: { message: 'A lead has had no activity for 3 days. Time to follow up!' },
      },
    ],
  },
  {
    id: 'winback',
    name: 'Win-Back',
    description: 'Re-engage lost leads with a compelling win-back email after 7 days.',
    icon: <CheckCircle2 size={20} />,
    color: '#10b981',
    gradient: 'radial-gradient(ellipse at top left, rgba(16,185,129,0.18) 0%, transparent 70%)',
    trigger_type: 'lead_stage_change' as TriggerType,
    trigger_config: { stage: 'Lost' },
    conditions: [],
    actions: [
      {
        id: 'a1',
        type: 'wait' as ActionType,
        config: { amount: '7', unit: 'days' },
      },
      {
        id: 'a2',
        type: 'send_email' as ActionType,
        config: {
          subject: 'We miss you — here\'s something special',
          body: 'Hi! We noticed things didn\'t work out last time, but we\'d love another chance. We\'ve prepared an exclusive offer just for you. Let\'s talk!',
        },
      },
    ],
  },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function triggerLabel(type: TriggerType, config: TriggerConfig): string {
  switch (type) {
    case 'new_lead': return 'New lead added';
    case 'lead_stage_change': return `Lead stage → ${config.stage ?? '?'}`;
    case 'lead_score_reach': return `Lead score ≥ ${config.score ?? '?'}`;
    case 'campaign_sent': return 'Campaign sent';
    case 'no_activity': return `No activity for ${config.days ?? '?'} days`;
    case 'order_placed': return 'Order placed';
    case 'form_submitted': return 'Form submitted';
    default: return type;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StyledSelect({
  value,
  onChange,
  options,
  isDark,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  isDark: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          width: '100%',
          padding: '8px 32px 8px 12px',
          borderRadius: 8,
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
          background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
          color: isDark ? '#f1f5f9' : '#111827',
          fontSize: 13,
          cursor: 'pointer',
          outline: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: isDark ? '#1f2937' : '#fff' }}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        style={{
          position: 'absolute',
          right: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          color: isDark ? '#6b7280' : '#9ca3af',
        }}
      />
    </div>
  );
}

function StyledInput({
  value,
  onChange,
  placeholder,
  isDark,
  type = 'text',
  style = {},
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isDark: boolean;
  type?: string;
  style?: React.CSSProperties;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
        background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
        color: isDark ? '#f1f5f9' : '#111827',
        fontSize: 13,
        outline: 'none',
        boxSizing: 'border-box',
        ...style,
      }}
    />
  );
}

function StyledTextarea({
  value,
  onChange,
  placeholder,
  isDark,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isDark: boolean;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: 8,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)'}`,
        background: isDark ? 'rgba(255,255,255,0.05)' : '#fff',
        color: isDark ? '#f1f5f9' : '#111827',
        fontSize: 13,
        outline: 'none',
        resize: 'vertical',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
      }}
    />
  );
}

// ─── Action Config Fields ──────────────────────────────────────────────────────

function ActionConfigFields({
  action,
  onUpdate,
  isDark,
}: {
  action: Action;
  onUpdate: (config: Record<string, string>) => void;
  isDark: boolean;
}) {
  const cfg = action.config;

  switch (action.type) {
    case 'send_email':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <StyledInput
            value={cfg.subject ?? ''}
            onChange={(v) => onUpdate({ ...cfg, subject: v })}
            placeholder="Email subject"
            isDark={isDark}
          />
          <StyledTextarea
            value={cfg.body ?? ''}
            onChange={(v) => onUpdate({ ...cfg, body: v })}
            placeholder="Email body"
            isDark={isDark}
          />
        </div>
      );
    case 'send_whatsapp':
      return (
        <StyledTextarea
          value={cfg.body ?? ''}
          onChange={(v) => onUpdate({ ...cfg, body: v })}
          placeholder="WhatsApp message"
          isDark={isDark}
        />
      );
    case 'add_tag':
      return (
        <StyledInput
          value={cfg.tag ?? ''}
          onChange={(v) => onUpdate({ ...cfg, tag: v })}
          placeholder="Tag name (e.g. hot-lead)"
          isDark={isDark}
        />
      );
    case 'move_stage':
      return (
        <StyledSelect
          value={cfg.stage ?? 'New'}
          onChange={(v) => onUpdate({ ...cfg, stage: v })}
          options={STAGE_OPTIONS.map((s) => ({ value: s, label: s }))}
          isDark={isDark}
        />
      );
    case 'assign_member':
      return (
        <StyledInput
          value={cfg.member ?? ''}
          onChange={(v) => onUpdate({ ...cfg, member: v })}
          placeholder="Team member name or email"
          isDark={isDark}
        />
      );
    case 'wait':
      return (
        <div style={{ display: 'flex', gap: 6 }}>
          <StyledInput
            value={cfg.amount ?? ''}
            onChange={(v) => onUpdate({ ...cfg, amount: v })}
            placeholder="Amount"
            isDark={isDark}
            type="number"
            style={{ flex: 1 }}
          />
          <StyledSelect
            value={cfg.unit ?? 'hours'}
            onChange={(v) => onUpdate({ ...cfg, unit: v })}
            options={[
              { value: 'hours', label: 'Hours' },
              { value: 'days', label: 'Days' },
            ]}
            isDark={isDark}
          />
        </div>
      );
    case 'notify_owner':
      return (
        <StyledInput
          value={cfg.message ?? ''}
          onChange={(v) => onUpdate({ ...cfg, message: v })}
          placeholder="Notification message"
          isDark={isDark}
        />
      );
    case 'add_to_campaign':
      return (
        <StyledInput
          value={cfg.campaign ?? ''}
          onChange={(v) => onUpdate({ ...cfg, campaign: v })}
          placeholder="Campaign name"
          isDark={isDark}
        />
      );
    default:
      return null;
  }
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AutomationPage() {
  const { isDark } = useTheme();
  const { bizUser } = useBusinessContext();
  const { isMobile } = useViewport();

  // Rules list
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);

  // Builder state
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState<TriggerType>('new_lead');
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>({});
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [actions, setActions] = useState<Action[]>([
    { id: uid(), type: 'send_email', config: {} },
  ]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Colors
  const bg = isDark ? '#0b1220' : '#f8fafc';
  const card = isDark ? '#111827' : '#ffffff';
  const border = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const text = isDark ? '#f1f5f9' : '#111827';
  const muted = isDark ? '#6b7280' : '#9ca3af';
  const accent = '#f97316';
  const primary = '#6366f1';

  // ── Fetch rules ──────────────────────────────────────────────────────────────

  const fetchRules = useCallback(async () => {
    if (!bizUser?.businessId) { setLoadingRules(false); return; }
    setLoadingRules(true);
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('business_id', bizUser.businessId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
    } else {
      setRules((data ?? []).map((r: AutomationRule) => ({ ...r, runs: r.runs ?? 0 })));
    }
    setLoadingRules(false);
  }, [bizUser?.businessId]);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  // ── Reset builder ────────────────────────────────────────────────────────────

  const resetBuilder = () => {
    setRuleName('');
    setTriggerType('new_lead');
    setTriggerConfig({});
    setConditions([]);
    setActions([{ id: uid(), type: 'send_email', config: {} }]);
    setIsActive(true);
  };

  // ── Apply template ───────────────────────────────────────────────────────────

  const applyTemplate = (tpl: typeof TEMPLATES[number]) => {
    setRuleName(tpl.name);
    setTriggerType(tpl.trigger_type);
    setTriggerConfig(tpl.trigger_config);
    setConditions(tpl.conditions.map((c) => ({ ...c, id: uid() })));
    setActions(tpl.actions.map((a) => ({ ...a, id: uid() })));
    setIsActive(true);
    toast.success(`Template "${tpl.name}" loaded`);
    // Scroll to builder
    document.getElementById('rule-builder')?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── Save rule ────────────────────────────────────────────────────────────────

  const saveRule = async () => {
    if (!ruleName.trim()) { toast.error('Please enter a rule name'); return; }
    if (actions.length === 0) { toast.error('Add at least one action'); return; }
    if (!bizUser?.businessId) { toast.error('No business found'); return; }
    setSaving(true);
    const payload = {
      business_id: bizUser.businessId,
      name: ruleName.trim(),
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      conditions,
      actions,
      is_active: isActive,
    };
    const { error } = await supabase.from('automation_rules').insert([payload]);
    setSaving(false);
    if (error) {
      toast.error('Failed to save rule');
      console.error(error);
    } else {
      toast.success('Automation rule saved!');
      resetBuilder();
      fetchRules();
    }
  };

  // ── Toggle rule active ───────────────────────────────────────────────────────

  const toggleRule = async (rule: AutomationRule) => {
    const { error } = await supabase
      .from('automation_rules')
      .update({ is_active: !rule.is_active })
      .eq('id', rule.id);
    if (error) {
      toast.error('Failed to update rule');
    } else {
      setRules((prev) =>
        prev.map((r) => r.id === rule.id ? { ...r, is_active: !r.is_active } : r)
      );
    }
  };

  // ── Delete rule ──────────────────────────────────────────────────────────────

  const deleteRule = async (id: string) => {
    const { error } = await supabase.from('automation_rules').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete rule');
    } else {
      setRules((prev) => prev.filter((r) => r.id !== id));
      toast.success('Rule deleted');
    }
  };

  // ── Condition helpers ────────────────────────────────────────────────────────

  const addCondition = () => {
    setConditions((prev) => [
      ...prev,
      { id: uid(), type: 'lead_source', value: '' },
    ]);
  };

  const removeCondition = (id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
  };

  const updateCondition = (id: string, patch: Partial<Condition>) => {
    setConditions((prev) => prev.map((c) => c.id === id ? { ...c, ...patch } : c));
  };

  // ── Action helpers ───────────────────────────────────────────────────────────

  const addAction = () => {
    setActions((prev) => [...prev, { id: uid(), type: 'send_email', config: {} }]);
  };

  const removeAction = (id: string) => {
    setActions((prev) => prev.filter((a) => a.id !== id));
  };

  const updateActionType = (id: string, type: ActionType) => {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, type, config: {} } : a));
  };

  const updateActionConfig = (id: string, config: Record<string, string>) => {
    setActions((prev) => prev.map((a) => a.id === id ? { ...a, config } : a));
  };

  // ── Trigger extra fields ─────────────────────────────────────────────────────

  const renderTriggerExtras = () => {
    switch (triggerType) {
      case 'lead_stage_change':
        return (
          <StyledSelect
            value={triggerConfig.stage ?? 'New'}
            onChange={(v) => setTriggerConfig((c) => ({ ...c, stage: v }))}
            options={STAGE_OPTIONS.map((s) => ({ value: s, label: s }))}
            isDark={isDark}
          />
        );
      case 'lead_score_reach':
        return (
          <StyledInput
            value={String(triggerConfig.score ?? '')}
            onChange={(v) => setTriggerConfig((c) => ({ ...c, score: Number(v) }))}
            placeholder="Minimum score (e.g. 80)"
            isDark={isDark}
            type="number"
          />
        );
      case 'no_activity':
        return (
          <StyledInput
            value={String(triggerConfig.days ?? '')}
            onChange={(v) => setTriggerConfig((c) => ({ ...c, days: Number(v) }))}
            placeholder="Number of days"
            isDark={isDark}
            type="number"
          />
        );
      default:
        return null;
    }
  };

  // ── Styles ───────────────────────────────────────────────────────────────────

  const sectionCard: React.CSSProperties = {
    background: card,
    border: `1px solid ${border}`,
    borderRadius: 16,
    padding: 24,
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: muted,
    marginBottom: 8,
  };

  const pill: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 10px',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
  };

  const iconBtn: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 8,
    border: `1px solid ${border}`,
    background: 'transparent',
    cursor: 'pointer',
    color: muted,
    transition: 'color 0.15s, background 0.15s',
  };

  const addBtn: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    borderRadius: 8,
    border: `1px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
    background: 'transparent',
    color: muted,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: '100vh',
        background: bg,
        color: text,
        padding: isMobile ? '16px' : '24px 32px',
        fontFamily: 'inherit',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: `linear-gradient(135deg, ${primary}, #818cf8)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Zap size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: isMobile ? 20 : 24, fontWeight: 700, color: text }}>
              Automation
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: muted }}>
              Build IF/THEN workflows to automate your business
            </p>
          </div>
        </div>

        <button
          onClick={() => document.getElementById('rule-builder')?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            borderRadius: 10,
            border: 'none',
            background: `linear-gradient(135deg, ${primary}, #818cf8)`,
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `0 4px 14px rgba(99,102,241,0.35)`,
          }}
        >
          <Plus size={16} />
          Create Rule
        </button>
      </div>

      {/* ── Templates ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ ...sectionLabel, marginBottom: 14 }}>Quick-Start Templates</p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: 16,
          }}
        >
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => applyTemplate(tpl)}
              style={{
                position: 'relative',
                background: card,
                backgroundImage: tpl.gradient,
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: '20px',
                textAlign: 'left',
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.15)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${tpl.color}22`,
                  border: `1px solid ${tpl.color}44`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: tpl.color,
                  marginBottom: 12,
                }}
              >
                {tpl.icon}
              </div>
              <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: text }}>
                {tpl.name}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: muted, lineHeight: 1.5 }}>
                {tpl.description}
              </p>
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  right: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: tpl.color,
                }}
              >
                Use template <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Main grid: Rules list + Builder ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* ── Active Rules ── */}
        <div>
          <p style={sectionLabel}>Active Rules ({rules.length})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loadingRules ? (
              <div
                style={{
                  ...sectionCard,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 40,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: `3px solid ${primary}`,
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              </div>
            ) : rules.length === 0 ? (
              <div
                style={{
                  ...sectionCard,
                  textAlign: 'center',
                  padding: '40px 24px',
                  background: isDark
                    ? 'radial-gradient(ellipse at center, rgba(99,102,241,0.06) 0%, transparent 70%), #111827'
                    : card,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: `${primary}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <Zap size={22} color={primary} />
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: text }}>
                  No automation rules yet
                </p>
                <p style={{ margin: 0, fontSize: 12, color: muted }}>
                  Use a template or build your first rule on the right
                </p>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    ...sectionCard,
                    padding: '16px 18px',
                    background: isDark
                      ? `radial-gradient(ellipse at top right, rgba(99,102,241,0.06) 0%, transparent 60%), ${card}`
                      : card,
                    transition: 'box-shadow 0.15s',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: text }}>
                          {rule.name}
                        </span>
                        <span
                          style={{
                            ...pill,
                            background: rule.is_active ? `${primary}20` : `${muted}18`,
                            color: rule.is_active ? primary : muted,
                          }}
                        >
                          {rule.is_active ? (
                            <><Play size={10} /> Active</>
                          ) : (
                            <><Pause size={10} /> Paused</>
                          )}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: 12, color: muted }}>
                        IF {triggerLabel(rule.trigger_type, rule.trigger_config)}
                      </p>
                      <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            ...pill,
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                            color: muted,
                          }}
                        >
                          <Zap size={10} />
                          {rule.actions?.length ?? 0} action{(rule.actions?.length ?? 0) !== 1 ? 's' : ''}
                        </span>
                        <span
                          style={{
                            ...pill,
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                            color: muted,
                          }}
                        >
                          <Play size={10} />
                          Runs: {rule.runs ?? 0}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleRule(rule)}
                        title={rule.is_active ? 'Pause rule' : 'Activate rule'}
                        style={{ ...iconBtn, color: rule.is_active ? primary : muted }}
                      >
                        {rule.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        title="Delete rule"
                        style={{ ...iconBtn }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = '#ef4444';
                          (e.currentTarget as HTMLButtonElement).style.background = '#ef444415';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.color = muted;
                          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Rule Builder ── */}
        <div id="rule-builder" style={{ ...sectionCard, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${primary}20`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={16} color={primary} />
            </div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: text }}>
              Rule Builder
            </h2>
          </div>

          {/* Rule Name + Active toggle */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <p style={{ ...sectionLabel, marginBottom: 6 }}>Rule Name</p>
              <StyledInput
                value={ruleName}
                onChange={setRuleName}
                placeholder="e.g. Welcome new leads"
                isDark={isDark}
              />
            </div>
            <div style={{ flexShrink: 0, marginTop: 22 }}>
              <button
                onClick={() => setIsActive((v) => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: `1px solid ${border}`,
                  background: isActive ? `${primary}15` : 'transparent',
                  color: isActive ? primary : muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {isActive ? 'Active' : 'Paused'}
              </button>
            </div>
          </div>

          {/* ── TRIGGER section ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: `${accent}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={12} color={accent} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: accent,
                }}
              >
                Trigger (IF)
              </span>
            </div>
            <div
              style={{
                background: isDark ? 'rgba(249,115,22,0.05)' : 'rgba(249,115,22,0.04)',
                border: `1px solid ${isDark ? 'rgba(249,115,22,0.2)' : 'rgba(249,115,22,0.15)'}`,
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <StyledSelect
                value={triggerType}
                onChange={(v) => {
                  setTriggerType(v as TriggerType);
                  setTriggerConfig({});
                }}
                options={TRIGGER_OPTIONS}
                isDark={isDark}
              />
              {renderTriggerExtras()}
            </div>
          </div>

          {/* ── CONDITIONS section ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertCircle size={12} color="#10b981" />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#10b981',
                }}
              >
                Conditions (AND — optional)
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conditions.map((cond) => (
                <div
                  key={cond.id}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    background: isDark ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.04)',
                    border: `1px solid ${isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.12)'}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <StyledSelect
                      value={cond.type}
                      onChange={(v) => updateCondition(cond.id, { type: v as ConditionType })}
                      options={CONDITION_OPTIONS}
                      isDark={isDark}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <StyledInput
                      value={cond.value}
                      onChange={(v) => updateCondition(cond.id, { value: v })}
                      placeholder="Value"
                      isDark={isDark}
                    />
                  </div>
                  <button
                    onClick={() => removeCondition(cond.id)}
                    style={{ ...iconBtn, border: 'none', padding: 4 }}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
              <button onClick={addCondition} style={addBtn}>
                <Plus size={13} />
                Add Condition
              </button>
            </div>
          </div>

          {/* ── ACTIONS section ── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: `${primary}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ArrowRight size={12} color={primary} />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: primary,
                }}
              >
                Actions (THEN)
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {actions.map((action, idx) => (
                <div
                  key={action.id}
                  style={{
                    background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)',
                    border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)'}`,
                    borderRadius: 12,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: `${primary}25`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color: primary,
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div style={{ flex: 1 }}>
                      <StyledSelect
                        value={action.type}
                        onChange={(v) => updateActionType(action.id, v as ActionType)}
                        options={ACTION_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                        isDark={isDark}
                      />
                    </div>
                    {actions.length > 1 && (
                      <button
                        onClick={() => removeAction(action.id)}
                        style={{ ...iconBtn, border: 'none', padding: 4, flexShrink: 0 }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <ActionConfigFields
                    action={action}
                    onUpdate={(cfg) => updateActionConfig(action.id, cfg)}
                    isDark={isDark}
                  />
                </div>
              ))}
              <button onClick={addAction} style={addBtn}>
                <Plus size={13} />
                Add Action
              </button>
            </div>
          </div>

          {/* ── Save ── */}
          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button
              onClick={saveRule}
              disabled={saving}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                background: saving
                  ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')
                  : `linear-gradient(135deg, ${primary}, #818cf8)`,
                color: saving ? muted : '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: saving ? 'none' : `0 4px 14px rgba(99,102,241,0.35)`,
                transition: 'all 0.15s',
              }}
            >
              {saving ? (
                <>
                  <div
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: `2px solid ${muted}`,
                      borderTopColor: 'transparent',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Save Rule
                </>
              )}
            </button>
            <button
              onClick={resetBuilder}
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                border: `1px solid ${border}`,
                background: 'transparent',
                color: muted,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
