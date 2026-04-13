import { useState } from 'react';
import { Plus, Play, Pause, Eye, ChevronRight, Zap, Clock, Send, GitBranch, CheckCircle, X } from 'lucide-react';
import { useTheme } from '@/app/context/ThemeContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workflow {
  id: string;
  name: string;
  trigger: string;
  steps: number;
  active: boolean;
  leads_enrolled: number;
  last_run: string;
}

type StepType = 'trigger' | 'wait' | 'send' | 'condition' | 'action';

interface WorkflowStep {
  type: StepType;
  label: string;
  detail: string;
}

type TriggerOption =
  | 'Lead added'
  | 'Lead inactive 30 days'
  | 'Stage changed'
  | 'Proposal sent'
  | 'Follow-up overdue';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACCENT = '#f97316';

const MOCK_WORKFLOWS: Workflow[] = [
  { id: 'w1', name: 'New Lead Welcome',      trigger: 'Lead added',             steps: 3, active: true,  leads_enrolled: 47, last_run: '2h ago' },
  { id: 'w2', name: '30-Day Re-engagement',  trigger: 'Lead inactive 30 days',  steps: 4, active: true,  leads_enrolled: 12, last_run: '1d ago' },
  { id: 'w3', name: 'Proposal Follow-up',    trigger: 'Proposal sent',          steps: 2, active: false, leads_enrolled: 0,  last_run: 'Never'  },
  { id: 'w4', name: 'Won → Upsell',          trigger: 'Stage = Won',            steps: 3, active: true,  leads_enrolled: 8,  last_run: '3h ago' },
];

const WORKFLOW_STEPS: Record<string, WorkflowStep[]> = {
  w1: [
    { type: 'trigger',   label: 'Lead added',              detail: 'Fires when a new lead is created' },
    { type: 'wait',      label: 'Wait 30 minutes',         detail: 'Delay before first outreach' },
    { type: 'send',      label: 'Send WhatsApp',           detail: 'Welcome message with business name' },
    { type: 'action',    label: 'Log activity',            detail: '"Welcome sent" logged on lead' },
  ],
  w2: [
    { type: 'trigger',   label: 'Lead inactive 30 days',   detail: 'No activity for 30 days' },
    { type: 'send',      label: 'Send Email',              detail: 'Re-engagement email with offer' },
    { type: 'wait',      label: 'Wait 3 days',             detail: 'Monitor for response' },
    { type: 'condition', label: 'Opened email?',           detail: 'Branch: Yes → Call / No → SMS' },
    { type: 'send',      label: 'Send SMS',                detail: 'Final nudge SMS' },
  ],
  w3: [
    { type: 'trigger',   label: 'Proposal sent',           detail: 'Stage changed to Proposal' },
    { type: 'wait',      label: 'Wait 2 days',             detail: 'Give time to review' },
    { type: 'send',      label: 'Send WhatsApp',           detail: 'Follow-up: "Did you get a chance to review?"' },
  ],
  w4: [
    { type: 'trigger',   label: 'Stage = Won',             detail: 'Lead marked as Won' },
    { type: 'action',    label: 'Create invoice',          detail: 'Auto-create invoice draft' },
    { type: 'wait',      label: 'Wait 14 days',            detail: 'Post-purchase cooldown' },
    { type: 'send',      label: 'Send Email',              detail: 'Upsell offer email' },
  ],
};

const TRIGGER_OPTIONS: TriggerOption[] = [
  'Lead added',
  'Lead inactive 30 days',
  'Stage changed',
  'Proposal sent',
  'Follow-up overdue',
];

const STEP_COLORS: Record<StepType, { bg: string; border: string; label: string }> = {
  trigger:   { bg: '#1d4ed822', border: '#3b82f6', label: 'TRIGGER' },
  wait:      { bg: '#37415122', border: '#6b7280', label: 'WAIT' },
  send:      { bg: '#f9731622', border: '#f97316', label: 'SEND' },
  condition: { bg: '#a855f722', border: '#a855f7', label: 'CONDITION' },
  action:    { bg: '#22c55e22', border: '#22c55e', label: 'ACTION' },
};

