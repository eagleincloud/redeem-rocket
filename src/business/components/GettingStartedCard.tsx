import { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import { useTheme } from '@/app/context/ThemeContext';

const STEPS = [
  { id: 'business',  icon: '🏪', title: 'Business registered',       desc: 'Your business profile is set up on Redeem Rocket.',       path: null,        autoComplete: true  },
  { id: 'offer',     icon: '🏷️', title: 'Create your first offer',    desc: 'Attract customers with a discount or coupon.',             path: '/offers',   autoComplete: false },
  { id: 'lead',      icon: '👥', title: 'Add your first lead',        desc: 'Start tracking potential customers in your pipeline.',     path: '/leads',    autoComplete: false },
  { id: 'sender',    icon: '📧', title: 'Set up a sender identity',   desc: 'Add an email or WhatsApp number to send campaigns.',      path: '/outreach', autoComplete: false },
  { id: 'campaign',  icon: '📣', title: 'Launch your first campaign', desc: 'Send a message to your leads and watch conversions grow.', path: '/outreach', autoComplete: false },
];

const LS_DISMISSED  = 'rr_onboarding_dismissed';
const LS_DONE       = 'rr_onboarding_done';
const LS_COLLAPSED  = 'rr_onboarding_collapsed';

interface GettingStartedCardProps {
  completedSteps?: string[];
}

export function GettingStartedCard({ completedSteps = [] }: GettingStartedCardProps) {
  const { isDark } = useTheme();
  const navigate   = useNavigate();

  const [dismissed,  setDismissed]  = useState<boolean>(() => !!localStorage.getItem(LS_DISMISSED));
  const [collapsed,  setCollapsed]  = useState<boolean>(() => localStorage.getItem(LS_COLLAPSED) === 'true');
  const [manualDone, setManualDone] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS_DONE) || '[]'); }
    catch { return []; }
  });

  // Merge sources: autoComplete steps, prop completions, manual completions
  const doneSet = new Set<string>([
    ...STEPS.filter(s => s.autoComplete).map(s => s.id),
    ...completedSteps,
    ...manualDone,
  ]);

  const doneCount  = STEPS.filter(s => doneSet.has(s.id)).length;
  const totalCount = STEPS.length;
  const allDone    = doneCount === totalCount;
  const firstUncompleted = STEPS.find(s => !doneSet.has(s.id))?.id ?? null;

  useEffect(() => {
    if (dismissed) localStorage.setItem(LS_DISMISSED, '1');
  }, [dismissed]);

  useEffect(() => {
    localStorage.setItem(LS_COLLAPSED, String(collapsed));
  }, [collapsed]);

  const markDone = (id: string) => {
    const next = [...new Set([...manualDone, id])];
    setManualDone(next);
    localStorage.setItem(LS_DONE, JSON.stringify(next));
  };

  const handleDismiss = () => setDismissed(true);

  if (dismissed) return null;

  // ── colours ──────────────────────────────────────────────────────────────
  const cardBg     = isDark ? '#0d1f3c' : '#fff9f5';
  const borderCol  = '#f97316';
  const text       = isDark ? '#e2e8f0' : '#18100a';
  const textMuted  = isDark ? '#64748b' : '#9a7860';
  const trackBg    = isDark ? '#1e3a5f' : '#ffe8d6';
  const rowHoverBg = isDark ? '#112240' : '#fff1e8';

  return (
    <div
      style={{
        background:   cardBg,
        border:       `1px solid ${borderCol}`,
        borderRadius: 12,
        marginBottom: 24,
        overflow:     'hidden',
        fontFamily:   'inherit',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '14px 18px',
          cursor:         'pointer',
          userSelect:     'none',
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🚀</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: text }}>Getting Started</span>
          <span
            style={{
              background:   '#f97316',
              color:        '#fff',
              borderRadius: 20,
              fontSize:     11,
              fontWeight:   700,
              padding:      '1px 8px',
              lineHeight:   '18px',
            }}
          >
            {doneCount}/{totalCount}
          </span>
        </div>
        <button
          style={{
            background:   'none',
            border:       'none',
            cursor:       'pointer',
            color:        textMuted,
            fontSize:     18,
            lineHeight:   1,
            padding:      '0 4px',
            transform:    collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
            transition:   'transform 0.2s',
          }}
          aria-label={collapsed ? 'Expand' : 'Collapse'}
          onClick={e => { e.stopPropagation(); setCollapsed(c => !c); }}
        >
          ▾
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ padding: '0 18px 4px' }}>
        <div
          style={{
            background:   trackBg,
            borderRadius: 99,
            height:       6,
            overflow:     'hidden',
          }}
        >
          <div
            style={{
              background:   '#f97316',
              width:        `${(doneCount / totalCount) * 100}%`,
              height:       '100%',
              borderRadius: 99,
              transition:   'width 0.4s ease',
            }}
          />
        </div>
        <p style={{ fontSize: 11, color: textMuted, margin: '4px 0 0', textAlign: 'right' }}>
          {doneCount} of {totalCount} steps completed
        </p>
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div style={{ padding: '8px 0 0' }}>
          {allDone ? (
            /* Celebration state */
            <div
              style={{
                textAlign: 'center',
                padding:   '28px 18px',
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#22c55e', margin: '0 0 4px' }}>
                You&apos;re all set!
              </p>
              <p style={{ fontSize: 13, color: textMuted, margin: '0 0 16px' }}>
                Awesome work — your business is ready to grow on Redeem Rocket.
              </p>
              <button
                onClick={handleDismiss}
                style={{
                  background:   'none',
                  border:       `1px solid ${textMuted}`,
                  color:        textMuted,
                  borderRadius: 6,
                  padding:      '5px 14px',
                  fontSize:     12,
                  cursor:       'pointer',
                }}
              >
                Dismiss guide
              </button>
            </div>
          ) : (
            <>
              {STEPS.map(step => {
                const done   = doneSet.has(step.id);
                const active = !done && step.id === firstUncompleted;

                return (
                  <div
                    key={step.id}
                    style={{
                      display:    'flex',
                      alignItems: 'center',
                      gap:        12,
                      padding:    '10px 18px',
                      background: active ? rowHoverBg : 'transparent',
                      borderLeft: active ? `3px solid #f97316` : '3px solid transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    {/* Checkbox / tick */}
                    <div
                      style={{
                        width:          20,
                        height:         20,
                        borderRadius:   '50%',
                        border:         done ? 'none' : `2px solid ${textMuted}`,
                        background:     done ? '#22c55e' : 'transparent',
                        display:        'flex',
                        alignItems:     'center',
                        justifyContent: 'center',
                        flexShrink:     0,
                        cursor:         (!done && !step.autoComplete) ? 'pointer' : 'default',
                      }}
                      title={(!done && !step.autoComplete) ? 'Mark as done' : undefined}
                      onClick={() => { if (!done && !step.autoComplete) markDone(step.id); }}
                    >
                      {done && (
                        <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>
                      )}
                    </div>

                    {/* Icon */}
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{step.icon}</span>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          margin:     0,
                          fontWeight: 600,
                          fontSize:   13,
                          color:      done ? textMuted : text,
                          textDecoration: done ? 'line-through' : 'none',
                        }}
                      >
                        {step.title}
                      </p>
                      {!done && (
                        <p style={{ margin: '1px 0 0', fontSize: 11, color: textMuted }}>
                          {step.desc}
                        </p>
                      )}
                    </div>

                    {/* Go button */}
                    {!done && step.path && (
                      <button
                        onClick={() => navigate(step.path!)}
                        style={{
                          background:   '#f97316',
                          color:        '#fff',
                          border:       'none',
                          borderRadius: 6,
                          padding:      '4px 10px',
                          fontSize:     12,
                          fontWeight:   600,
                          cursor:       'pointer',
                          whiteSpace:   'nowrap',
                          flexShrink:   0,
                        }}
                      >
                        Go →
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Dismiss */}
              <div style={{ padding: '12px 18px 14px', textAlign: 'right' }}>
                <button
                  onClick={handleDismiss}
                  style={{
                    background:   'none',
                    border:       'none',
                    color:        textMuted,
                    fontSize:     12,
                    cursor:       'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Dismiss guide
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
