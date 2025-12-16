
import React, { useMemo } from 'react';

interface UserAvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'; // using tailwind text sizes logic mostly
  className?: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ name, src, size = 'md', className = '' }) => {
  
  const initials = useMemo(() => {
    if (!name) return '??';
    // Remove text in parentheses and extra spaces
    const cleanName = name.replace(/\([^)]*\)/g, '').trim();
    const parts = cleanName.split(/\s+/);
    
    if (parts.length === 0 || (parts.length === 1 && parts[0] === '')) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  // Generate a consistent color based on name
  const bgColor = useMemo(() => {
    if (!name) return 'bg-slate-400';
    const colors = [
      'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500', 
      'bg-lime-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 
      'bg-cyan-500', 'bg-sky-500', 'bg-blue-500', 'bg-indigo-500', 
      'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 
      'bg-rose-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, [name]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl', // Profile header
    '2xl': 'w-24 h-24 text-3xl',
    '3xl': 'w-32 h-32 text-4xl', // Large profile view
  };

  const containerClass = `${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-sm overflow-hidden ${className} ${!src ? bgColor : ''}`;

  const [imgError, setImgError] = React.useState(false);

  // Reset error if src changes
  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
        <div className={containerClass}>
            <img 
                src={src} 
                alt={name || 'User'} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                    // console.warn("Avatar load failed:", src);
                    setImgError(true);
                }}
            />
        </div>
    );
  }

  return (
    <div className={containerClass} title={name || 'User'}>
      {initials}
    </div>
  );
};

export default UserAvatar;
