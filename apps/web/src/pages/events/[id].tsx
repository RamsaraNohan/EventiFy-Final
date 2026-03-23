import { useState, useEffect, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { format, differenceInDays } from 'date-fns';
import { ArrowLeft, Building2, CheckCircle, Circle, Clock, MessageSquare, CreditCard, Plus, ChevronDown, Loader, Star, Edit3, Save, X, MapPin, Target, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../../lib/socket';
import EventStepper from '../../components/ui/EventStepper';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { fmtLKR } from '../../utils/dateFormat';



function BudgetBar({ spent, total }: { spent: number, total: number }) {
  const pct = Math.min(Math.round((spent / (total || 1)) * 100), 100);
  const isOver = spent > total && total > 0;
  
  return (
    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-end mb-4">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Budget Utilization</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black tracking-tighter ${isOver ? 'text-rose-600' : 'text-gray-900'}`}>{pct}%</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">of {fmtLKR(total)}</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1 text-emerald-600">Total Spent</span>
          <span className="text-lg font-black text-gray-900 tracking-tight">{fmtLKR(spent)}</span>
        </div>
      </div>
      <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden border border-gray-100 p-0.5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          className={`h-full rounded-full ${isOver ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]' : 'bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.2)]'}`}
        />
      </div>
    </div>
  );
}

function PaymentTimeline({ event }: { event: EventDetail }) {
  const advancePaid = event.eventVendors.every(ev => ev.status !== 'APPROVED' || ev.advancePaid > 0);
  const executionDone = event.eventVendors.length > 0 && event.eventVendors.every(ev => ev.tasks.length > 0 && ev.tasks.every(t => t.status === 'COMPLETED'));
  const fullyPaid = event.status === 'FULLY_PAID' || event.status === 'COMPLETED';

  const steps = [
    { label: 'Booking Advance', status: advancePaid ? 'COMPLETED' : 'IN_PROGRESS', desc: '50% secured for squad' },
    { label: 'Tactical Execution', status: executionDone ? 'COMPLETED' : advancePaid ? 'IN_PROGRESS' : 'PENDING', desc: 'Milestones & delivery' },
    { label: 'Final Settlement', status: fullyPaid ? 'COMPLETED' : executionDone ? 'IN_PROGRESS' : 'PENDING', desc: 'Project closure balance' }
  ];

  return (
    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
        <CreditCard size={14} className="text-brand-600" /> Payment Pipeline
      </h3>
      <div className="space-y-8 relative">
        <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-50" />
        {steps.map((step, i) => (
          <div key={i} className="relative flex gap-6 group">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 z-10 border-4 border-white shadow-sm transition-all ${
              step.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 
              step.status === 'IN_PROGRESS' ? 'bg-brand-600 text-white animate-pulse' : 'bg-gray-100 text-gray-300'
            }`}>
              {step.status === 'COMPLETED' ? <CheckCircle size={18} /> : (i + 1)}
            </div>
            <div>
              <p className={`text-sm font-black uppercase tracking-tight ${step.status === 'PENDING' ? 'text-gray-300' : 'text-gray-900'}`}>{step.label}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type EventStatus = 'PLANNING' | 'VENDORS_PENDING' | 'PAYMENT_PENDING' | 'ONGOING' | 'EVENT_SOON' | 'COMPLETED' | 'PAYMENT_OVERDUE' | 'FULLY_PAID';

type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  progress: number;
  notes?: string;
}

interface EventVendorDetail {
  id: string;
  status: string;
  agreedCost: number;
  advancePaid: number;
  tasks: Task[];
  vendor: {
    id: string;
    businessName: string;
    category: string;
    city: string;
    owner?: { name: string; avatarUrl?: string };
  };
}

interface EventDetail {
  id: string;
  name: string;
  date: string;
  location: string;
  budget: number;
  status: string;
  notes?: string;
  eventVendors: EventVendorDetail[];
}

const TASK_STATUS_ICONS: Record<TaskStatus, ReactNode> = {
  PENDING: <Circle className="w-4 h-4 text-gray-300" />,
  IN_PROGRESS: <Clock className="w-4 h-4 text-amber-500 animate-spin" style={{ animationDuration: '3s' }} />,
  COMPLETED: <CheckCircle className="w-4 h-4 text-emerald-500" />,
};

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedVendors, setExpandedVendors] = useState<Record<string, boolean>>({});
  const [newTaskForms, setOriginalNewTaskForms] = useState<Record<string, string>>({}); // Renamed to avoid confusion with internal usage if any
  const [newTaskFormsProxy, setNewTaskForms] = useState<Record<string, string>>({}); 
  const [addingTask, setAddingTask] = useState<string | null>(null);
  const [reviewForms, setReviewForms] = useState<Record<string, { rating: number, comment: string }>>({});
  const [submittingReview, setSubmittingReview] = useState<string | null>(null);
  const [reviewedVendors, setReviewedVendors] = useState<Record<string, boolean | 'success'>>({});

  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', date: '', location: '', budget: 0 });
  const [updating, setUpdating] = useState(false);

  useEffect(() => { 
    if (id) fetchEvent(); 

    const socket = getSocket();
    if (socket) {
      socket.on('payment:success', fetchEvent);
      return () => {
        socket.off('payment:success', fetchEvent);
      };
    }
  }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
      setEditForm({
        name: res.data.name,
        date: res.data.date.split('T')[0],
        location: res.data.location || '',
        budget: res.data.budget || 0
      });
      if (res.data.eventVendors?.length > 0 && Object.keys(expandedVendors).length === 0) {
        setExpandedVendors({ [res.data.eventVendors[0].id]: true });
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAddTask = async (eventVendorId: string) => {
    const title = newTaskFormsProxy[eventVendorId]?.trim();
    if (!title) return;
    setAddingTask(eventVendorId);
    try {
      await api.post(`/tasks/event-vendor/${eventVendorId}`, { title });
      setNewTaskForms(f => ({ ...f, [eventVendorId]: '' }));
      fetchEvent();
    } catch (err) { console.error(err); }
    finally { setAddingTask(null); }
  };

  const handleUpdateEvent = async () => {
    if (!id || !editForm.name) return;
    setUpdating(true);
    try {
      await api.put(`/events/${id}`, editForm);
      await fetchEvent();
      setIsEditing(false);
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  };

  const handleSubmitReview = async (vendorId: string) => {
    const form = reviewForms[vendorId];
    if (!form || !form.rating) return;
    setSubmittingReview(vendorId);
    try {
      await api.post('/reviews', {
        vendorId,
        eventId: event!.id,
        rating: form.rating,
        comment: form.comment || ''
      });
      
      // Animation Trigger
      setReviewedVendors(prev => ({ ...prev, [vendorId]: 'success' } as any));
      
      setTimeout(() => {
        setReviewedVendors(prev => ({ ...prev, [vendorId]: true }));
        fetchEvent();
        setSubmittingReview(null);
      }, 2500);
    } catch (err) { 
      console.error(err); 
      setSubmittingReview(null);
    }
  };

  const handleRemoveVendor = async (eventVendorId: string) => {
    if (!window.confirm('Are you sure you want to remove this vendor request?')) return;
    try {
      await api.delete(`/events/${id}/vendors/${eventVendorId}`);
      fetchEvent();
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader className="w-10 h-10 text-brand-500 animate-spin" />
      <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Accessing Event Stream...</span>
    </div>
  );
  if (!event) return <div className="text-center text-gray-400 py-20 font-black uppercase tracking-widest">Event not found</div>;

  const daysLeft = differenceInDays(new Date(event.date), new Date());
  const allTasks = event.eventVendors.flatMap(ev => ev.tasks);
  const completedTasks = allTasks.filter(t => t.status === 'COMPLETED').length;
  const totalProgress = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;
  const spent = event.eventVendors.reduce((acc, ev) => acc + Number(ev.agreedCost || 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      
      {/* NAVIGATION & STATUS */}
      <div className="flex items-center justify-between bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
        <button onClick={() => navigate('/events')} className="flex items-center gap-3 text-gray-400 hover:text-brand-600 transition-all text-xs font-black uppercase tracking-widest group">
           <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
           Project Index
        </button>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => window.print()}
             className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 text-gray-400 hover:text-gray-900 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white shadow-sm mr-2"
           >
             <Sparkles size={14} className="text-brand-500" /> Export PDF
           </button>
           <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Phase:</span>
           <StatusBadge status={event.status as any} />
        </div>
      </div>

      {/* HERO PANEL */}
      <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-50 rounded-full blur-[120px] -z-10 transition-transform duration-1000 group-hover:scale-110" />
        
        <div className="flex flex-col lg:flex-row justify-between gap-12 relative z-10">
          <div className="flex-1 space-y-8">
            {isEditing ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Header</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-black focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/5 transition-all shadow-inner"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mission Date</label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-black focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/5 transition-all shadow-inner"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={handleUpdateEvent}
                    disabled={updating}
                    className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-gray-200 flex items-center gap-3"
                  >
                    {updating ? <Loader className="w-4 h-4 animate-spin" /> : <Save size={18} />} Update Strategy
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="bg-white hover:bg-gray-50 text-gray-400 px-8 py-4 rounded-2xl text-[10px] font-black border border-gray-100 uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <h1 className="text-5xl font-black text-gray-900 tracking-tight uppercase leading-none">{event.name}</h1>
                  <button onClick={() => setIsEditing(true)} className="w-10 h-10 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-xl text-gray-300 hover:text-brand-600 hover:bg-brand-50 transition-all opacity-0 group-hover:opacity-100">
                    <Edit3 size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-gray-400 text-xs font-black uppercase tracking-[0.2em]">
                  <p className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <Clock size={16} className="text-brand-500" />
                    {format(new Date(event.date), 'MMMM d, yyyy')}
                  </p>
                  <p className="flex items-center gap-2.5 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <MapPin size={16} className="text-brand-500" />
                    {event.location || 'Global Base'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-8 border-t border-gray-50">
               <EventStepper status={event.status as EventStatus} />
            </div>
          </div>
          
          <div className="flex flex-col gap-6 shrink-0 lg:w-[280px]">
            {daysLeft > 0 ? (
               <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-200 relative overflow-hidden group/days">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 opacity-20 rounded-full blur-3xl -z-0" />
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-7xl font-black tracking-tighter leading-none mb-1 group-hover/days:scale-110 transition-transform">{daysLeft}</span>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50">Countdown</span>
                  </div>
               </div>
            ) : (
               <div className="bg-emerald-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-emerald-100 text-center flex flex-col items-center gap-3">
                  <CheckCircle size={48} className="animate-bounce" />
                  <span className="text-sm font-black uppercase tracking-widest">Project Executed</span>
               </div>
            )}

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm">
                <div className="flex justify-between items-end mb-4">
                   <div className="flex items-center gap-2">
                      <Zap size={16} className="text-amber-500" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Velocity</span>
                   </div>
                   <span className="text-lg font-black text-gray-900">{totalProgress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden border border-white">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${totalProgress}%` }}
                     transition={{ duration: 1.5, ease: "easeOut" }}
                     className="h-full bg-brand-600 rounded-full" 
                   />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* CORE CONTENT SEGMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* LEFTSIDE INFO */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                 <Target size={14} className="text-brand-600" /> Financials
              </h3>
              <div className="space-y-6">
                 <BudgetBar spent={spent} total={event.budget} />
                 <div className="h-px bg-gray-50 my-2" />
                 <PaymentTimeline event={event} />
              </div>
           </div>
           
           <div className="bg-brand-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-brand-100 relative overflow-hidden">
              <Sparkles size={32} className="opacity-40 mb-6" />
              <h4 className="font-black text-lg uppercase tracking-tight mb-2">Nexus Tip</h4>
              <p className="text-[10px] font-bold text-brand-100 uppercase tracking-widest leading-relaxed">Regular engagement with your vendor squad ensures a higher probability of visual alignment and successful execution.</p>
           </div>
        </div>

        {/* RIGHTSIDE VENDORS & TASKS */}
        <div className="lg:col-span-3 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Assigned Squad</h2>
            <button onClick={() => navigate('/explore')} className="flex items-center gap-3 px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all active:scale-95">
               <Plus size={16} /> Deploy Vendor
            </button>
          </div>

          <div className="grid gap-6">
            {event.eventVendors.length === 0 ? (
               <div className="text-center py-20 bg-white border border-gray-100 border-dashed rounded-[3rem] flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-50 text-gray-200 rounded-3xl flex items-center justify-center mb-6">
                     <Building2 size={32} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">No active partnerships</h3>
                  <button onClick={() => navigate('/explore')} className="mt-4 text-brand-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:underline">
                    Find Strategic Matches <ArrowRight size={14} />
                  </button>
               </div>
            ) : (
              event.eventVendors.map(ev => {
                const isExpanded = expandedVendors[ev.id];
                const evTasks = ev.tasks || [];
                const evCompleted = evTasks.filter(t => t.status === 'COMPLETED').length;
                const evProgress = evTasks.length > 0 ? Math.round((evCompleted / evTasks.length) * 100) : 0;

                return (
                  <div key={ev.id} className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-gray-200/40 transition-all">
                    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar 
                            src={ev.vendor.owner?.avatarUrl} 
                            name={ev.vendor.businessName} 
                            size="lg" 
                            className="rounded-3xl shadow-lg border-4 border-white ring-1 ring-gray-100 transition-transform group-hover:scale-105 duration-500" 
                          />
                          <div className={`absolute -bottom-1 -right-1 w-6 h-6 border-4 border-white rounded-full flex items-center justify-center shadow-lg ${ev.status === 'ADVANCE_PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                             {ev.status === 'ADVANCE_PAID' && <CheckCircle size={10} className="text-white" />}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover:text-brand-600 transition-colors leading-none mb-1.5">{ev.vendor.businessName}</h3>
                          <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                             <span>{ev.vendor.category}</span>
                             <span className="w-1 h-1 bg-gray-200 rounded-full" />
                             <span className="flex items-center gap-1"><MapPin size={10} className="text-brand-500" /> {ev.vendor.city}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <StatusBadge status={ev.status as any} />
                        
                        <div className="flex items-center gap-2 border-l border-gray-100 pl-4">
                          <button onClick={() => navigate('/messages')} className="w-11 h-11 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-2xl transition-all border border-gray-100 group shadow-sm bg-white" title="Secure Communication">
                            <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                          </button>
                          
                          {ev.status === 'APPROVED' && (
                            <button onClick={() => navigate(`/checkout/${ev.id}?type=event-vendor`)} className="flex items-center gap-3 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-100 active:scale-95">
                              <CreditCard size={16} /> Pay Advance
                            </button>
                          )}
                          
                          {ev.status === 'PENDING' && (
                            <button onClick={() => handleRemoveVendor(ev.id)} className="w-11 h-11 flex items-center justify-center text-gray-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all border border-gray-100 shadow-sm bg-white" title="Recall Request">
                              <X size={20} />
                            </button>
                          )}
                          
                          <button onClick={() => setExpandedVendors(e => ({ ...e, [ev.id]: !e[ev.id] }))}
                            className={`w-11 h-11 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 border border-gray-100 rounded-2xl transition-all shadow-sm bg-white ${isExpanded ? 'rotate-180' : ''}`}>
                            <ChevronDown size={20} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {!isExpanded && evTasks.length > 0 && (
                      <div className="px-8 pb-8">
                        <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden border border-gray-100">
                          <div className="h-full rounded-full bg-brand-500 transition-all duration-1000" style={{ width: `${evProgress}%` }} />
                        </div>
                      </div>
                    )}

                    <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-gray-50 bg-gray-50/20 px-10 py-10"
                      >
                        <div className="flex items-end justify-between mb-8">
                          <div>
                             <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Execution Matrix</span>
                             <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight">Project Milestones</h4>
                          </div>
                          <div className="text-right">
                             <span className="text-2xl font-black text-gray-900 tracking-tighter">{evProgress}%</span>
                             <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest">{evCompleted} / {evTasks.length} Done</p>
                          </div>
                        </div>
                        
                        <div className="grid gap-3 mb-10">
                          {evTasks.length === 0 ? (
                             <div className="text-center py-10 bg-white border border-dashed border-gray-200 rounded-[2rem]">
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Awaiting Milestone Configuration</p>
                             </div>
                          ) : (
                            evTasks.map((task, tidx) => (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: tidx * 0.05 }}
                                key={task.id} 
                                className="flex items-center gap-5 p-5 bg-white rounded-[1.5rem] border border-gray-100 shadow-sm group/task hover:border-brand-500 transition-all"
                              >
                                <div className="shrink-0">{TASK_STATUS_ICONS[task.status]}</div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-black uppercase tracking-tight ${task.status === 'COMPLETED' ? 'text-gray-300 line-through' : 'text-gray-900'}`}>{task.title}</p>
                                  {task.notes && <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{task.notes}</p>}
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>

                        <div className="flex gap-4">
                          <input
                            value={newTaskFormsProxy[ev.id] || ''}
                            onChange={e => setNewTaskForms(f => ({ ...f, [ev.id]: e.target.value }))}
                            onKeyDown={e => e.key === 'Enter' && handleAddTask(ev.id)}
                            placeholder="Add execution milestone..."
                            className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 py-3.5 text-sm font-black text-gray-900 placeholder-gray-300 focus:outline-none focus:border-brand-500 transition-all shadow-sm uppercase tracking-tight"
                          />
                          <button onClick={() => handleAddTask(ev.id)} disabled={addingTask === ev.id || !newTaskFormsProxy[ev.id]?.trim()}
                            className="px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-gray-200 transition-all disabled:opacity-50 active:scale-95">
                            {addingTask === ev.id ? <Loader className="animate-spin" /> : 'Deploy Task'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* POST-EVENT REVIEW BLOCK - Redesigned with smooth animations */}
      {event.status === 'COMPLETED' && event.eventVendors.length > 0 && (
        <div className="space-y-10 mt-20 pt-20 border-t border-gray-100">
          <div className="text-center max-w-2xl mx-auto">
             <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-50 border border-brand-100">
                <Star size={32} className="fill-brand-600" />
             </div>
             <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">The Post-Event Debrief</h2>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Rate the operational performance of your squad to enhance the platform ecosystem.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <AnimatePresence mode="popLayout">
            {event.eventVendors.map(ev => {
              const isSuccess = reviewedVendors[ev.vendor.id] === 'success';
              const isHidden = reviewedVendors[ev.vendor.id] === true;
              if (isHidden) return null;
              
              const form = reviewForms[ev.vendor.id] || { rating: 0, comment: '' };
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  key={`review-${ev.vendor.id}`} 
                  className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm relative overflow-hidden group"
                >
                  <AnimatePresence>
                  {isSuccess && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-white/95 backdrop-blur-md z-20 flex flex-col items-center justify-center gap-6 text-center p-8"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                        className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center border border-emerald-100 shadow-xl shadow-emerald-50"
                      >
                        <CheckCircle size={48} className="text-emerald-500" />
                      </motion.div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Intelligence Logged</h3>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mt-2 italic">Feedback Transmission Successful</p>
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>

                  <div className="flex items-center gap-5 mb-10">
                    <Avatar src={ev.vendor.owner?.avatarUrl} name={ev.vendor.businessName} size="md" className="rounded-2xl shadow-sm border-4 border-white ring-1 ring-gray-100" />
                    <div>
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight leading-none mb-1">{ev.vendor.businessName}</h3>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{ev.vendor.category}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 mb-10 justify-center bg-gray-50/50 py-6 rounded-[2rem] border border-gray-100">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        onClick={() => setReviewForms(prev => ({ ...prev, [ev.vendor.id]: { ...form, rating: star } }))}
                        className="focus:outline-none transition-all hover:scale-125"
                      >
                        <Star className={`w-10 h-10 ${star <= form.rating ? 'fill-amber-400 text-amber-400 drop-shadow-lg' : 'text-gray-200 hover:text-amber-200 transition-colors'}`} />
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center ml-1">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analytical Context</label>
                       {form.rating > 0 && <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{form.rating}/5 RATING</span>}
                    </div>
                    <textarea
                      value={form.comment}
                      onChange={e => setReviewForms(prev => ({ ...prev, [ev.vendor.id]: { ...form, comment: e.target.value } }))}
                      placeholder="Specify the operational highlights and areas for improvement..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-[2rem] px-6 py-5 text-sm font-medium text-gray-900 placeholder:text-gray-300 focus:outline-none focus:bg-white focus:border-brand-500 transition-all h-36 resize-none shadow-inner"
                    />
                  </div>
                  
                  <button
                    onClick={() => handleSubmitReview(ev.vendor.id)}
                    disabled={!form.rating || submittingReview === ev.vendor.id}
                    className="w-full mt-8 py-5 bg-gray-900 hover:bg-black text-white rounded-[2rem] font-black transition-all disabled:opacity-30 flex items-center justify-center gap-3 text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 active:scale-95"
                  >
                    {submittingReview === ev.vendor.id ? <Loader className="animate-spin" /> : <Zap size={18} />}
                    {submittingReview === ev.vendor.id ? 'TRANSMITTING...' : 'AUTHORISE REVIEW'}
                  </button>
                </motion.div>
              );
            })}
            </AnimatePresence>
            
            {event.eventVendors.every(ev => reviewedVendors[ev.vendor.id]) && (
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-1 md:col-span-2 text-center py-20 bg-brand-50 border border-brand-100 rounded-[3rem] shadow-sm flex flex-col items-center"
              >
                <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-brand-100/50 border border-brand-100">
                   <Target className="w-12 h-12 text-brand-600" />
                </div>
                <h3 className="text-3xl font-black text-brand-900 uppercase tracking-tight">Mission Debrief Complete</h3>
                <p className="text-[10px] font-black text-brand-600 uppercase tracking-[0.3em] mt-3">Platform Intelligence Updated · Squad Ratings Logged</p>
                <button onClick={() => navigate('/events')} className="mt-12 px-10 py-4 bg-brand-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-200 hover:bg-brand-700 transition-all active:scale-95">
                   Return to Command
                </button>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
