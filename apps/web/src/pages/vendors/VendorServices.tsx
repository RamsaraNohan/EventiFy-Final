import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { CheckCircle, Clock, Circle, ChevronDown, Loader, MessageSquare, ListTodo, Briefcase } from 'lucide-react';
import { fmtLKR } from '../../utils/dateFormat';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from '../../components/ui/StatusBadge';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

export default function VendorServices() {
  const [eventVendors, setEventVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [updating, setUpdating] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => { fetchMyServices(); }, []);

  const fetchMyServices = async () => {
    try {
      const res = await api.get('/events/vendor/mine');
      const activeServices = res.data.filter((ev: any) => ev.status !== 'PENDING' && ev.status !== 'REJECTED');
      setEventVendors(activeServices);
      if (activeServices.length > 0) setExpanded({ [activeServices[0].id]: true });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: TaskStatus, progress: number) => {
    setUpdating(taskId);
    try {
      await api.patch(`/tasks/${taskId}`, { status, progress });
      fetchMyServices();
    } catch (err) { console.error(err); }
    finally { setUpdating(null); }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-6 animate-pulse">
      <div className="h-24 bg-gray-100 rounded-[2rem]" />
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-[2rem]" />)}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10" />
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Service Stream</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Execute projects & manage collaborative workflows</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 text-gray-600 rounded-2xl border border-gray-100 font-black text-[10px] uppercase tracking-widest shadow-sm">
          <Briefcase size={16} className="text-brand-500" />
          {eventVendors.length} active engagements
        </div>
      </div>

      {eventVendors.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2.5rem] border border-dashed border-gray-200 flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 text-gray-300 rounded-3xl flex items-center justify-center mb-6">
            <ListTodo size={32} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No active projects</h3>
          <p className="text-gray-400 max-w-sm font-medium">Approved bookings and ongoing collaborations will appear here for management.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {eventVendors.map(ev => {
            const isExpanded = expanded[ev.id];
            const tasks: any[] = ev.tasks || [];
            const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;
            const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

            return (
              <div key={ev.id} className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-md">
                {/* Header */}
                <div className="p-8 flex items-center justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight truncate">{ev.event?.name}</h3>
                      <StatusBadge status={ev.status} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-gray-400 uppercase tracking-widest">
                       <span className="flex items-center gap-1.5"><Clock size={12} className="text-brand-500" />{ev.event?.date ? format(new Date(ev.event.date), 'MMM d, yyyy') : 'No Date'}</span>
                       <span>·</span>
                       <span className="text-brand-600">{ev.event?.client?.name}</span>
                       {ev.agreedCost && (
                         <>
                           <span>·</span>
                           <span className="text-emerald-600 font-black">{fmtLKR(ev.agreedCost)}</span>
                         </>
                       )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/messages')} className="w-11 h-11 bg-gray-50 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-2xl flex items-center justify-center transition-all border border-gray-100 group">
                      <MessageSquare size={20} className="group-hover:scale-110 transition-transform" />
                    </button>
                    
                    <button 
                      onClick={() => setExpanded(e => ({ ...e, [ev.id]: !e[ev.id] }))} 
                      className={`w-11 h-11 bg-white border border-gray-100 rounded-2xl flex items-center justify-center text-gray-400 hover:text-gray-900 transition-all ${isExpanded ? 'rotate-180 bg-gray-50' : ''}`}
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar (Compact when collapsed) */}
                {!isExpanded && tasks.length > 0 && (
                  <div className="px-8 pb-8">
                     <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden border border-gray-100">
                        <div className="h-full bg-brand-500 transition-all duration-1000" style={{ width: `${progress}%` }} />
                     </div>
                  </div>
                )}

                {/* Tasks Expanded */}
                {isExpanded && (
                  <div className="px-8 pb-10 space-y-8 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex items-end justify-between border-b border-gray-50 pb-6">
                       <div>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Execution Status</span>
                         <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Project Milestones</h4>
                       </div>
                       <div className="text-right">
                         <span className="text-3xl font-black text-gray-900 tracking-tighter">{progress}%</span>
                         <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mt-0.5">{completedCount} of {tasks.length} Completed</p>
                       </div>
                    </div>

                    <div className="grid gap-3">
                      {tasks.length === 0 ? (
                        <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                           <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Awaiting client-defined milestones</p>
                        </div>
                      ) : (
                        tasks.map(task => (
                          <div key={task.id} className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-gray-50 border border-gray-100 rounded-3xl hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 transition-all group">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="shrink-0">
                                {task.status === 'COMPLETED' ? (
                                  <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-100">
                                    <CheckCircle size={20} />
                                  </div>
                                ) : task.status === 'IN_PROGRESS' ? (
                                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100 animate-pulse">
                                    <Clock size={20} />
                                  </div>
                                ) : (
                                  <div className="w-10 h-10 bg-gray-100 text-gray-300 rounded-xl flex items-center justify-center border border-gray-200">
                                    <Circle size={20} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-sm font-black uppercase tracking-tight ${task.status === 'COMPLETED' ? 'line-through text-gray-300' : 'text-gray-900'}`}>{task.title}</p>
                                {task.description && <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{task.description}</p>}
                              </div>
                            </div>

                            <div className="flex items-center gap-6 shrink-0 md:justify-end">
                              {task.status !== 'COMPLETED' && (
                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm">
                                  <input 
                                    type="range" 
                                    min={0} 
                                    max={100} 
                                    step={10}
                                    defaultValue={task.progress}
                                    className="w-24 h-1.5 appearance-none bg-gray-100 rounded-full accent-brand-600 cursor-pointer"
                                    onMouseUp={e => {
                                      const val = parseInt((e.target as HTMLInputElement).value);
                                      handleUpdateTaskStatus(task.id, val === 100 ? 'COMPLETED' : val > 0 ? 'IN_PROGRESS' : 'PENDING', val);
                                    }} 
                                  />
                                  <span className="text-[10px] font-black text-gray-400 w-10">{task.progress}%</span>
                                </div>
                              )}
                              
                              <div className="flex gap-2">
                                {task.status !== 'COMPLETED' && (
                                  <button 
                                    onClick={() => handleUpdateTaskStatus(task.id, 'COMPLETED', 100)} 
                                    disabled={updating === task.id}
                                    className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-gray-200 transition-all flex items-center gap-2 group-hover:scale-105 active:scale-95"
                                  >
                                    {updating === task.id ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCircle size={14} />}
                                    Finalize
                                  </button>
                                )}
                                {task.status === 'COMPLETED' && (
                                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                                     <CheckCircle size={14} /> EXECUTED
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
