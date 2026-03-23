import { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

export default function AdminEmailTool() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await api.post('/admin/test-email', { email });
      setResult({ type: 'success', msg: res.data.message });
      setEmail('');
    } catch (err: any) {
      setResult({ type: 'error', msg: err.response?.data?.message || 'Failed to dispatch test email.' });
    }
    setLoading(false);
  };

  return (
    <div className="bg-surface-card border border-border-main rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full blur-3xl -z-10 opacity-50" />
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-sm">
           <Mail size={24} />
        </div>
        <div>
           <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">System Diagnostics</h3>
           <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Email Deliverability Controller</p>
        </div>
      </div>

      <form onSubmit={handleTest} className="space-y-6">
        <div className="space-y-2">
           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Recipient Address</label>
           <div className="relative group">
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@eventify.lk"
                className="w-full bg-surface-muted/50 border border-border-main rounded-2xl px-6 py-4 text-sm font-bold text-text-main placeholder-gray-300 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all"
              />
           </div>
        </div>

        <button 
          type="submit"
          disabled={loading || !email}
          className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl active:scale-95 text-xs uppercase tracking-widest group"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
          {loading ? 'Dispatching...' : 'Run Connectivity Test'}
        </button>
      </form>

      {result && (
        <div className={`mt-8 p-5 rounded-2xl border flex items-center gap-4 animate-in slide-in-from-top-2 duration-300 ${
          result.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          {result.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <p className="text-xs font-black uppercase tracking-tight">{result.msg}</p>
        </div>
      )}

      <div className="mt-8 pt-8 border-t border-border-main">
         <div className="flex items-start gap-3">
            <AlertCircle size={16} className="text-brand-400 mt-0.5" />
            <p className="text-[10px] text-gray-400 font-bold leading-relaxed uppercase">
              Tests real-world SendGrid connectivity. Ensure <code className="bg-gray-100 px-1 rounded text-brand-600">SENDGRID_API_KEY</code> is correctly configured in the production environment.
            </p>
         </div>
      </div>
    </div>
  );
}
