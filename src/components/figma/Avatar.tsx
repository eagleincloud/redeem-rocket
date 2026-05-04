import React from 'react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  initials?: string;
  className?: string;
  status?: 'online' | 'offline' | 'away';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'User avatar',
  name,
  size = 'md',
  initials,
  className = '',
  status,
}) => {
  const sizeMap = {
    sm: { width: '2rem', height: '2rem', fontSize: 'var(--font-size-xs)' },
    md: { width: '2.5rem', height: '2.5rem', fontSize: 'var(--font-size-sm)' },
    lg: { width: '3rem', height: '3rem', fontSize: 'var(--font-size-base)' },
    xl: { width: '4rem', height: '4rem', fontSize: 'var(--font-size-lg)' },
  };

  const sizeStyle = sizeMap[size];

  // Generate initials from name if not provided
  const displayInitials =
    initials ||
    (name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'U');

  const statusColorMap = {
    online: 'var(--color-accent-500)',
    offline: 'var(--color-gray-500)',
    away: 'var(--color-warning-500)',
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      className={className}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          style={{
            ...sizeStyle,
            borderRadius: 'var(--radius-full)',
            objectFit: 'cover',
            border: '2px solid var(--color-dark-border)',
          }}
        />
      ) : (
        <div
          style={{
            ...sizeStyle,
            borderRadius: 'var(--radius-full)',
            background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-secondary-600) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'var(--font-weight-semibold)',
            border: '2px solid var(--color-dark-border)',
          }}
        >
          {displayInitials}
        </div>
      )}

      {status && (
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '25%',
            height: '25%',
            borderRadius: 'var(--radius-full)',
            backgroundColor: statusColorMap[status],
            border: '2px solid var(--color-dark-bg)',
          }}
        />
      )}
    </div>
  );
};
