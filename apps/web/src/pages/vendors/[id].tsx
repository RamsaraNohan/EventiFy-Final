import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, MessageSquare, ShieldCheck, X, Calendar, Plus, ChevronRight, Loader, DollarSign, CheckCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { format } from 'date-fns';
import StarRating from '../../components/ui/StarRating';
import { Avatar } from '../../components/ui/Avatar';
import { fmtLKR } from '../../utils/dateFormat';

function SaveButton({ vendorId }: { vendorId: string }) {
  const [saved, setSaved] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    api.get('/saved-vendors').then(r => {
      const list = r.data.data ?? [];
      setSaved(list.some((s: any) => s.vendorId === vendorId));
    }).catch(console.error);
  }, [vendorId, user]);

  const toggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const prev = saved;
    setSaved(!prev); 
    try {
      if (prev) await api.delete(`/saved-vendors/${vendorId}`);
      else await api.post('/saved-vendors', { vendorId });
    } catch {
      setSaved(prev);
    }
  };

  if (!user) return null;

  return (
    <button onClick={toggle} className="absolute top-6 left-6 w-12 h-12 bg-white/90 hover:bg-white backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl transition-all hover:scale-110 active:scale-90 group z-20">
      <Star size={24} className={`transition-all ${saved ? 'fill-rose-500 text-rose-500 scale-110' : 'text-gray-400 group-hover:text-rose-400'}`} />
    </button>
  );
}

interface Event {
  id: string;
  name: string;
  date: string;
  status: string;
}

