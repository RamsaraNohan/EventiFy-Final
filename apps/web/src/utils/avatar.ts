/**
 * Standard utility for resolving user avatars and generating fallback initials.
 */

export const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 
    'bg-amber-500', 'bg-rose-500', 'bg-pink-500', 
    'bg-indigo-500', 'bg-cyan-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const resolveAvatar = (url?: string) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const apiBase = 'http://localhost:8000'; // Match with your api.ts
  return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
};
