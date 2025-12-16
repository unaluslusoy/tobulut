
import React from 'react';
import UserAvatar from './UserAvatar';

export interface AvatarGroupItem {
  name: string;
  src?: string;
}

export interface AvatarGroupProps {
  avatars: AvatarGroupItem[];
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'md',
  className = '',
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] -ml-1.5',
    sm: 'w-8 h-8 text-xs -ml-2',
    md: 'w-10 h-10 text-sm -ml-2.5',
    lg: 'w-12 h-12 text-base -ml-3',
  };

  const containerPadding = {
    xs: 'pl-1.5',
    sm: 'pl-2',
    md: 'pl-2.5',
    lg: 'pl-3',
  };

  return (
    <div className={`flex items-center ${containerPadding[size]} ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={`
            relative rounded-full ring-2 ring-white dark:ring-slate-800
            ${index === 0 ? 'ml-0' : sizeClasses[size].split(' ').find(c => c.startsWith('-ml'))}
          `}
          style={{ zIndex: visibleAvatars.length - index }}
        >
          <UserAvatar
            name={avatar.name}
            src={avatar.src}
            size={size}
          />
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={`
            flex items-center justify-center rounded-full
            bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300
            font-semibold ring-2 ring-white dark:ring-slate-800
            ${sizeClasses[size]}
          `}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

export default AvatarGroup;
