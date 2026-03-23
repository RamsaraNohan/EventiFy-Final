interface DashboardCalendarProps {
  events: any[];
  month: number; // 0-indexed
  year: number;
}

export function DashboardCalendar({ events, month, year }: DashboardCalendarProps) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

  const headers = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Group events by day number
  const byDay: Record<number, any[]> = {};
  events.forEach((ev: any) => {
    const d = new Date(ev.date || ev.startDate);
    if (d.getMonth() === month && d.getFullYear() === year) {
      const day = d.getDate();
      byDay[day] = byDay[day] ? [...byDay[day], ev] : [ev];
    }
  });

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {headers.map(h => (
          <div key={h} className="text-center text-xs text-gray-400 font-medium py-1">{h}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} className="h-14" />;
          const isToday = isCurrentMonth && day === today.getDate();
          const dayEvents = byDay[day] ?? [];

          return (
            <div
              key={day}
              className={`h-14 rounded-xl p-1 flex flex-col transition-colors cursor-default hover:bg-purple-50 ${
                isToday ? 'bg-purple-600' : ''
              }`}
            >
              <span className={`text-xs font-medium text-center mb-0.5 ${
                isToday ? 'text-white' : 'text-gray-600'
              }`}>
                {day}
              </span>
              <div className="flex-1 space-y-0.5 overflow-hidden">
                {dayEvents.slice(0, 2).map((ev: any, idx: number) => (
                  <div
                    key={idx}
                    className="text-[8px] leading-tight px-1 py-0.5 rounded bg-purple-100 text-purple-700 truncate"
                    title={ev.name || ev.title}
                  >
                    {ev.name || ev.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[8px] text-gray-400 pl-1">+{dayEvents.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
