import React from 'react';

interface UnreadBadgeProps {
  count: number;
}

export default function UnreadBadge({ count }: UnreadBadgeProps) {
  if (count <= 0) return null;
  
  const displayCount = count > 9 ? '9+' : count.toString();
  
  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-3 min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-rose-500 rounded-full text-[10px] font-black text-white shadow-sm shadow-rose-900/50 tabular-nums animate-in zoom-in duration-300">
      {displayCount}
    </div>
  );
}
