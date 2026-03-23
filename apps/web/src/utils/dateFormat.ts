import { format, formatDistanceToNow, differenceInDays, isToday, isTomorrow } from 'date-fns';

export const fmtEventDate = (d: string | Date) =>
  format(new Date(d), 'EEEE, MMMM d, yyyy');

export const fmtShortDate = (d: string | Date) =>
  format(new Date(d), 'MMM d, yyyy');

export const fmtDateTime = (d: string | Date) =>
  format(new Date(d), 'MMM d, yyyy') + ' at ' + format(new Date(d), 'h:mm a');

export const fmtRelative = (d: string | Date) =>
  formatDistanceToNow(new Date(d), { addSuffix: true });

export const fmtCountdown = (eventDate: string | Date) => {
  const d = new Date(eventDate);
  const days = differenceInDays(d, new Date());
  if (isToday(d)) return { text: 'TODAY', urgent: true, color: 'text-rose-500' };
  if (isTomorrow(d)) return { text: 'Tomorrow', urgent: true, color: 'text-amber-600' };
  if (days > 0 && days <= 7) return { text: `In ${days} days`, urgent: true, color: 'text-amber-600' };
  if (days > 7) return { text: `In ${days} days`, urgent: false, color: 'text-gray-500' };
  return { text: `${Math.abs(days)} days ago`, urgent: false, color: 'text-gray-400' };
};

export const fmtLKR = (amount: number | string | null | undefined): string => {
  const num = Number(amount ?? 0);
  if (isNaN(num)) return 'LKR 0';
  return 'LKR ' + num.toLocaleString('en-LK');
};
