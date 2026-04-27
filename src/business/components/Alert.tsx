import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

type AlertType = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

const COLORS: Record<AlertType, { bg: string; border: string; icon: string; text: string }> = {
  error: {
    bg: '#fee2e2',
    border: '#fecaca',
    icon: '#dc2626',
    text: '#7f1d1d',
  },
  success: {
    bg: '#dcfce7',
    border: '#bbf7d0',
    icon: '#16a34a',
    text: '#15803d',
  },
  warning: {
    bg: '#fef3c7',
    border: '#fde68a',
    icon: '#d97706',
    text: '#78350f',
  },
  info: {
    bg: '#dbeafe',
    border: '#bfdbfe',
    icon: '#2563eb',
    text: '#1e3a8a',
  },
};

const ICONS: Record<AlertType, React.ReactNode> = {
  error: <AlertCircle size={18} />,
  success: <CheckCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

export function Alert({
  type,
  title,
  message,
  onClose,
  action,
  dismissible = true,
}: AlertProps) {
  const colors = COLORS[type];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        borderRadius: '8px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        fontSize: '13px',
        lineHeight: '1.5',
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.icon,
        }}
      >
        {ICONS[type]}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ fontWeight: 600, marginBottom: '4px', color: colors.text }}>
            {title}
          </div>
        )}
        <div>{message}</div>

        {/* Action button */}
        {action && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={action.onClick}
              style={{
                background: 'transparent',
                border: `1px solid ${colors.border}`,
                borderRadius: '4px',
                padding: '4px 10px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 500,
                color: colors.text,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = colors.border;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }}
            >
              {action.label}
            </button>
          </div>
        )}
      </div>

      {/* Close button */}
      {dismissible && onClose && (
        <button
          onClick={onClose}
          style={{
            flexShrink: 0,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: colors.text,
            padding: '0',
            opacity: 0.6,
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.opacity = '0.6';
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

/**
 * Hook for managing alert state
 */
export function useAlert() {
  const [alerts, setAlerts] = React.useState<Array<AlertProps & { id: string }>>([]);

  const addAlert = React.useCallback(
    (alert: Omit<AlertProps, 'onClose'>, duration = 5000) => {
      const id = `${Date.now()}-${Math.random()}`;
      const newAlert = { ...alert, id, onClose: () => removeAlert(id) };

      setAlerts((prev) => [...prev, newAlert]);

      if (duration > 0) {
        setTimeout(() => removeAlert(id), duration);
      }

      return id;
    },
    []
  );

  const removeAlert = React.useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { alerts, addAlert, removeAlert };
}
