import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { format } from 'date-fns';
import { Download, CheckCircle, Clock, CreditCard, Loader2, Wallet, ArrowRight, ShieldCheck, History, DollarSign, AlertTriangle, Building2 } from 'lucide-react';
import { useAuthStore } from '../../lib/auth';
import { getSocket } from '../../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';



interface Transaction {
  id: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: string;
  metadata?: any;
  user?: { name: string; email: string };
  booking?: {
    vendor?: {
      businessName: string;
    }
  }
}

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmPayout, setConfirmPayout] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();

    const socket = getSocket();
    if (socket) {
      socket.on('transaction:update', fetchTransactions);
      socket.on('payment:success', fetchTransactions);
      return () => {
        socket.off('transaction:update', fetchTransactions);
        socket.off('payment:success', fetchTransactions);
      };
    }
  }, [user?.role]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const endpoint = user?.role === 'ADMIN' ? '/admin/transactions' : '/payments/transactions';
      const res = await api.get(endpoint);
      setTransactions(res.data || []);
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayout = async (tx: Transaction) => {
    setConfirmPayout(tx);
  };

  const executePayout = async () => {
    if (!confirmPayout) return;
    const txId = confirmPayout.id;
    setConfirmPayout(null);
    setProcessingId(txId);
    try {
      await api.post(`/admin/transactions/${txId}/payout`);
      fetchTransactions();
    } catch (error) {
      console.error('Payout failed', error);
      alert('Payout failed. Check console for details.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const apiBase = 'http://localhost:8000';
      // REMOVED /api/ prefix as it is not present in app.ts routes
      const endpoint = user?.role === 'ADMIN' ? '/admin/transactions/export' : '/payments/transactions/export';
      
      const res = await fetch(`${apiBase}${endpoint}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        const text = await res.text();
        console.error('Export server error:', text);
        throw new Error(`Server error ${res.status}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `eventify-transactions-${date}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
      alert('Export failed. Please ensure the server is responding correctly.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
      <span className="text-gray-400 font-black text-xs uppercase tracking-widest">Accessing Financial Ledger...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white border border-gray-100 p-8 rounded-[3rem] shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10 transition-transform duration-1000 group-hover:scale-110" />
        <div>
           <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg">
                 <Wallet size={20} />
              </div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Institutional Finance</span>
           </div>
           <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none">Financial Ledger</h1>
           <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-2">
             {user?.role === 'ADMIN' ? 'Platform-wide settlement matrix and transaction history.' : 'Comprehensive record of your project investments.'}
           </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-3 px-8 py-4 bg-gray-50 hover:bg-white text-gray-900 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? 'Generating CSV...' : 'Export Intel'}
          </button>
          
          <div className="hidden lg:flex items-center gap-3 bg-brand-50 border border-brand-100 px-5 py-3 rounded-2xl shadow-sm">
             <ShieldCheck size={18} className="text-brand-600" />
             <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">Verified Vault</span>
          </div>
        </div>
      </div>

      {/* RECENT STATS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex items-center gap-6">
            <div className="w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center border border-brand-100">
               <History size={28} />
            </div>
            <div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transaction Count</span>
               <p className="text-2xl font-black text-gray-900">{transactions.length}</p>
            </div>
         </div>
         <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
               <DollarSign size={28} />
            </div>
            <div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Settlement Volume (80%)</span>
               <p className="text-2xl font-black text-gray-900">LKR {transactions.reduce((acc, t) => acc + (Number(t.amount) * 0.8), 0).toLocaleString()}</p>
            </div>
         </div>
         <div className="bg-brand-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-brand-100 flex items-center justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl -z-0" />
            <div className="relative z-10">
               <h4 className="font-black text-lg uppercase tracking-tight">Need Settlement?</h4>
               <p className="text-[9px] font-black text-brand-100 uppercase tracking-widest">Contact treasury for support</p>
            </div>
            <ArrowRight size={24} className="relative z-10 group-hover:translate-x-2 transition-transform" />
         </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Stream</h3>
           <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
        </div>
        
        <div className="overflow-x-auto overflow-y-auto max-h-[800px] custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Ref</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Legal Actor</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operational Status</th>
                <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Volume</th>
                {user?.role === 'ADMIN' && <th className="px-10 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Protocol</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              <AnimatePresence initial={false}>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={user?.role === 'ADMIN' ? 6 : 5} className="px-10 py-32 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <CreditCard className="w-16 h-16 text-gray-100" />
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No transaction data available in stream</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((t, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      key={t.id} 
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-10 py-8 text-xs font-mono font-black text-gray-400 uppercase">
                        #{t.id.split('-')[0]}
                      </td>
                      <td className="px-10 py-8">
                         <span className="text-[11px] font-black text-gray-500 uppercase tracking-tight">
                            {format(new Date(t.createdAt), 'MMM d, yyyy · HH:mm')}
                         </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
                            {t.user?.name || t.booking?.vendor?.businessName || 'Platform Ops'}
                          </span>
                          {t.user?.email && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest lowercase">{t.user.email}</span>}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center space-x-2">
                           {t.status === 'COMPLETED' ? (
                            <span className="flex items-center gap-2 text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1 rounded-lg font-black uppercase tracking-widest shadow-sm">
                              <CheckCircle className="w-3 h-3" /> Settled
                            </span>
                          ) : t.status === 'PAID_TO_VENDOR' ? (
                            <span className="flex items-center gap-2 text-[9px] bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1 rounded-lg font-black uppercase tracking-widest shadow-sm">
                              <CheckCircle className="w-3 h-3" /> Disbursed
                            </span>
                          ) : (
                            <span className="flex items-center gap-2 text-[9px] bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1 rounded-lg font-black uppercase tracking-widest shadow-sm">
                              <Clock className="w-3 h-3" /> {t.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right underline underline-offset-4 decoration-gray-100">
                        <span className="text-sm font-black text-gray-900">
                          {t.currency} {(t.amount * 0.8).toLocaleString()}
                        </span>
                      </td>
                      {user?.role === 'ADMIN' && (
                        <td className="px-10 py-8 text-center">
                          {t.status === 'COMPLETED' ? (
                            <button 
                              onClick={() => handlePayout(t)}
                              disabled={processingId === t.id}
                              className="text-[9px] font-black uppercase tracking-widest bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-2 mx-auto"
                            >
                              {processingId === t.id ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                              {processingId === t.id ? 'TX...' : 'Payout'}
                            </button>
                          ) : (
                             <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Protocol Met</span>
                          )}
                        </td>
                      )}
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      <AnimatePresence>
        {confirmPayout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100"
            >
              <div className="bg-brand-600 p-10 text-white relative">
                <div className="absolute top-0 right-0 p-8 opacity-20"><DollarSign size={80} /></div>
                <h2 className="text-3xl font-black uppercase tracking-tight relative z-10">Authorize Payout</h2>
                <p className="text-brand-100 text-[10px] font-black uppercase tracking-[0.2em] mt-2 relative z-10">Institutional Fund Disbursement</p>
              </div>

              <div className="p-10 space-y-8">
                <div className="flex items-center gap-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-brand-600 shadow-sm"><Building2 size={24} /></div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Target Recipient</p>
                    <p className="text-lg font-black text-gray-900 uppercase tracking-tight">{confirmPayout.booking?.vendor?.businessName || 'Platform Partner'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Settlement Amount (80%)</span>
                      <span className="text-xl font-black text-gray-900">{confirmPayout.currency} {(confirmPayout.amount * 0.8).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center px-2 border-t border-gray-100 pt-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Transfer Reference</span>
                      <span className="text-xs font-mono font-black text-brand-600 uppercase">TX-{confirmPayout.id.substring(0,8)}</span>
                   </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4">
                   <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                   <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wide leading-relaxed">
                      This action will trigger an immediate fund transfer via PayHere Sandbox. Please ensure bank details are verified before proceeding.
                   </p>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setConfirmPayout(null)}
                    className="flex-1 px-8 py-5 bg-gray-50 hover:bg-gray-100 text-gray-400 font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executePayout}
                    className="flex-1 px-8 py-5 bg-gray-900 hover:bg-black text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-gray-200"
                  >
                    Confirm & Execute
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
