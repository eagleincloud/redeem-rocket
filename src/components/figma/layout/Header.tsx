import React, { ReactNode } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  action,
  breadcrumbs,
  className = '',
}) => {
  return (
    <header
      style={{
        padding: 'var(--space-20)',
        background: 'var(--color-dark-bg)',
        borderBottom: '1px solid var(--color-dark-border)',
        marginLeft: '16rem',
      }}
      className={className}
    >
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-8)' }}>
          <ol
            style={{
              display: 'flex',
              gap: 'var(--space-4)',
              listStyle: 'none',
              padding: 0,
              margin: 0,
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {breadcrumbs.map((crumb, index) => (
              <li key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    style={{
                      color: 'var(--color-primary-400)',
                      textDecoration: 'none',
                    }}
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span style={{ color: 'var(--color-text-secondary)' }}>
                    {crumb.label}
                  </span>
                )}
                {index < breadcrumbs.length - 1 && (
                  <span style={{ color: 'var(--color-text-tertiary)' }}>/</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Title and Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 'var(--space-16)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-3xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
              margin: 0,
              marginBottom: subtitle ? 'var(--space-4)' : 0,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                fontSize: 'var(--font-size-base)',
                color: 'var(--color-text-secondary)',
                margin: 0,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </header>
  );
};