export default function VendorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [vendor, setVendor] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add to event modal
  const [showAddToEvent, setShowAddToEvent] = useState(false);
  const [myEvents, setMyEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [agreedCost, setAgreedCost] = useState('');
  const [adding, setAdding] = useState(false);
  const [addResult, setAddResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.get(`/vendors/${id}`)
      .then(res => { setVendor(res.data); setLoading(false); })
      .catch(() => setLoading(false));

    api.get(`/reviews/${id}`)
      .then(res => setReviews(res.data))
      .catch(err => console.error(err));
  }, [id]);

  const openAddToEvent = async () => {
    if (!user) { navigate('/login'); return; }
    setShowAddToEvent(true);
    setAddResult(null);
    setSelectedEventId('');
    setAgreedCost(vendor?.basePrice ? String(vendor.basePrice) : '');
    setEventsLoading(true);
    try {
      const res = await api.get('/events');
      setMyEvents(res.data.filter((e: any) => e.status !== 'COMPLETED'));
    } catch { /* ignore */ }
    setEventsLoading(false);
  };

  const handleAddToEvent = async () => {
    if (!selectedEventId) { setAddResult({ type: 'error', text: 'Please select an event first.' }); return; }
    setAdding(true);
    setAddResult(null);
    try {
      const res = await api.post(`/events/${selectedEventId}/vendors`, {
        vendorId: vendor.id,
        agreedCost: parseFloat(agreedCost) || null,
      });
      setAddResult({ type: 'success', text: `Reservation confirmed! Redirecting to secure payment...` });
      setTimeout(() => { 
        setShowAddToEvent(false); 
        navigate(`/checkout/${res.data.id}?type=event-vendor`); 
      }, 1500);
    } catch (err: any) {
      console.error('Add to Event Error:', err.response?.data);
      const msg = err.response?.data?.message || 'Failed to add vendor to event.';
      setAddResult({ type: 'error', text: msg });
    }
    setAdding(false);
  };

  const handleMessageVendor = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      await api.post('/conversations', { vendorId: vendor.id });
      navigate('/messages');
    } catch (err: any) { console.error(err); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader className="w-10 h-10 text-brand-500 animate-spin" />
    </div>
  );
  if (!vendor) return <div className="p-20 text-center text-gray-400 font-medium">Vendor not found.</div>;

  const isClient = user?.role === 'CLIENT';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">

      {/* Hero Banner - Premium Rounded Design */}
      <div className="h-80 md:h-[400px] w-full rounded-[3rem] bg-gray-900 relative overflow-hidden flex items-end shadow-2xl shadow-purple-900/10">
        <img 
          src={vendor.owner?.avatarUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80'} 
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 hover:scale-100 transition-transform duration-1000" 
          alt={vendor.businessName}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/30 to-transparent" />
        
        <SaveButton vendorId={vendor.id} />

        <div className="relative z-10 p-10 md:p-14 w-full flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-brand-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-purple-500/20">
                {vendor.category}
              </span>
              {vendor.approved && (
                <span className="flex items-center text-[10px] font-black text-emerald-400 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-emerald-500/30 uppercase tracking-[0.1em]">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Verified Expert
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight uppercase">{vendor.businessName}</h1>
            <p className="text-gray-300 font-medium flex items-center text-lg md:text-xl">
              <MapPin className="w-6 h-6 mr-2 text-brand-400" />{vendor.city || 'Colombo, Sri Lanka'}
            </p>
          </div>
          
          <div className="flex gap-4 shrink-0">
            <button onClick={handleMessageVendor}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-3.5 rounded-2xl font-black transition-all border border-white/20 flex items-center gap-2 shadow-xl hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest">
              <MessageSquare className="w-5 h-5" /> Message
            </button>
            {isClient && (
              <button onClick={openAddToEvent}
                className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3.5 rounded-2xl font-black transition-all flex items-center gap-2 shadow-2xl shadow-brand-500/40 hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest">
                <Plus className="w-5 h-5" /> Add to Event
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">

        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10" />
            <h2 className="text-2xl font-black text-gray-900 mb-6 tracking-tight uppercase">About {vendor.businessName}</h2>
            <p className="text-gray-500 leading-relaxed whitespace-pre-line text-lg font-medium italic">
              "{vendor.description || 'Dedicated to creating unforgettable experiences through premium event services tailored to your unique needs.'}"
            </p>
            
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Base Price</span>
                <span className="text-2xl font-black text-gray-900 tracking-tighter">{fmtLKR(vendor.basePrice)}</span>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-3">Community Rating</span>
                <StarRating rating={vendor.rating} count={vendor.reviewCount} size="lg" />
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center text-center">
                <span className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">Home Base</span>
                <span className="text-lg font-black text-gray-900 tracking-tight uppercase">{vendor.city || 'Sri Lanka'}</span>
              </div>
            </div>
          </div>

          {/* Services */}
          {(vendor.services?.length > 0 || true) && (
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase">Exclusive Offerings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(vendor.services?.length > 0 ? vendor.services : ['Event Consultation', 'Day-of Management', 'Custom Logistics']).map((service: string, i: number) => (
                  <div key={i} className="flex items-center gap-4 text-gray-700 bg-gray-50 p-5 rounded-2xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/30 transition-all cursor-default group">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5 text-brand-600" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wide">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gallery */}
          {vendor.gallery?.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
              <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight uppercase">Portfolio Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vendor.gallery.map((img: string, i: number) => (
                  <div key={i} className="group relative overflow-hidden rounded-3xl h-48 border border-gray-100 shadow-sm">
                    <img src={img} alt={`portfolio-${i}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-brand-600/0 group-hover:bg-brand-600/10 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Guest Experiences</h2>
              <span className="text-[10px] font-black text-brand-600 bg-brand-50 px-4 py-1.5 rounded-full border border-brand-100 uppercase tracking-widest">{reviews.length} total reviews</span>
            </div>
            {reviews.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 border border-dashed border-gray-200 rounded-3xl flex flex-col items-center">
                <MessageSquare className="w-10 h-10 text-gray-300 mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Be the first to share your experience</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((r: any) => (
                  <div key={r.id} className="bg-gray-50 border border-gray-100 p-8 rounded-[2rem] transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 group">
                    <div className="flex justify-between items-start mb-6">
                       <div className="flex items-center gap-4">
                         <Avatar 
                           src={r.client?.avatarUrl} 
                           name={r.client?.name} 
                           size="md" 
                           className="shadow-sm border-2 border-white"
                         />
                         <div>
                            <p className="text-gray-900 font-black text-sm uppercase tracking-tight">{r.client?.name || 'Trusted Client'}</p>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">{format(new Date(r.createdAt), 'MMMM d, yyyy')}</p>
                         </div>
                       </div>
                       <div className="flex gap-1 bg-white px-3 py-1.5 rounded-xl shadow-sm">
                         {[...Array(5)].map((_, i) => (
                           <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'}`} />
                         ))}
                       </div>
                    </div>
                    {r.comment && <p className="text-gray-600 text-sm leading-relaxed font-medium italic group-hover:text-gray-900 transition-colors">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Stats + CTA */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 sticky top-24 shadow-xl shadow-gray-200/20">
            <h3 className="text-xl font-black text-gray-900 mb-6 tracking-tight uppercase border-b border-gray-100 pb-4">Booking Details</h3>
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Starting Price</span>
                <span className="text-lg font-black text-gray-900 tracking-tighter">{fmtLKR(vendor.basePrice)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-brand-50 rounded-2xl border border-brand-100">
                <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest pl-1">Booking Deposit (50%)</span>
                <span className="text-lg font-black text-brand-700 tracking-tighter">{fmtLKR(Number(vendor.basePrice || 0) * 0.5)}</span>
              </div>
              <p className="text-[10px] text-gray-400 font-bold leading-relaxed px-1">
                Prices vary based on custom requirements. Secure your date with a 50% advance payment. Remaining balance settled post-event.
              </p>
            </div>
            
            {isClient ? (
              <button 
                onClick={openAddToEvent}
                className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-gray-200 active:scale-95 text-xs uppercase tracking-[0.1em]"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Add to My Planner
              </button>
            ) : (
              <div className="text-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Client Access Only</p>
                <button onClick={() => navigate('/login')} className="mt-2 text-brand-600 font-black text-xs hover:underline">LOG IN TO BOOK</button>
              </div>
            )}
          </div>

          <div className="bg-brand-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-brand-200 relative overflow-hidden">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
             <ShieldCheck className="w-8 h-8 mb-4 opacity-80" />
             <h4 className="font-black text-lg mb-2 uppercase tracking-tight">EventiFy Secure</h4>
             <p className="text-xs text-brand-100 leading-relaxed font-medium">All bookings are protected by our escrow system. We only release final payment once you confirm the service was delivered.</p>
          </div>
        </div>
      </div>

      {/* ADD TO EVENT MODAL */}
      {showAddToEvent && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 w-full max-w-lg shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-brand-300" />
            
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Reserve your date</h2>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Booking for {vendor.businessName}</p>
              </div>
              <button onClick={() => setShowAddToEvent(false)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {addResult && (
              <div className={`p-4 rounded-2xl mb-8 flex items-center gap-3 border animate-in zoom-in-95 ${
                addResult.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {addResult.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
                <p className="text-sm font-bold">{addResult.text}</p>
              </div>
            )}

            {eventsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                 <Loader className="w-10 h-10 text-brand-500 animate-spin" />
                 <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Searching your events...</span>
              </div>
            ) : myEvents.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-3xl border border-gray-100">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-900 font-black text-lg uppercase tracking-tight mb-2">No active events</h3>
                <p className="text-gray-400 text-sm font-medium mb-8 max-w-[240px] mx-auto">You'll need an active event planner to start booking vendors.</p>
                <button 
                  onClick={() => { setShowAddToEvent(false); navigate('/events'); }}
                  className="px-8 py-3 bg-brand-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-purple-100"
                >
                  Create My First Event
                </button>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block ml-1">Select Event Planner</label>
                  <div className="grid gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {myEvents.map(evt => {
                      const eventDateStr = new Date(evt.date).toISOString().split('T')[0];
                      const isBlocked = vendor.availabilities?.some((a: any) => a.blockedDate === eventDateStr);

                      return (
                        <button key={evt.id} 
                          onClick={() => !isBlocked && setSelectedEventId(evt.id)}
                          disabled={isBlocked}
                          className={`w-full text-left p-5 rounded-2xl border transition-all relative group ${
                            isBlocked ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' :
                            selectedEventId === evt.id
                              ? 'bg-brand-50 border-brand-500 ring-4 ring-brand-500/5'
                              : 'bg-white border-gray-100 hover:border-gray-300'
                          }`}>
                          <div className="flex justify-between items-center">
                            <div className="min-w-0">
                              <p className={`font-black uppercase tracking-tight truncate ${selectedEventId === evt.id ? 'text-brand-900' : 'text-gray-900'}`}>{evt.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Calendar size={12} className={selectedEventId === evt.id ? 'text-brand-500' : 'text-gray-400'} />
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedEventId === evt.id ? 'text-brand-600' : 'text-gray-400'}`}>
                                  {format(new Date(evt.date), 'MMM d, yyyy')}
                                </p>
                              </div>
                              {isBlocked && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-2">Vendor Unavailable</p>}
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isBlocked ? 'border-gray-200 bg-gray-100' :
                              selectedEventId === evt.id ? 'border-brand-600 bg-brand-600 scale-110' : 'border-gray-200 group-hover:border-gray-300'
                            }`}>
                               {selectedEventId === evt.id && <ChevronRight size={14} className="text-white" />}
                               {isBlocked && <X size={12} className="text-gray-400" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                       Agreed Project Cost (LKR)
                    </label>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">Deposit: 50%</span>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500">
                       <DollarSign size={18} />
                    </div>
                    <input
                      type="number"
                      value={agreedCost}
                      onChange={e => setAgreedCost(e.target.value)}
                      placeholder={`Service base: ${Number(vendor.basePrice || 0)}`}
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-4 text-gray-900 font-black tracking-tight focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleAddToEvent} 
                  disabled={adding || !selectedEventId || !agreedCost}
                  className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-gray-200 group active:scale-95 text-xs uppercase tracking-[0.2em]"
                >
                  {adding ? <Loader className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 group-hover:scale-125 transition-transform" />}
                  {adding ? 'Securing date...' : 'Confirm Reservation'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
