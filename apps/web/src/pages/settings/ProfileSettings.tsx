import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../lib/auth';
import { api } from '../../lib/api';
import { Shield, Key, User as UserIcon, Camera, Loader, Briefcase, Image as ImageIcon, X, Plus, ShieldCheck, Mail, Globe, MapPin, DollarSign, Wallet, Save } from 'lucide-react';
import { VENDOR_CATEGORIES, CITIES, SRI_LANKAN_BANKS } from '../../lib/constants';
import { Avatar } from '../../components/ui/Avatar';
import { resolveAvatar } from '../../utils/avatar';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileSettings() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [vendorLoading, setVendorLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Vendor Fields
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Photography');
  const [city, setCity] = useState('');
  const [basePrice, setBasePrice] = useState('0');
  const [bankName, setBankName] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);

  // Load current profile on mount
  useEffect(() => {
    api.get('/users/me').then(res => {
      setName(res.data.name || '');
      setPhone(res.data.phone || '');
      setBio(res.data.bio || '');
      setAvatarUrl(res.data.avatarUrl || '');
    }).catch(() => {});

    if (user?.role === 'VENDOR_OWNER') {
      api.get('/vendors/me').then(res => {
        if (res.data) {
          setVendorId(res.data.id);
          setBusinessName(res.data.businessName || '');
          setCategory(res.data.category || 'Photography');
          setCity(res.data.city || '');
          setBasePrice(res.data.basePrice?.toString() || '0');
          setBankName(res.data.bankName || '');
          setBankCode(res.data.bankCode || '');
          setBranchCode(res.data.branchCode || '');
          setAccountName(res.data.accountName || '');
          setAccountNumber(res.data.accountNumber || '');
          setGallery(res.data.gallery || []);
        }
      }).catch(() => {});
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await api.put('/users/me', { name, phone, bio });
      setUser({ ...user!, name: res.data.name, avatarUrl: res.data.avatarUrl });
      setMessage({ type: 'success', text: 'Personal info updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update user profile' });
    } finally { setLoading(false); }
  };

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) {
      setMessage({ type: 'error', text: 'Vendor profile not found.' });
      return;
    }
    setVendorLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put(`/vendors/${vendorId}`, {
        businessName,
        category,
        city,
        basePrice: parseFloat(basePrice) || 0,
        bankName,
        bankCode,
        branchCode,
        accountName,
        accountNumber
      });
      setMessage({ type: 'success', text: 'Business profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update business profile' });
    } finally { setVendorLoading(false); }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const res = await api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setAvatarUrl(res.data.avatarUrl);
      setUser({ ...user!, avatarUrl: res.data.avatarUrl });
      setMessage({ type: 'success', text: 'Profile picture updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to upload image.' });
    } finally { setAvatarLoading(false); }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length || !vendorId) return;

    setGalleryLoading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await api.post(`/vendors/${vendorId}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGallery(res.data.gallery);
      setMessage({ type: 'success', text: 'Gallery updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to upload images.' });
    } finally { setGalleryLoading(false); }
  };

  const handleDeleteImage = async (imageUrl: string) => {
    if (!vendorId) return;
    try {
      const res = await api.delete(`/vendors/${vendorId}/images`, { data: { imageUrl } });
      setGallery(res.data.gallery);
    } catch (err) { console.error(err); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword(''); setNewPassword('');
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 py-8 px-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase">Platform Identity</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">Personalize your credentials and business presence</p>
        </div>
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-5 py-2.5 rounded-2xl shadow-sm">
           <ShieldCheck size={18} className="text-brand-600" />
           <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Encrypted Session</span>
        </div>
      </div>

      <AnimatePresence>
        {message.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-5 rounded-2xl border text-[11px] font-black uppercase tracking-widest flex items-center justify-between shadow-lg ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
              : 'bg-rose-50 border-rose-100 text-rose-600'
          }`}>
             <span>{message.text}</span>
             <button onClick={() => setMessage({ type: '', text: '' })}><X size={14} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* SIDEBAR SETTINGS NAVIGATION */}
        <div className="lg:col-span-1 space-y-8">
           {/* Avatar Hero */}
           <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col items-center text-center group">
              <div className="relative mb-6">
                <div className="absolute -inset-2 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-[2rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
                <Avatar src={avatarUrl} name={user?.name} size="xl" className="rounded-[1.75rem] border-4 border-white shadow-xl relative z-10 group-hover:scale-105 transition-all duration-500" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={avatarLoading}
                  className="absolute -bottom-2 -right-2 w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-xl border-2 border-white z-20 hover:bg-black transition-all active:scale-95"
                >
                  {avatarLoading ? <Loader size={16} className="animate-spin" /> : <Camera size={16} />}
                </button>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{user?.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                 <Mail size={12} className="text-gray-400" />
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate max-w-[150px]">{user?.email}</span>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-50 w-full space-y-4">
                 <div className="flex justify-between items-center bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Rank Status</span>
                    <span className="text-[9px] font-black text-brand-600 uppercase tracking-widest bg-brand-50 px-3 py-1 rounded-lg border border-brand-100">{user?.role?.replace('_', ' ')}</span>
                 </div>
              </div>
           </div>

           <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-gray-200 relative overflow-hidden group/secure">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover/secure:scale-110 transition-transform">
                 <Shield size={100} />
              </div>
              <h4 className="font-black text-lg uppercase tracking-tight mb-4 flex items-center gap-3">
                <ShieldCheck size={24} className="text-brand-500" /> Core Security
              </h4>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">System-wide encryption is active. Your financial settlement data is handled via Tier-1 secure gateways.</p>
           </div>
        </div>

        {/* MAIN SETTINGS FORMS */}
        <div className="lg:col-span-2 space-y-10 overflow-hidden">
          
          {user?.role === 'VENDOR_OWNER' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
                   <Briefcase size={22} />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Business Intelligence</h2>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure your marketplace presence</p>
                </div>
              </div>

              <form onSubmit={handleUpdateVendor} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Identity</label>
                    <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} required
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all uppercase tracking-tight shadow-inner" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domain Focus</label>
                    <div className="relative">
                      <select value={category} onChange={e => setCategory(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all cursor-pointer uppercase tracking-tight appearance-none shadow-inner">
                        {VENDOR_CATEGORIES.map(cat => <option key={cat}>{cat}</option>)}
                      </select>
                      <Globe size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operational City</label>
                    <div className="relative">
                      <select value={city} onChange={e => setCity(e.target.value)} required
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all cursor-pointer uppercase tracking-tight appearance-none shadow-inner">
                        <option value="">Global/Select</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <MapPin size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Base Index (LKR)</label>
                    <div className="relative">
                      <input type="number" value={basePrice} onChange={e => setBasePrice(e.target.value)} required
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all shadow-inner" />
                      <DollarSign size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-10 border-t border-gray-50 space-y-8">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                     <Wallet className="w-4 h-4 text-brand-600" /> Settlement Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Institution</label>
                      <div className="relative">
                        <select 
                          value={bankName} 
                          onChange={e => {
                            setBankName(e.target.value);
                            const bank = SRI_LANKAN_BANKS.find(b => b.name === e.target.value);
                            if (bank) setBankCode(bank.code);
                          }}
                          className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all appearance-none cursor-pointer shadow-inner"
                        >
                          <option value="">Select Bank</option>
                          {SRI_LANKAN_BANKS.map(b => (
                            <option key={b.code} value={b.name}>{b.name}</option>
                          ))}
                        </select>
                        <Globe size={14} className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Settlement Identity</label>
                      <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
                        placeholder="Name as in Bank"
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all shadow-inner" />
                    </div>
                    <div className="md:col-span-1 grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bank Tag</label>
                         <input type="text" value={bankCode} readOnly
                           className="w-full bg-gray-100 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-400 text-center cursor-not-allowed" />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Branch Tag</label>
                         <input type="text" value={branchCode} onChange={e => setBranchCode(e.target.value)} maxLength={3}
                           placeholder="000"
                           className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all text-center shadow-inner" />
                       </div>
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Hash</label>
                      <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-black text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all shadow-inner" />
                    </div>
                  </div>

                  <button type="submit" disabled={vendorLoading}
                    className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl shadow-gray-300 mt-4 active:scale-95">
                    {vendorLoading ? <Loader size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                    Update Business Matrix
                  </button>
                </div>
              </form>

              {/* Gallery Explorer */}
              <div className="mt-20 border-t border-gray-50 pt-16">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                      <ImageIcon size={24} className="text-brand-600" />
                      Visual Portfolio
                    </h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Curate your high-definition showcase</p>
                  </div>
                  <button onClick={() => galleryInputRef.current?.click()} disabled={galleryLoading}
                    className="flex items-center gap-4 px-8 py-3.5 bg-gray-50 hover:bg-white text-brand-600 rounded-2xl text-[10px] font-black border border-gray-100 uppercase tracking-widest transition-all shadow-sm active:scale-95">
                    {galleryLoading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                    Expand Gallery
                  </button>
                  <input ref={galleryInputRef} type="file" multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  {gallery.map((img, i) => (
                    <div key={i} className="relative group aspect-[4/3] rounded-[2rem] overflow-hidden border-4 border-white shadow-xl bg-gray-100 group">
                      <img src={resolveAvatar(img) || ''} alt={`gallery-${i}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                        <button onClick={() => handleDeleteImage(img)}
                          className="w-12 h-12 bg-rose-600 text-white rounded-2xl shadow-xl transition-all hover:scale-110 flex items-center justify-center active:scale-90">
                          <X size={24} />
                        </button>
                        <span className="text-[9px] font-black text-white uppercase tracking-widest mt-4">Delete Entry</span>
                      </div>
                    </div>
                  ))}
                  {gallery.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-[2.5rem]">
                      <ImageIcon className="w-16 h-16 text-gray-200 mb-6" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Your portfolio ecosystem is empty</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Profile Delta */}
            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
                   <UserIcon size={22} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Personal Identity</h2>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Primary Telecom</label>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+94 77 000 0000"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Public Biography</label>
                  <textarea value={bio} onChange={e => setBio(e.target.value)} rows={4} placeholder="Establishing your persona..."
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all resize-none shadow-inner" />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-gray-100 active:scale-95">
                  {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />} Commit Info
                </button>
              </form>
            </div>

            {/* Security Protocol */}
            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center border border-gray-100 shadow-sm">
                   <Key size={22} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Security Protocol</h2>
              </div>
              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-rose-500">Current Key</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all shadow-inner" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 text-emerald-500">New Strategic Key</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-sm text-gray-900 focus:outline-none focus:bg-white focus:border-brand-500 transition-all shadow-inner" />
                </div>
                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                   <p className="text-[9px] font-black text-amber-700 uppercase tracking-widest leading-relaxed">
                     Strong keys utilize 12+ characters including non-alphanumeric entities to prevent entropy attacks.
                   </p>
                </div>
                <button type="submit" disabled={loading || !newPassword || !currentPassword}
                  className="w-full py-5 bg-brand-600 hover:bg-brand-700 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-brand-100 active:scale-95">
                  {loading ? <Loader size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Update Protocol
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
