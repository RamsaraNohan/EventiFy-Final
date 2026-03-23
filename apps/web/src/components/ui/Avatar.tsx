import React from 'react';
import { resolveAvatar, getInitials, getAvatarColor } from '../../utils/avatar';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  name = '?', 
  size = 'md', 
  className = '' 
}) => {
  const [error, setError] = React.useState(false);
  const resolvedSrc = resolveAvatar(src);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const style = typeof size === 'number' ? { width: size, height: size, fontSize: size / 3 } : {};
  const sizeClass = typeof size === 'string' ? sizeClasses[size] : '';
  const roundingClass = className.includes('rounded-') ? '' : 'rounded-full';

  if (resolvedSrc && !error) {
    return (
      <img
        src={resolvedSrc}
        alt={name}
        onError={() => setError(true)}
        style={style}
        className={`${sizeClass} ${roundingClass} object-cover border border-white/10 ring-2 ring-white/5 ${className}`}
      />
    );
  }

  return (
    <div 
      style={style}
      className={`${sizeClass} ${roundingClass} flex items-center justify-center font-bold text-white uppercase tracking-tighter border border-white/10 ring-2 ring-white/20 shadow-inner ${getAvatarColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};
