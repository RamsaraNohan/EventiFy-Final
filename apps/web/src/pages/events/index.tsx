import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, MapPin, Users, Clock, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { getSocket } from '../../lib/socket';
import EventStepper from '../../components/ui/EventStepper';
import { StatusBadge } from '../../components/ui/StatusBadge';



type EventStatus = 'PLANNING' | 'VENDORS_PENDING' | 'PAYMENT_PENDING' | 'ONGOING' | 'EVENT_SOON' | 'COMPLETED' | 'PAYMENT_OVERDUE' | 'FULLY_PAID';

interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  budget: number;
  status: EventStatus;
  daysLeft: number;
  eventVendors?: any[];
}

interface CreateEventForm { name: string; date: string; location: string; budget: string; }

function CountdownBadge({ eventDate }: { eventDate: string | Date }) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(eventDate);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - now.getTime()) / 86400000);

  if (diffDays === 0) return (
    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full letter-spacing-widest animate-pulse">
      TODAY
    </span>
  );
  if (diffDays === 1) return (
    <span className="text-red-500 text-xs font-bold flex items-center gap-1">
      <Clock className="w-3 h-3" /> Tomorrow
    </span>
  );
  if (diffDays > 0 && diffDays <= 7) return (
    <span className="text-red-500 text-xs font-bold flex items-center gap-1">
      <Clock className="w-3 h-3" /> In {diffDays} days
    </span>
  );
  if (diffDays > 7) return (
    <span className="text-gray-400 text-xs flex items-center gap-1">
      <Clock className="w-3 h-3" /> In {diffDays} days
    </span>
  );
  return (
    <span className="text-gray-400 text-xs flex items-center gap-1">
      <Clock className="w-3 h-3" /> {Math.abs(diffDays)} days ago
    </span>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreateEventForm>({ name: '', date: '', location: '', budget: '' });
  const [creating, setCreating] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => { 
    const payhereSuccess = searchParams.get('payhere_success');
    if (payhereSuccess === 'true') {
      const order_id = searchParams.get('order_id');
      const merchant_id = searchParams.get('merchant_id');
      const amount = searchParams.get('amount');
      const currency = searchParams.get('currency');

      if (order_id && merchant_id && amount && currency) {
        api.post('/payments/notify', {
          merchant_id,
          order_id,
          payhere_amount: amount,
          payhere_currency: currency,
          status_code: '2',
          md5sig: 'SIMULATED_SIGNATURE',
          payment_id: 'PAY-' + Math.random().toString(36).substring(7).toUpperCase()
        }, { headers: { 'x-simulation': 'true' } })
        .then(() => {
          fetchEvents();
          navigate('/events', { replace: true });
        })
        .catch(err => console.error('Simulated webhook failed:', err));
      }
    } else {
      fetchEvents(); 
    }

    const socket = getSocket();
    if (socket) {
      socket.on('payment:success', fetchEvents);
      return () => {
        socket.off('payment:success', fetchEvents);
      };
    }
  }, [searchParams, navigate]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events');
      setEvents(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/events', { ...form, budget: parseFloat(form.budget) || 0 });
      setShowCreate(false);
      setForm({ name: '', date: '', location: '', budget: '' });
      fetchEvents();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Events</h1>
          <p className="text-gray-400 mt-1">Plan and manage all your events in one place</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-200 active:scale-95">
          <Plus className="w-5 h-5" />
          New Event
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Event</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-1.5 ml-1">Event Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Raman's Wedding" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all" />
              </div>
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-1.5 ml-1">Event Date *</label>
                <input required type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all" />
              </div>
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-1.5 ml-1">Location</label>
                <input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="e.g. Colombo, Sri Lanka" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all" />
              </div>
              <div>
                <label className="block text-gray-500 text-sm font-medium mb-1.5 ml-1">Total Budget (LKR)</label>
                <input type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))}
                  placeholder="e.g. 500000" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-1 focus:ring-brand-500 transition-all" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 border border-gray-200 text-gray-400 hover:text-gray-600 font-medium rounded-xl transition-all hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-purple-100">
                  {creating && <Loader className="w-4 h-4 animate-spin" />}
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 rounded-3xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No events yet</h3>
          <p className="text-gray-400 mb-8 max-w-xs">Create your first event to start your planning journey with EventiFy.</p>
          <button onClick={() => setShowCreate(true)} className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold shadow-lg shadow-purple-200 transition-all active:scale-95">
            Create My First Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map(event => {
            const vendorCount = event.eventVendors?.length || 0;
            const allTasks = event.eventVendors?.flatMap((ev: any) => ev.tasks || []) || [];
            const completedTasks = allTasks.filter((t: any) => t.status === 'COMPLETED').length;
            const totalTasks = allTasks.length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <button key={event.id} onClick={() => navigate(`/events/${event.id}`)}
                className="text-left bg-white border border-gray-100 rounded-3xl p-6 transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 group">
                
                <div className="flex justify-between items-start mb-4">
                  <StatusBadge status={event.status} />
                  <CountdownBadge eventDate={event.date} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-brand-600 transition-colors uppercase tracking-tight">{event.name}</h3>

                <div className="space-y-1.5 mb-4 mt-3">
                  <p className="text-sm text-gray-400 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-400" />
                    {format(new Date(event.date), 'MMMM d, yyyy')}
                  </p>
                  {event.location && (
                    <p className="text-sm text-gray-400 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-400" />{event.location}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mb-4 mt-auto">
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5" />{vendorCount} vendor{vendorCount !== 1 ? 's' : ''}
                  </span>
                  {event.budget > 0 && (
                    <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">LKR {event.budget.toLocaleString()}</span>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50">
                  <EventStepper status={event.status} />
                </div>

                {totalTasks > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5 uppercase tracking-wider">
                      <span>Task Progress</span>
                      <span>{completedTasks}/{totalTasks}</span>
                    </div>
                    <div className="w-full bg-gray-50 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.3)]" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
