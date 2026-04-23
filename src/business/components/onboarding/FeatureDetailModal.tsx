import { X, Check } from 'lucide-react';
import type { Feature } from './FeatureShowcasePhase';

interface FeatureDetailModalProps {
  feature: Feature;
  isOpen: boolean;
  onClose: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

export function FeatureDetailModal({
  feature,
  isOpen,
  onClose,
  onSelect,
  isSelected,
}: FeatureDetailModalProps) {
  if (!isOpen) return null;

  const colors = {
    bg: '#0a0e27',
    card: '#111827',
    border: '#1f2937',
    text: '#ffffff',
    textMuted: '#9ca3af',
    accent: '#ff4400',
    success: '#10b981',
    overlay: 'rgba(0, 0, 0, 0.7)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: colors.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.card,
          border: `1px solid ${colors.border}`,
          borderRadius: '16px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          animation: 'modalSlideIn 0.3s ease-out',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header with Close Button */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '24px',
            borderBottom: `1px solid ${colors.border}`,
            position: 'sticky',
            top: 0,
            background: colors.card,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: `${colors.accent}20`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.accent,
                  fontSize: '24px',
                }}
              >
                {feature.icon}
              </div>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: 0,
                }}
              >
                {feature.name}
              </h2>
            </div>
            <span
              style={{
                fontSize: '12px',
                color: colors.textMuted,
                background: `${colors.accent}20`,
                padding: '4px 8px',
                borderRadius: '4px',
                display: 'inline-block',
              }}
            >
              {feature.category}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = colors.text;
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = colors.textMuted;
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Overview */}
          <section style={{ marginBottom: '28px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: colors.textMuted,
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Overview
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              {feature.description}
            </p>
          </section>

          {/* Use Case */}
          <section style={{ marginBottom: '28px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: colors.textMuted,
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              How It Works
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: colors.text,
                lineHeight: '1.6',
                margin: 0,
              }}
            >
              {feature.useCase}
            </p>
          </section>

          {/* ROI Benefit */}
          <section style={{ marginBottom: '28px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: colors.textMuted,
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Impact
            </h3>
            <div
              style={{
                background: `${colors.success}15`,
                border: `1px solid ${colors.success}40`,
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '15px',
                color: colors.success,
                fontWeight: 600,
              }}
            >
              {feature.roiMetric}
            </div>
          </section>

          {/* Available Templates */}
          <section style={{ marginBottom: '28px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: colors.textMuted,
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Available Templates
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {feature.templates.map((template, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 0',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      background: colors.accent,
                      borderRadius: '50%',
                    }}
                  />
                  <span style={{ fontSize: '14px', color: colors.text }}>
                    {template}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Best For */}
          <section style={{ marginBottom: '28px' }}>
            <h3
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: colors.textMuted,
                margin: '0 0 12px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Best For
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {feature.businessTypes.map((type, idx) => (
                <span
                  key={idx}
                  style={{
                    background: `${colors.accent}20`,
                    color: colors.accent,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {type}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Footer with Action Button */}
        <div
          style={{
            padding: '24px',
            borderTop: `1px solid ${colors.border}`,
            background: colors.card,
            position: 'sticky',
            bottom: 0,
            display: 'flex',
            gap: '12px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: `1px solid ${colors.border}`,
              color: colors.textMuted,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.text;
              el.style.color = colors.text;
            }}
            onMouseLeave={e => {
              const el = e.target as HTMLElement;
              el.style.borderColor = colors.border;
              el.style.color = colors.textMuted;
            }}
          >
            Close
          </button>
          <button
            onClick={onSelect}
            style={{
              flex: 1,
              padding: '12px',
              background: isSelected ? colors.success : colors.accent,
              border: 'none',
              color: 'white',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={e => {
              const el = e.target as HTMLElement;
              el.style.opacity = '0.9';
            }}
            onMouseLeave={e => {
              const el = e.target as HTMLElement;
              el.style.opacity = '1';
            }}
          >
            {isSelected ? (
              <>
                <Check size={16} />
                Selected
              </>
            ) : (
              'Select Feature'
            )}
          </button>
        </div>

        <style>{`
          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
