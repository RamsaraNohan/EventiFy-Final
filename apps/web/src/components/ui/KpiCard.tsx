import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
  label: string;
  value: string | number;
  trend?: number;
  percent?: number;
  color: 'purple' | 'blue' | 'green' | 'pink' | 'amber' | 'emerald' | 'indigo' | 'brand' | 'yellow';
  icon?: React.ElementType;
  sparkData?: number[];
  showDonut?: boolean;
}

const COLORS = {
  purple:  { stroke: '#8B5CF6', fill: '#8B5CF6' },
  blue:    { stroke: '#3B82F6', fill: '#3B82F6' },
  green:   { stroke: '#10B981', fill: '#10B981' },
  emerald: { stroke: '#059669', fill: '#059669' },
  pink:    { stroke: '#EC4899', fill: '#EC4899' },
  amber:   { stroke: '#F59E0B', fill: '#F59E0B' },
  indigo:  { stroke: '#6366F1', fill: '#6366F1' },
  brand:   { stroke: '#8B5CF6', fill: '#8B5CF6' },
  yellow:  { stroke: '#FBBF24', fill: '#FBBF24' },
};

export function KpiCard({ label, value, trend, percent, color, icon: Icon, sparkData = [], showDonut }: KpiCardProps) {
  // Defensive color selection
  const safeColor = color || 'brand';
  const c = (COLORS as any)[safeColor] || COLORS.brand;
  
  // Format numeric value if it looks like one
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  const chartData = (sparkData && sparkData.length >= 2 ? sparkData : [1, 2, 1, 3, 2, 4, 3]).map((v, i) => ({ v, i }));

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 relative overflow-hidden h-full flex flex-col justify-between">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-1">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
          {Icon && <Icon className="w-4 h-4 text-gray-300" />}
        </div>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{displayValue}</p>

        {trend !== undefined && (
          <p className={`text-[10px] mt-1 font-black uppercase tracking-tight ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% {trend >= 0 ? 'growth' : 'decrease'}
          </p>
        )}

        {showDonut && percent !== undefined && (
          <div className="flex items-center gap-2 mt-3">
            <div className="relative w-10 h-10 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F3F4F6" strokeWidth="4" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke={c?.stroke || '#8B5CF6'} strokeWidth="4"
                  strokeDasharray={`${Math.min(Number(percent), 100)} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-gray-900">
                {Math.round(Number(percent))}%
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold leading-tight uppercase tracking-tight">Current<br/>Utility</span>
          </div>
        )}
      </div>

      {/* Mini sparkline — bottom right corner */}
      <div className="absolute bottom-0 right-0 w-24 h-12 opacity-30 -mr-2 -mb-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <Area 
              type="monotone" 
              dataKey="v" 
              stroke={c?.stroke || '#8B5CF6'} 
              fill={c?.fill || '#8B5CF6'} 
              fillOpacity={0.4} 
              strokeWidth={2} 
              dot={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
