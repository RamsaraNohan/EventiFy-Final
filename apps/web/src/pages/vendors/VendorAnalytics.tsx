import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { DollarSign, Users, CheckCircle, Calendar, Loader, ArrowRight, Activity, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { KpiCard } from '../../components/ui/KpiCard';
import { fmtLKR } from '../../utils/dateFormat';
import { StatusBadge } from '../../components/ui/StatusBadge';

interface Metrics {
  totalEarnings: number;
  upcomingEvents: number;
  activeBookings: number;
  recentRevenue: number;
}

export default function VendorAnalytics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [eventVendors, setEventVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/vendors/metrics'),
      api.get('/events/vendor/mine')
    ]).then(([metricsRes, evRes]) => {
      setMetrics(metricsRes.data);
      setEventVendors(evRes.data);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader className="w-10 h-10 text-brand-500 animate-spin" />
      <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Compiling Analytics...</span>
    </div>
  );

  const completed = eventVendors.filter(ev => ev.status === 'COMPLETED').length;
  const active = eventVendors.filter(ev => ['APPROVED', 'ADVANCE_PAID'].includes(ev.status)).length;
  const pending = eventVendors.filter(ev => ev.status === 'PENDING').length;
  const allTasks = eventVendors.flatMap(ev => ev.tasks || []);
  const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
  const taskPct = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10" />
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Intelligence Hub</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Strategic Performance Metrics & Operational History</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-brand-50 text-brand-700 rounded-2xl border border-brand-100 font-black text-[10px] uppercase tracking-widest shadow-sm">
          <Activity size={16} className="text-brand-500" />
          Real-time insights
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total Settlement" value={fmtLKR(metrics?.totalEarnings || 0)} icon={DollarSign} color="emerald" trend={12} />
        <KpiCard label="Operations Live" value={active.toString()} icon={Calendar} color="blue" trend={2} />
        <KpiCard label="Inbound Requests" value={pending.toString()} icon={Users} color="amber" trend={-1} />
        <KpiCard label="Success Rate" value={`${completed} Events`} icon={CheckCircle} color="brand" trend={100} />
      </div>

      {/* OPERATIONAL EFFICIENCY */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center border border-brand-100">
                <Target size={28} />
             </div>
             <div>
               <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Operational Velocity</h2>
               <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Actionable task completion across projects</p>
             </div>
          </div>
          <div className="text-center md:text-right">
             <span className="text-5xl font-black text-gray-900 tracking-tighter">{taskPct}%</span>
             <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-1">Efficiency Index</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-50 rounded-full h-4 overflow-hidden border border-gray-100 p-1 shadow-inner">
          <div 
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-1500 ease-out shadow-[0_0_15px_rgba(139,92,246,0.3)]" 
            style={{ width: `${taskPct}%` }} 
          />
        </div>
        
        <div className="flex justify-between mt-6">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{completedTasks} Executed</span>
           </div>
           <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{allTasks.length - completedTasks} Remaining</span>
              <div className="w-3 h-3 rounded-full bg-gray-100 border border-gray-200" />
           </div>
        </div>
      </div>

      {/* EVENT HISTORY TABLE */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-10 border-b border-gray-50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Project Archives</h2>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Historical view of all collaboration projects</p>
          </div>
          <button onClick={() => navigate('/services')} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-black transition-all">
            Live Projects Flow <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        {eventVendors.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
             <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mb-4">
                <Calendar size={32} />
             </div>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Awaiting first collaboration</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Event / Client</th>
                  <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Project Timeline</th>
                  <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Settlement</th>
                  <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Execution</th>
                  <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {eventVendors.map(ev => {
                  const tasks = ev.tasks || [];
                  const done = tasks.filter((t: any) => t.status === 'COMPLETED').length;
                  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;
                  return (
                    <tr key={ev.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-10 py-8">
                        <div>
                          <p className="text-sm font-black text-gray-900 group-hover:text-brand-600 transition-colors uppercase tracking-tight">{ev.event?.name}</p>
                          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{ev.event?.client?.name || 'Exclusive Client'}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-xs font-bold text-gray-500 bg-white border border-gray-100 px-3 py-1.5 rounded-lg shadow-sm">
                           {ev.event?.date ? format(new Date(ev.event.date), 'MMM d, yyyy') : 'TBD'}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <span className="text-sm font-black text-emerald-600">
                          {ev.agreedCost ? fmtLKR(ev.agreedCost) : '—'}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                             <span>{done}/{tasks.length} Executed</span>
                             <span>{pct}%</span>
                          </div>
                          <div className="w-32 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                         <StatusBadge status={ev.status as any} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
