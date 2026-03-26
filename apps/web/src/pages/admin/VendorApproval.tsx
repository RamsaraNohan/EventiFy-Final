import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Check, X, Building2, MapPin, MessageSquare, ShieldCheck, Info, Loader, Clock } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';

interface Vendor {
  id: string;
  businessName: string;
  category: string;
  city: string;
  description: string;
  owner?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }
}

export default function VendorApproval() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingVendors();
  }, []);

  const fetchPendingVendors = async () => {
    try {
      const res = await api.get('/admin/vendors/pending');
      setVendors(res.data);
    } catch (error) {
      console.error('Failed to load pending vendors', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/vendors/${id}/approve`);
      setVendors(prev => prev.filter(v => v.id !== id));
    } catch (error) {
      console.error('Approval failed', error);
    }
  };

  const handleMessageOwner = async (v: Vendor) => {
    if (!v.owner?.id) return;
    try {
      await api.post('/conversations', { vendorId: v.id });
      navigate('/messages');
    } catch (err) { console.error(err); }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader className="w-10 h-10 text-brand-500 animate-spin" />
      <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Reviewing Applications...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 rounded-full blur-[100px] -z-10" />
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none mb-2">Vendor Gatekeeper</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs mt-1">Verify business standards & authorize marketplace access</p>
        </div>
        <div className="text-right">
           <span className="text-3xl font-black text-amber-600 tracking-tighter">{vendors.length}</span>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Pending Review</p>
        </div>
      </div>

      {vendors.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-[3rem] p-24 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-8 border border-emerald-100 shadow-sm">
             <ShieldCheck size={40} />
          </div>
          <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">Operational Excellence</h3>
          <p className="text-gray-400 font-medium max-w-sm">All pending vendor applications have been processed. Marketplace distribution is at 100% efficiency.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {vendors.map((v) => (
            <div key={v.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:shadow-gray-200/30 transition-all group relative overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-10">
                
                {/* Visual Section */}
                <div className="w-full lg:w-72 shrink-0 space-y-4">
                   <div className="relative group/avatar aspect-square w-full">
                      <Avatar 
                        src={v.owner?.avatarUrl} 
                        name={v.businessName} 
                        size={288} 
                        className="rounded-[2.5rem] shadow-2xl border-4 border-white ring-1 ring-gray-100 transition-transform group-hover/avatar:scale-[1.02] duration-500" 
                      />
                      <div className="absolute top-4 right-4 bg-amber-400 text-white px-4 py-1.5 rounded-full shadow-lg border-2 border-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                         <Clock size={12} /> Awaiting Approval
                      </div>
                   </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 space-y-8 py-2">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                         <div className="flex items-center gap-3 mb-2">
                            <span className="bg-brand-50 text-brand-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-brand-100">{v.category}</span>
                            <span className="text-gray-300 font-bold text-xs flex items-center gap-1"><MapPin size={14} /> {v.city}</span>
                         </div>
                         <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight leading-none">{v.businessName}</h3>
                      </div>
                      <div className="flex gap-3">
                         <button 
                           onClick={() => handleApprove(v.id)}
                           className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 transition-all active:scale-95"
                         >
                           <Check size={16} /> Authorize Application
                         </button>
                         <button className="p-4 bg-white border border-gray-100 text-gray-300 hover:text-rose-600 hover:border-rose-100 rounded-2xl transition-all shadow-sm active:scale-95">
                           <X size={20} />
                         </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Info size={14} className="text-brand-500" /> Business Narrative
                         </h4>
                         <div className="bg-gray-50/50 border border-gray-100 p-6 rounded-[2rem] italic">
                            <p className="text-gray-600 text-sm leading-relaxed font-bold">"{v.description}"</p>
                         </div>
                         
                         <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                            <Avatar src={v.owner?.avatarUrl} name={v.owner?.name} size="sm" className="rounded-xl" />
                            <div className="flex-1">
                               <p className="text-gray-900 font-black text-xs uppercase tracking-tight">{v.owner?.name}</p>
                               <p className="text-gray-400 text-[9px] font-bold lowercase">{v.owner?.email}</p>
                            </div>
                            <button onClick={() => handleMessageOwner(v)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-brand-600 rounded-xl transition-all">
                               <MessageSquare size={16} />
                            </button>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Building2 size={14} className="text-emerald-500" /> Financial Underwriting
                         </h4>
                         <div className="bg-emerald-50/30 border border-emerald-100 p-6 rounded-[2rem] space-y-4">
                            <div className="flex justify-between items-center border-b border-emerald-100/50 pb-3">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Settlement Bank</span>
                               <span className="text-xs font-black text-emerald-700 uppercase">{(v as any).bankName || 'NOT PROVIDED'}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-emerald-100/50 pb-3">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Account Holder</span>
                               <span className="text-xs font-black text-emerald-700 uppercase">{(v as any).accountName || v.businessName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acc Number</span>
                               <span className="text-xs font-mono font-black text-gray-900">{(v as any).accountNumber || 'MISSING'}</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-[0.1em] px-2">
                            <ShieldCheck size={12} /> KYC Verification Suggested
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FOOTER ADVISORY */}
      <div className="bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 flex items-center gap-6">
         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-sm shrink-0">
            <Info size={24} />
         </div>
         <p className="text-xs font-bold text-gray-500 uppercase tracking-wide leading-relaxed">
            By authorizing a vendor, you confirm that their business identity has been verified and their service portfolio aligns with platform quality standards. Approved vendors gain immediate access to the marketplace.
         </p>
      </div>
    </div>
  );
}
