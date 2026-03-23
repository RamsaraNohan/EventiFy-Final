import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';

export default function CheckoutPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const type = searchParams.get('type') || 'booking';

  

  useEffect(() => {
    const endpoint = type === 'event-vendor' 
      ? `/payments/checkout/event-vendor/${id}`
      : `/payments/checkout/${id}`;

    api.get(endpoint)
      .then(res => {
        setPaymentData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id, type]);


  if (loading) return (
    <div className="p-20 text-center text-primary-400 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin mb-4" />
      Preparing Secure Checkout...
    </div>
  );

  if (!paymentData) return (
    <div className="p-20 text-center space-y-4">
      <div className="text-accent-400 text-xl font-bold">Unable to initialize checkout session.</div>
      <p className="text-slate-500">Perhaps the payment is already processed or the link expired.</p>
      <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-8 animate-in fade-in duration-700">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-brand-600 uppercase tracking-[0.2em] transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-brand-50 group-hover:border-brand-100 transition-all">
          <ArrowLeft size={16} />
        </div>
        Back to Event
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* SUMMARY PANEL */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-50 rounded-full blur-[80px] -z-10 group-hover:scale-125 transition-transform duration-1000" />
          
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-100">
              <CreditCard size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Project Budget</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Settlement Matrix v1.0</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Service Description</span>
              <p className="text-sm font-black text-gray-900 uppercase tracking-tight mt-2 leading-relaxed">
                {paymentData.items}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Escrow Fee</span>
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Included</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between items-end px-2">
                <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1">Total Impact</span>
                <div className="text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase mr-2 tracking-widest">{paymentData.currency}</span>
                  <span className="text-4xl font-black text-brand-600 tracking-tighter tabular-nums drop-shadow-sm">
                    {Number(paymentData.amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 p-5 bg-brand-50 border border-brand-100 rounded-3xl flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
               <ShieldCheck size={20} className="text-brand-600" />
            </div>
            <p className="text-[10px] font-bold text-brand-700 uppercase tracking-widest leading-relaxed">
              Secured by PayHere Institutional Escrow. Funds are protected until milestone validation.
            </p>
          </div>
        </div>

        {/* INTERACTION PANEL */}
        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-200 mb-8 border border-gray-100 shadow-inner">
            <CreditCard size={48} />
          </div>
          
          <div className="mb-10 max-w-xs">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Initialize Gateway</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed px-4">
              Click below to proceed to our secure bank-grade payment interface.
            </p>
          </div>

          <form action="https://sandbox.payhere.lk/pay/checkout" method="post" className="w-full">
            <input type="hidden" name="merchant_id" value={paymentData.merchant_id} />
            <input type="hidden" name="return_url" value={`${window.location.origin}/events?payhere_success=true&order_id=${paymentData.order_id}&merchant_id=${paymentData.merchant_id}&amount=${paymentData.amount}&currency=${paymentData.currency}`} />
            <input type="hidden" name="cancel_url" value={`${window.location.origin}/events?payment_cancel=true`} />
            <input type="hidden" name="notify_url" value={`http://host.docker.internal:8000/payments/notify`} /> 
            <input type="hidden" name="order_id" value={paymentData.order_id} />
            <input type="hidden" name="items" value={paymentData.items} />
            <input type="hidden" name="currency" value={paymentData.currency} />
            <input type="hidden" name="amount" value={paymentData.amount} />
            <input type="hidden" name="first_name" value={paymentData.first_name} />
            <input type="hidden" name="last_name" value={paymentData.last_name} />
            <input type="hidden" name="email" value={paymentData.email} />
            <input type="hidden" name="phone" value={paymentData.phone} />
            <input type="hidden" name="address" value={paymentData.address} />
            <input type="hidden" name="city" value={paymentData.city} />
            <input type="hidden" name="country" value={paymentData.country} />
            <input type="hidden" name="hash" value={paymentData.hash} />

            <button type="submit" className="btn-primary w-full shadow-2xl shadow-brand-100 py-5">
              Launch Secure Gateway
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
