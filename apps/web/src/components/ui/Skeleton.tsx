export type SkeletonVariant = 'line' | 'title' | 'avatar' | 'card' | 'image';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: string;
  size?: number;
  className?: string;
}

export default function Skeleton({ variant = 'line', width = '100%', size, className = '' }: SkeletonProps) {
  const base = 'animate-pulse bg-white/5 relative overflow-hidden';

  const shimmer = (
    <span
      className="absolute inset-0"
      style={{
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );

  if (variant === 'avatar') {
    const px = size || 36;
    return (
      <span
        className={`${base} rounded-full inline-block flex-shrink-0 ${className}`}
        style={{ width: px, height: px }}
      >
        {shimmer}
      </span>
    );
  }

  if (variant === 'title') {
    return (
      <span className={`${base} block h-6 rounded-full w-3/5 ${className}`}>
        {shimmer}
      </span>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`${base} h-40 rounded-xl w-full ${className}`}>
        {shimmer}
      </div>
    );
  }

  if (variant === 'image') {
    return (
      <div className={`${base} h-44 rounded-t-xl w-full ${className}`}>
        {shimmer}
      </div>
    );
  }

  // line (default)
  return (
    <span
      className={`${base} block h-4 rounded-full ${className}`}
      style={{ width }}
    >
      {shimmer}
    </span>
  );
}
