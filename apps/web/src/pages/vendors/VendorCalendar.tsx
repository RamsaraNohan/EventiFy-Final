import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isPast, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Loader, AlertCircle, ShieldAlert, Lock, Info, X } from 'lucide-react';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';

interface BlockedDate {
  id: string;
  blockedDate: string;
  notes?: string;
}

export default function VendorCalendar() {
  const [vendor, setVendor] = useState<any>(null);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Controls
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vRes = await api.get('/vendors/me');
        setVendor(vRes.data);
        const bRes = await api.get(`/calendar/${vRes.data.id}`);
        setBlockedDates(bRes.data);
        const bookingsRes = await api.get('/bookings/vendor');
        setBookings(bookingsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Socket Listener for Real-time Sync
    const socket = getSocket();
    if (socket) {
      socket.on('calendarUpdated', (data: { vendorId: string }) => {
        if (vendor && data.vendorId === vendor.id) {
          fetchData();
        }
      });
      return () => {
        socket.off('calendarUpdated');
      };
    }
  }, [vendor?.id]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const handleToggleDate = async (day: Date) => {
    if (!vendor) return;
    const dateStr = format(day, 'yyyy-MM-dd');
    const isInactive = isPast(day) && !isToday(day);
    if (isInactive) return;

    const booking = bookings.find(b => 
      isSameDay(new Date(b.startTime), day) && (b.status === 'CONFIRMED' || b.status === 'PAID_TO_VENDOR')
    );
    if (booking) return;

    const existingBlock = blockedDates.find(d => isSameDay(new Date(d.blockedDate), day));

    try {
      setSubmitting(true);
      if (existingBlock) {
        await api.delete(`/calendar/${existingBlock.id}`);
        setBlockedDates(blockedDates.filter(d => d.id !== existingBlock.id));
      } else {
        const res = await api.post('/calendar/block', {
          vendorId: vendor.id,
          blockedDate: dateStr,
          notes: notes || 'Blocked by vendor'
        });
        setBlockedDates([...blockedDates, res.data]);
        setSelectedDate(null);
        setNotes('');
      }
    } catch (err: any) {
      console.error('Calendar update failed:', err);
      setError(err.response?.data?.message || 'Failed to update calendar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader className="w-10 h-10 text-brand-500 animate-spin" />
      <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Synchronizing Schedule...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10" />
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Availability Master</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Manage restricted dates & operational uptime</p>
        </div>
        <div className="flex items-center gap-3 px-5 py-2.5 bg-brand-50 text-brand-700 rounded-2xl border border-brand-100 font-black text-[10px] uppercase tracking-widest shadow-sm">
          <CalendarIcon size={16} className="text-brand-500" />
          {blockedDates.length} restricted dates
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-4">
                <CalendarIcon className="w-8 h-8 text-brand-600" />
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <div className="flex gap-3">
                <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                  className="w-11 h-11 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-md transition-all">
                  <ChevronLeft size={24} />
                </button>
                <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-11 h-11 flex items-center justify-center bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:bg-white hover:shadow-md transition-all">
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  {d}
                </div>
              ))}
              
              {[...Array(startOfMonth(currentMonth).getDay())].map((_, i) => (
                <div key={`pad-${i}`} className="min-h-[120px] rounded-3xl bg-gray-50/30" />
              ))}

              {days.map(day => {
                const isBlocked = blockedDates.find(d => isSameDay(new Date(d.blockedDate), day));
                const booking = bookings.find(b => 
                  isSameDay(new Date(b.startTime), day) && (b.status === 'CONFIRMED' || b.status === 'PAID_TO_VENDOR')
                );
                const isInactive = isPast(day) && !isToday(day);

                return (
                  <div key={day.toString()} 
                    onClick={() => {
                      if (isInactive || booking) return;
                      if (isBlocked) {
                        handleToggleDate(day);
                      } else {
                        setSelectedDate(day);
                      }
                    }}
                    className={`min-h-[120px] p-4 rounded-3xl relative transition-all cursor-pointer group flex flex-col border-[2px] ${
                      isInactive ? 'bg-gray-50/50 border-transparent opacity-40 cursor-not-allowed' :
                      booking ? 'bg-rose-50 border-rose-100 cursor-not-allowed' :
                      isBlocked ? 'bg-amber-50 border-amber-200 hover:shadow-lg hover:shadow-amber-100/50' : 
                      'bg-white border-gray-100 hover:border-brand-200 hover:shadow-xl hover:shadow-gray-200/40'
                    }`}>
                    <span className={`text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                      isToday(day) ? 'bg-brand-600 text-white shadow-lg shadow-brand-200' : 
                      booking ? 'text-rose-600' :
                      isBlocked ? 'text-amber-600' : 
                      'text-gray-400 group-hover:text-brand-600'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    
                    {booking && (
                      <div className="mt-auto space-y-1">
                        <div className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter inline-block">Booked</div>
                        <p className="text-[10px] font-bold text-rose-500 truncate uppercase mt-0.5 leading-tight">{booking.client?.name}</p>
                      </div>
                    )}

                    {isBlocked && (
                      <div className="mt-auto space-y-1">
                        <div className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter inline-block">Blocked</div>
                        <div className="flex items-center gap-1 mt-1">
                           <Lock size={10} className="text-amber-400 shrink-0" />
                           <p className="text-[9px] font-bold text-amber-500 italic truncate uppercase">{isBlocked.notes || 'No notes'}</p>
                        </div>
                      </div>
                    )}
                    
                    {!isInactive && !booking && !isBlocked && (
                       <div className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[9px] font-black text-brand-600 uppercase tracking-widest flex items-center gap-1">
                             <Lock size={10} /> Mark Private
                          </p>
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar / Info */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-lg font-black text-gray-900 mb-8 uppercase tracking-tight border-b border-gray-50 pb-4">Schedule Insights</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center border border-brand-100 group-hover:scale-110 transition-transform">
                     <CalendarIcon size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Available</span>
                </div>
                <div className="w-10 h-1 text-gray-100 bg-gray-100 rounded-full" />
              </div>
              
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center border border-amber-100 group-hover:scale-110 transition-transform">
                     <Lock size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Restricted</span>
                </div>
                <div className="w-10 h-1 bg-amber-400 rounded-full" />
              </div>

              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center border border-rose-100 group-hover:scale-110 transition-transform">
                     <ShieldAlert size={20} />
                  </div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Client Service</span>
                </div>
                <div className="w-10 h-1 bg-rose-500 rounded-full" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-gray-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 opacity-20 rounded-full blur-3xl -z-0 group-hover:opacity-40 transition-opacity" />
            <div className="relative z-10">
              <Info className="w-8 h-8 mb-4 text-brand-400" />
              <h3 className="text-lg font-black mb-2 uppercase tracking-tight">Security Notice</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-medium">
                Blocking dates prevents clients from initiating booking requests. Use this to mark holidays, maintenance, or high-priority private events.
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-start gap-3 text-rose-600 animate-in shake duration-500">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <p className="text-xs font-black uppercase tracking-tight">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* SELECTED DATE ASSET OVERLAY */}
      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setSelectedDate(null)} />
           <div className="relative bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="h-2 bg-brand-600" />
              <div className="p-10">
                 <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase">Block Date</h2>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                    </div>
                    <button onClick={() => setSelectedDate(null)} className="w-12 h-12 bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-2xl transition-all flex items-center justify-center border border-gray-100">
                        <X size={24} />
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2 ml-1">Privacy / Operation Note</label>
                        <textarea 
                          rows={3}
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="e.g. Private Wedding, System Maintenance..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-3xl p-5 text-gray-900 font-bold focus:outline-none focus:bg-white focus:border-brand-500 transition-all resize-none"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button 
                          onClick={() => setSelectedDate(null)}
                          className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => handleToggleDate(selectedDate)}
                          disabled={submitting}
                          className="flex-1 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-brand-200 transition-all flex items-center justify-center gap-2"
                        >
                          {submitting ? <Loader className="w-4 h-4 animate-spin" /> : <Lock size={16} />}
                          Restrict Date
                        </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