const STEP_ICONS: Record<StepType, React.ReactNode> = {
  trigger:   <Zap size={12} />,
  wait:      <Clock size={12} />,
  send:      <Send size={12} />,
  condition: <GitBranch size={12} />,
  action:    <CheckCircle size={12} />,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StepBoxProps {
  step: WorkflowStep;
  isDark: boolean;
  isLast: boolean;
}

function StepBox({ step, isDark, isLast }: StepBoxProps) {
  const colors = STEP_COLORS[step.type];
  const text = isDark ? '#e6edf3' : '#1f2937';
  const subtle = isDark ? '#8b949e' : '#6b7280';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        backgroundColor: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: 8,
        padding: '8px 14px',
        width: '100%',
        maxWidth: 320,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}>
        <span style={{ color: colors.border, flexShrink: 0, marginTop: 1 }}>
          {STEP_ICONS[step.type]}
        </span>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: colors.border,
              backgroundColor: colors.bg, border: `1px solid ${colors.border}`,
              borderRadius: 3, padding: '1px 5px', letterSpacing: '0.05em',
            }}>
              {colors.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: text }}>{step.label}</span>
          </div>
          <span style={{ fontSize: 11, color: subtle }}>{step.detail}</span>
        </div>
      </div>
      {!isLast && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '4px 0' }}>
          <div style={{ width: 2, height: 10, backgroundColor: isDark ? '#30363d' : '#d1d5db' }} />
          <ChevronRight size={14} color={isDark ? '#30363d' : '#d1d5db'} style={{ transform: 'rotate(90deg)' }} />
        </div>
      )}
    </div>
  );
}

interface WorkflowRowProps {
  workflow: Workflow;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleActive: () => void;
  isDark: boolean;
  text: string;
  subtle: string;
  border: string;
  rowBg: string;
}

