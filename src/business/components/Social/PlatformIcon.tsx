import React from 'react';

interface PlatformIconProps {
  platform: 'twitter' | 'facebook' | 'linkedin' | 'instagram' | 'tiktok';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const platformColors: Record<string, { bg: string; icon: string }> = {
  twitter: { bg: '#1DA1F2', icon: '𝕏' },
  facebook: { bg: '#1877F2', icon: 'f' },
  linkedin: { bg: '#0A66C2', icon: 'in' },
  instagram: { bg: '#E4405F', icon: '📷' },
  tiktok: { bg: '#000000', icon: '♪' },
};

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-12 h-12 text-lg',
};

export const PlatformIcon: React.FC<PlatformIconProps> = ({
  platform,
  size = 'md',
  className = '',
}) => {
  const config = platformColors[platform];

  if (!config) {
    return <div className={`${sizeClasses[size]} ${className} bg-gray-300 rounded-full`} />;
  }

  return (
    <div
      className={`${sizeClasses[size]} ${className} rounded-full flex items-center justify-center font-bold text-white`}
      style={{ backgroundColor: config.bg }}
      title={platform.charAt(0).toUpperCase() + platform.slice(1)}
    >
      {config.icon}
    </div>
  );
};
