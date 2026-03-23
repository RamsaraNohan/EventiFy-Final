interface Avatar {
  src?: string;
  name: string;
}

interface AvatarGroupProps {
  avatars: Avatar[];
  max?: number;
  size?: number;
}

export default function AvatarGroup({ avatars, max = 3, size = 32 }: AvatarGroupProps) {
  const shown = avatars.slice(0, max);
  const extra = avatars.length - max;

  return (
    <div className="flex items-center">
      {shown.map((av, i) => (
        <div
          key={i}
          className="rounded-full ring-2 ring-white/10 overflow-hidden flex-shrink-0"
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -8,
            zIndex: shown.length - i,
            position: 'relative',
          }}
        >
          {av.src ? (
            <img src={av.src} alt={av.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-rose-900/40 text-rose-300 text-xs font-semibold">
              {av.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="rounded-full ring-2 ring-white/10 bg-white/10 flex items-center justify-center text-white/60 text-xs font-medium flex-shrink-0"
          style={{ width: size, height: size, marginLeft: -8, position: 'relative', zIndex: 0 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
