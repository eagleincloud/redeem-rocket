import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/app/context/ThemeContext';

type Position = 'top' | 'bottom' | 'left' | 'right';

interface HintTooltipProps {
  hint: string;
  title?: string;
  position?: Position;
  size?: number;
}

export function HintTooltip({ hint, title, position = 'top', size = 14 }: HintTooltipProps) {
  const { isDark } = useTheme();
  const [open, setOpen]     = useState(false);
  const containerRef        = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const popoverBg = isDark ? '#1e293b' : '#1f2937';

  // ── Arrow styles per position ─────────────────────────────────────────────
  const ARROW_SIZE = 6;

  const arrowBase: React.CSSProperties = {
    position:    'absolute',
    width:       0,
    height:      0,
    border:      `${ARROW_SIZE}px solid transparent`,
  };

  const arrowStyles: Record<Position, React.CSSProperties> = {
    top: {
      ...arrowBase,
      bottom:      -ARROW_SIZE * 2,
      left:        '50%',
      transform:   'translateX(-50%)',
      borderTopColor:    popoverBg,
      borderBottomWidth: 0,
    },
    bottom: {
      ...arrowBase,
      top:         -ARROW_SIZE * 2,
      left:        '50%',
      transform:   'translateX(-50%)',
      borderBottomColor: popoverBg,
      borderTopWidth:    0,
    },
    left: {
      ...arrowBase,
      right:       -ARROW_SIZE * 2,
      top:         '50%',
      transform:   'translateY(-50%)',
      borderLeftColor:   popoverBg,
      borderRightWidth:  0,
    },
    right: {
      ...arrowBase,
      left:        -ARROW_SIZE * 2,
      top:         '50%',
      transform:   'translateY(-50%)',
      borderRightColor:  popoverBg,
      borderLeftWidth:   0,
    },
  };

  // ── Popover placement ─────────────────────────────────────────────────────
  const GAP = ARROW_SIZE * 2 + 4;

  const popoverPlacement: Record<Position, React.CSSProperties> = {
    top:    { bottom: `calc(100% + ${GAP}px)`, left: '50%', transform: 'translateX(-50%)' },
    bottom: { top:    `calc(100% + ${GAP}px)`, left: '50%', transform: 'translateX(-50%)' },
    left:   { right:  `calc(100% + ${GAP}px)`, top:  '50%', transform: 'translateY(-50%)' },
    right:  { left:   `calc(100% + ${GAP}px)`, top:  '50%', transform: 'translateY(-50%)' },
  };

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
    >
      {/* ── Trigger button ── */}
      <button
        type="button"
        aria-label="Show hint"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
        style={{
          width:          size,
          height:         size,
          minWidth:       size,
          minHeight:      size,
          borderRadius:   '50%',
          background:     '#f97316',
          color:          '#fff',
          border:         'none',
          cursor:         'pointer',
          fontSize:       10,
          fontWeight:     800,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          lineHeight:     1,
          padding:        0,
          flexShrink:     0,
        }}
      >
        ?
      </button>

      {/* ── Popover ── */}
      {open && (
        <div
          role="tooltip"
          style={{
            position:     'absolute',
            ...popoverPlacement[position],
            zIndex:       9999,
            background:   popoverBg,
            color:        '#fff',
            borderRadius: 8,
            padding:      '10px 13px',
            fontSize:     12,
            maxWidth:     220,
            width:        'max-content',
            boxShadow:    '0 8px 24px rgba(0,0,0,0.3)',
            lineHeight:   1.5,
            pointerEvents: 'none',
          }}
        >
          {title && (
            <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 13 }}>{title}</p>
          )}
          <p style={{ margin: 0 }}>{hint}</p>

          {/* Arrow */}
          <div style={arrowStyles[position]} />
        </div>
      )}
    </div>
  );
}
