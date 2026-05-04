import React, { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'lead_created' | 'deal_won' | 'email_sent' | 'status_changed' | 'note_added' | 'meeting_scheduled';
  title: string;
  description: string;
  timestamp: string;
  icon: ReactNode;
  iconColor?: string;
  actionLabel?: string;
  actionUrl?: string;
}

interface RecentActivityListProps {
  activities: ActivityItem[];
  onActivityClick?: (activity: ActivityItem) => void;
  maxItems?: number;
  className?: string;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({
  activities,
  onActivityClick,
  maxItems = 6,
  className = '',
}) => {
  const displayActivities = activities.slice(0, maxItems);

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'lead_created':
        return '#3B82F6'; // blue
      case 'deal_won':
        return '#10B981'; // green
      case 'email_sent':
        return '#8B5CF6'; // purple
      case 'status_changed':
        return '#F59E0B'; // orange
      case 'note_added':
        return '#6B7280'; // gray
      case 'meeting_scheduled':
        return '#EC4899'; // pink
      default:
        return '#6B7280';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }} className={className}>
      {displayActivities.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-16)',
            textAlign: 'center',
            color: 'var(--color-text-secondary)',
          }}
        >
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>No recent activity</p>
        </div>
      ) : (
        displayActivities.map((activity, index) => (
          <div
            key={activity.id}
            onClick={() => onActivityClick?.(activity)}
            style={{
              display: 'flex',
              gap: 'var(--space-12)',
              padding: 'var(--space-12)',
              borderBottom:
                index < displayActivities.length - 1
                  ? '1px solid rgba(255, 255, 255, 0.05)'
                  : 'none',
              cursor: onActivityClick ? 'pointer' : 'default',
              transition: 'background-color var(--transition-base)',
            }}
            onMouseEnter={(e) => {
              if (onActivityClick) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            {/* Timeline dot and line */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
                marginTop: 'var(--space-2)',
              }}
            >
              <div
                style={{
                  width: 'var(--space-8)',
                  height: 'var(--space-8)',
                  borderRadius: '50%',
                  background: activity.iconColor || getActivityColor(activity.type),
                  border: '2px solid var(--color-dark-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 'var(--font-size-xs)',
                }}
              >
                {activity.icon}
              </div>
              {index < displayActivities.length - 1 && (
                <div
                  style={{
                    width: '2px',
                    height: 'var(--space-12)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    marginTop: 'var(--space-2)',
                  }}
                />
              )}
            </div>

            {/* Activity content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)', justifyContent: 'space-between' }}>
                <h4
                  style={{
                    margin: 0,
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {activity.title}
                </h4>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {activity.timestamp}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 1.5,
                }}
              >
                {activity.description}
              </p>
              {activity.actionLabel && activity.actionUrl && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <a
                    href={activity.actionUrl}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-primary-400)',
                      textDecoration: 'none',
                      fontWeight: 'var(--font-weight-semibold)',
                      transition: 'color var(--transition-base)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-primary-300)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--color-primary-400)';
                    }}
                  >
                    {activity.actionLabel}
                    <ArrowRight style={{ width: 'var(--space-3)', height: 'var(--space-3)' }} />
                  </a>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