function WorkflowRow({ workflow, isExpanded, onToggleExpand, onToggleActive, isDark, text, subtle, border, rowBg }: WorkflowRowProps) {
  const steps = WORKFLOW_STEPS[workflow.id] ?? [];

  return (
    <div style={{ border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden' }}>
      {/* Row */}
      <div style={{
        backgroundColor: rowBg,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        {/* Toggle */}
        <button
          onClick={onToggleActive}
          title={workflow.active ? 'Pause workflow' : 'Activate workflow'}
          style={{
            width: 32, height: 18, borderRadius: 999, border: 'none', cursor: 'pointer',
            backgroundColor: workflow.active ? '#22c55e' : (isDark ? '#30363d' : '#d1d5db'),
            position: 'relative', flexShrink: 0, transition: 'background-color 0.2s',
            padding: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 2,
            left: workflow.active ? 16 : 2,
            width: 14, height: 14, borderRadius: '50%',
            backgroundColor: '#fff',
            transition: 'left 0.2s',
            display: 'block',
          }} />
        </button>

        {/* Name + trigger */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {workflow.name}
          </div>
          <div style={{ fontSize: 11, color: subtle, marginTop: 1 }}>
            Trigger: {workflow.trigger}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{
            backgroundColor: ACCENT + '22', color: ACCENT,
            border: `1px solid ${ACCENT}55`, borderRadius: 999,
            padding: '2px 8px', fontSize: 11, fontWeight: 600,
          }}>
            {workflow.steps} steps
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: text }}>{workflow.leads_enrolled} enrolled</div>
            <div style={{ fontSize: 10, color: subtle }}>Last: {workflow.last_run}</div>
          </div>
        </div>

        {/* View button */}
        <button
          onClick={onToggleExpand}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '5px 12px', borderRadius: 7, border: `1px solid ${border}`,
            backgroundColor: 'transparent', color: text, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Eye size={12} />
          {isExpanded ? 'Hide' : 'View'}
        </button>
      </div>

      {/* Expanded flow */}
      {isExpanded && (
        <div style={{
          backgroundColor: isDark ? '#0d1117' : '#f9fafb',
          borderTop: `1px solid ${border}`,
          padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: subtle, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Flow Diagram
            </span>
            <button
              onClick={() => alert('Workflow editor coming soon')}
              style={{
                padding: '4px 12px', borderRadius: 6,
                border: `1px solid ${ACCENT}`, backgroundColor: ACCENT + '15',
                color: ACCENT, fontSize: 12, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Edit
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0, paddingLeft: 8 }}>
            {steps.map((step, i) => (
              <StepBox key={i} step={step} isDark={isDark} isLast={i === steps.length - 1} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── New Workflow Modal ───────────────────────────────────────────────────────

interface NewWorkflowModalProps {
  onClose: () => void;
  onSave: (name: string, trigger: TriggerOption) => void;
  isDark: boolean;
  text: string;
  subtle: string;
  border: string;
}

function NewWorkflowModal({ onClose, onSave, isDark, text, subtle, border }: NewWorkflowModalProps) {
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<TriggerOption>('Lead added');
  const bg = isDark ? '#161b22' : '#ffffff';
  const inputBg = isDark ? '#0d1117' : '#f9fafb';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), trigger);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: bg, borderRadius: 12,
          border: `1px solid ${border}`, width: '100%', maxWidth: 420,
          padding: '20px 22px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: text }}>New Workflow</span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: subtle, padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: subtle, display: 'block', marginBottom: 6 }}>
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. New Lead Welcome"
              required
              style={{
                width: '100%', padding: '9px 12px',
                backgroundColor: inputBg, border: `1px solid ${border}`,
                borderRadius: 8, color: text, fontSize: 13,
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Trigger */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: subtle, display: 'block', marginBottom: 6 }}>
              Trigger
            </label>
            <select
              value={trigger}
              onChange={e => setTrigger(e.target.value as TriggerOption)}
              style={{
                width: '100%', padding: '9px 12px',
                backgroundColor: inputBg, border: `1px solid ${border}`,
                borderRadius: 8, color: text, fontSize: 13,
                outline: 'none', cursor: 'pointer', appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 10px center',
                paddingRight: 32,
              }}
            >
              {TRIGGER_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: '9px', borderRadius: 8,
                border: `1px solid ${border}`, backgroundColor: 'transparent',
                color: text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1, padding: '9px', borderRadius: 8,
                border: 'none', backgroundColor: ACCENT,
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Create Workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function MarketingAutomationPanel() {
  const { isDark } = useTheme();
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const bg    = isDark ? '#161b22' : '#ffffff';
  const text  = isDark ? '#e6edf3' : '#1f2937';
  const subtle = isDark ? '#8b949e' : '#6b7280';
  const border = isDark ? '#30363d' : '#e5e7eb';
  const rowBg  = isDark ? '#0d1117' : '#f9fafb';

  const handleToggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleToggleActive = (id: string) => {
    setWorkflows(prev =>
      prev.map(w => w.id === id ? { ...w, active: !w.active } : w),
    );
  };

  const handleAddWorkflow = (name: string, trigger: TriggerOption) => {
    const newWorkflow: Workflow = {
      id: `w${Date.now()}`,
      name,
      trigger,
      steps: 1,
      active: false,
      leads_enrolled: 0,
      last_run: 'Never',
    };
    setWorkflows(prev => [...prev, newWorkflow]);
  };

  const activeCount   = workflows.filter(w => w.active).length;
  const enrolledTotal = workflows.reduce((sum, w) => sum + w.leads_enrolled, 0);

  return (
    <div style={{
      backgroundColor: bg,
      color: text,
      borderRadius: 14,
      border: `1px solid ${border}`,
      overflow: 'hidden',
      fontFamily: 'inherit',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px',
        borderBottom: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: text }}>Automation Workflows</h3>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: subtle }}>
            {activeCount} active · {enrolledTotal} leads enrolled
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8, border: 'none',
            backgroundColor: ACCENT, color: '#fff', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <Plus size={14} />
          New Workflow
        </button>
      </div>

      {/* ── Stats bar ── */}
      <div style={{
        display: 'flex', borderBottom: `1px solid ${border}`,
      }}>
        {[
          { label: 'Total',    value: workflows.length },
          { label: 'Active',   value: activeCount },
          { label: 'Enrolled', value: enrolledTotal },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              flex: 1, padding: '10px 0', textAlign: 'center',
              borderRight: i < 2 ? `1px solid ${border}` : 'none',
              backgroundColor: isDark ? '#0d1117' : '#f9fafb',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: ACCENT }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: subtle }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Workflow list ── */}
      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {workflows.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '40px 20px',
            color: subtle, fontSize: 13,
          }}>
            <Zap size={32} style={{ margin: '0 auto 10px', opacity: 0.3, display: 'block' }} />
            No workflows yet. Create your first automation above.
          </div>
        ) : (
          workflows.map(workflow => (
            <WorkflowRow
              key={workflow.id}
              workflow={workflow}
              isExpanded={expandedId === workflow.id}
              onToggleExpand={() => handleToggleExpand(workflow.id)}
              onToggleActive={() => handleToggleActive(workflow.id)}
              isDark={isDark}
              text={text}
              subtle={subtle}
              border={border}
              rowBg={rowBg}
            />
          ))
        )}
      </div>

      {/* ── New Workflow Modal ── */}
      {showModal && (
        <NewWorkflowModal
          onClose={() => setShowModal(false)}
          onSave={handleAddWorkflow}
          isDark={isDark}
          text={text}
          subtle={subtle}
          border={border}
        />
      )}
    </div>
  );
}
