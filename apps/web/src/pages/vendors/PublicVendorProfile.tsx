import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Loader, Star, ChevronRight, DollarSign, X } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import { getSocket } from '../../lib/socket';
import StarRating from '../../components/ui/StarRating';
import { Avatar } from '../../components/ui/Avatar';
import { fmtLKR } from '../../utils/dateFormat';

export default function PublicVendorProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendor = () => {
      api.get(`/vendors/${id}`)
        .then(res => { setVendor(res.data); setLoading(false); })
        .catch(() => setLoading(false));
    };

    fetchVendor();

    const socket = getSocket();
    if (socket) {
      socket.on('calendarUpdated', (data: { vendorId: string }) => {
        if (id === data.vendorId) {
          fetchVendor();
        }
      });
      return () => {
        socket.off('calendarUpdated');
      };
    }
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader className="w-10 h-10 text-brand-500 animate-spin" />
    </div>
  );

  if (!vendor) return (
    <div className="p-20 text-center animate-in fade-in duration-500">
      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-100">
         <X size={40} className="text-gray-300" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Partner Not Found</h2>
      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">The requested vendor profile does not exist in our registry</p>
      <Link to="/" className="inline-block mt-8 text-brand-600 font-black text-xs uppercase tracking-widest hover:underline">Return to Hub</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in duration-700">
      {/* Public Hero */}
      <div className="h-80 md:h-[450px] w-full rounded-[3.5rem] bg-gray-900 relative overflow-hidden flex items-end shadow-2xl">
        <img 
          src={vendor.gallery?.[0] || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80'} 
          className="absolute inset-0 w-full h-full object-cover opacity-50" 
          alt={vendor.businessName}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
        
        <div className="relative z-10 p-10 md:p-16 w-full flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="bg-brand-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                {vendor.category}
              </span>
              {vendor.approved && (
                <span className="flex items-center text-[10px] font-black text-emerald-400 bg-white/5 backdrop-blur-md px-5 py-2 rounded-full border border-emerald-500/20 uppercase tracking-[0.1em]">
                  <ShieldCheck className="w-4 h-4 mr-2" /> Verified Partner
                </span>
              )}
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none uppercase">{vendor.businessName}</h1>
            <p className="text-gray-300 font-bold flex items-center text-xl uppercase tracking-tight">
              <MapPin className="w-6 h-6 mr-3 text-brand-500" />{vendor.city || 'Sri Lanka'}
            </p>
          </div>
          
          <div className="flex flex-col gap-4">
             {!isAuthenticated && (
               <div className="bg-white/10 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 space-y-4">
                  <p className="text-[10px] font-black text-brand-300 uppercase tracking-[0.2em] text-center">New to EventiFy?</p>
                  <button onClick={() => navigate('/register')}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-xl shadow-brand-500/20 text-xs uppercase tracking-widest active:scale-95">
                    Create Account to Book
                  </button>
               </div>
             )}
             {isAuthenticated && (
                <button onClick={() => navigate(`/vendors/${vendor.id}`)}
                  className="bg-white text-gray-900 px-10 py-5 rounded-[2rem] font-black transition-all shadow-2xl flex items-center justify-center gap-3 hover:-translate-y-1 active:scale-95 text-sm uppercase tracking-widest group">
                  Go to Private Profile <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 px-4">
        {/* Left: Info */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase border-l-8 border-brand-600 pl-6">The Essence</h2>
            <p className="text-xl text-gray-500 leading-relaxed font-medium italic opacity-80">
              "{vendor.description || 'Elevating celebrations with unparalleled expertise.'}"
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="bg-surface-card border border-border-main p-8 rounded-[2.5rem] space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                   <DollarSign size={24} />
                </div>
                <h4 className="font-black text-lg uppercase tracking-tight text-text-main">Pricing Index</h4>
                <p className="text-text-muted text-sm font-bold uppercase tracking-widest">Starting from {fmtLKR(vendor.basePrice)}</p>
             </div>
             <div className="bg-surface-card border border-border-main p-8 rounded-[2.5rem] space-y-4 shadow-sm">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                   <Star size={24} />
                </div>
                <h4 className="font-black text-lg uppercase tracking-tight text-text-main">Performance</h4>
                <div className="flex items-center gap-3">
                   <span className="text-2xl font-black text-text-main">{vendor.rating?.toFixed(1) || '5.0'}</span>
                   <StarRating rating={vendor.rating} count={vendor.reviewCount} size="sm" />
                </div>
             </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Core Services</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {(vendor.services?.length > 0 ? vendor.services : ['Event Consultation', 'Day-of Management']).map((s: string, i: number) => (
                 <div key={i} className="flex items-center gap-4 bg-surface-muted/50 p-6 rounded-2xl border border-border-main hover:bg-white transition-all cursor-default">
                    <ShieldCheck className="text-brand-600" size={20} />
                    <span className="text-sm font-black text-text-main uppercase tracking-tight">{s}</span>
                 </div>
               ))}
            </div>
          </div>

          {vendor.gallery?.length > 0 && (
            <div className="space-y-8">
              <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Portfolio Highlights</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {vendor.gallery.map((img: string, i: number) => (
                  <div key={i} className="aspect-square rounded-[2rem] overflow-hidden border-2 border-border-main shadow-lg">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">
           <div className="bg-gray-900 rounded-[3rem] p-10 text-white sticky top-24 shadow-2xl relative overflow-hidden group">
              <h3 className="font-black text-2xl uppercase tracking-tight mb-6">Reservation Hub</h3>
              <div className="space-y-6 mb-10">
                 <div className="flex justify-between items-center pb-4 border-b border-white/10">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Base Rate</span>
                    <span className="text-xl font-black text-white">{fmtLKR(vendor.basePrice)}</span>
                 </div>
                 <div className="flex justify-between items-center text-emerald-400">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
                    <span className="text-sm font-black uppercase">Available</span>
                 </div>
              </div>
              
              <button onClick={() => navigate('/login')}
                className="w-full py-5 bg-white text-gray-900 font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all text-xs uppercase tracking-widest mb-4">
                Sign In to Reserve
              </button>
           </div>
           
           <div className="bg-surface-card border border-border-main rounded-[2.5rem] p-10 space-y-6">
              <h4 className="font-black text-gray-900 uppercase tracking-tight">Managed By</h4>
              <div className="flex items-center gap-4">
                 <Avatar src={vendor.owner?.avatarUrl} name={vendor.owner?.name} size="lg" />
                 <div>
                    <p className="font-black text-gray-900 uppercase tracking-tight">{vendor.owner?.name}</p>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Verified Owner</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
