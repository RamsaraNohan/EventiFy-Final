import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/auth';
import { api } from '../../lib/api';
import { fmtLKR } from '../../utils/dateFormat';
import { KpiCard } from '../../components/ui/KpiCard';
import { DashboardCalendar } from '../../components/ui/DashboardCalendar';
import { ConversationPreview } from '../../components/ui/ConversationPreview';
import { format, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, MessageSquare, Plus, ArrowRight, Sparkles, TrendingUp, Target, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [evRes, convRes] = await Promise.all([
          api.get('/events').catch(err => {
            console.error('Events stream failure:', err);
            return { data: [] };
          }),
          api.get('/conversations').catch(err => {
            console.error('Conversations stream failure:', err);
            return { data: [] };
          })
        ]);
        
        setEvents(evRes.data ?? []);
        setConversations(convRes.data ?? []);
      } catch (err) {
        console.error('Dashboard synchronization error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const nextEvent = events
    .filter(e => new Date(e.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  const daysLeft = nextEvent ? differenceInDays(new Date(nextEvent.date), new Date()) : 0;
  
  // Compute Metrics
  const totalSpent = events.reduce((acc, ev) => acc + (Number(ev.budget) || 0), 0);
  const vendorCount = events.reduce((acc, ev) => acc + (ev.eventVendors?.length || 0), 0);
  const completedTasks = events.reduce((acc, ev) => {
    const tasks = ev.eventVendors?.flatMap((evv: any) => evv.tasks || []) || [];
    return acc + tasks.filter((t: any) => t.status === 'COMPLETED').length;
  }, 0);
  const totalTasks = events.reduce((acc, ev) => {
    const tasks = ev.eventVendors?.flatMap((evv: any) => evv.tasks || []) || [];
    return acc + tasks.length;
  }, 0);

  if (loading) return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-8 animate-pulse">
       <div className="h-32 bg-gray-100 rounded-[2.5rem]" />
       <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-3xl" />)}
       </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION - Premium Gradient Look */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white border border-gray-100 p-10 rounded-[3rem] shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10 group-hover:scale-110 transition-transform duration-1000" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-200">
                <Sparkles size={20} />
             </div>
             <span className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em]">Client Command Center</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">
            Hi, {user?.name?.split(' ')[0] || 'Member'}!
          </h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">
            {nextEvent 
              ? `Dynamic Status: "${nextEvent.name}" in ${daysLeft} days.`
              : "System Ready: No upcoming events detected."}
          </p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          {nextEvent && (
             <div className="bg-brand-50 px-5 py-2.5 rounded-2xl border border-brand-100 flex items-center gap-3 shadow-sm">
                <div className="flex flex-col items-center">
                   <span className="text-xl font-black text-brand-700 leading-none">{daysLeft}</span>
                   <span className="text-[8px] font-black text-brand-400 uppercase">Days</span>
                </div>
                <div className="w-px h-6 bg-brand-200" />
                <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Until Launch</span>
             </div>
          )}
          <button 
            onClick={() => navigate('/events')}
            className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-gray-200 transition-all flex items-center gap-3 active:scale-95"
          >
            <Plus size={18} />
            Create Event
          </button>
        </div>
      </div>

      {/* KPI GRID - Unified KpiCard usage */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          label="Financial Focus" 
          value={fmtLKR(totalSpent)} 
          color="brand" 
          icon={TrendingUp}
        />
        <KpiCard 
          label="Mission Control" 
          value={events.filter(e => new Date(e.date) >= new Date()).length.toString()} 
          color="blue" 
          icon={Target}
        />
        <KpiCard 
          label="Strategic Partners" 
          value={vendorCount.toString()} 
          color="emerald" 
          icon={Zap}
        />
        <KpiCard 
          label="Execution Delta" 
          value={`${completedTasks}/${totalTasks}`} 
          color="pink" 
          icon={CheckCircle}
        />
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CALENDAR PANEL */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-4">
              <CalendarIcon size={28} className="text-brand-600" />
              Event Horizon
            </h2>
            <div className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 uppercase tracking-widest">
              {format(new Date(), 'MMMM yyyy')}
            </div>
          </div>
          <DashboardCalendar events={events} month={new Date().getMonth()} year={new Date().getFullYear()} />
        </div>

        {/* MESSAGES PANEL */}
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-10 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-4">
              <MessageSquare size={28} className="text-brand-600" />
              Intelligence
            </h2>
            <button onClick={() => navigate('/messages')} className="w-10 h-10 bg-gray-50 text-brand-600 hover:bg-brand-600 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm border border-gray-100">
              <ArrowRight size={18} />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {conversations.length === 0 ? (
               <div className="text-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No active streams</p>
               </div>
            ) : (
              conversations.slice(0, 5).map(conv => (
                <ConversationPreview key={conv.id} conversation={conv} />
              ))
            )}
          </div>
          <button onClick={() => navigate('/messages')} className="mt-8 w-full py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-600 bg-gray-50 hover:bg-brand-50 rounded-2xl border border-gray-100 transition-all flex items-center justify-center gap-2">
             Access All Comms <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
