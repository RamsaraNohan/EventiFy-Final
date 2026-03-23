import { useState, useEffect } from 'react';
import { Users, ShieldCheck, AlertCircle, TrendingUp, CheckCircle, XCircle, UserCog } from 'lucide-react';
import { api } from '../../../lib/api';

type Tab = 'vendors' | 'users';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('vendors');
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ totalUsers: 0, activeVendors: 0, pendingApprovals: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, approvedRes, usersRes] = await Promise.all([
        api.get('/vendors/pending'),
        api.get('/vendors'),
        api.get('/users')
      ]);
      
      setPendingVendors(pendingRes.data);
      setAllUsers(usersRes.data);
      setMetrics({
        totalUsers: usersRes.data.length,
        activeVendors: approvedRes.data.length,
        pendingApprovals: pendingRes.data.length
      });
    } catch (err) {
      console.error("Admin data fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorStatus = async (id: string, approved: boolean) => {
    try {
      await api.patch(`/vendors/${id}/status`, { approved });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserRole = async (id: string, newRole: string) => {
    try {
      await api.patch(`/users/${id}/role`, { role: newRole });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Oversight</h1>
          <p className="text-slate-400 text-sm mt-1">Platform-wide metrics and management nexus.</p>
        </div>
      </div>

      {/* Admin Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard label="Total Platform Users" value={metrics.totalUsers} icon={Users} color="text-primary-400" />
        <MetricCard label="Verified Vendors" value={metrics.activeVendors} icon={ShieldCheck} color="text-emerald-400" />
        <MetricCard label="Pending Moderation" value={metrics.pendingApprovals} icon={AlertCircle} color="text-amber-400" />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'vendors' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          Vendor Approvals
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
        >
          User Database
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel p-6">
          {activeTab === 'vendors' ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-primary-400" />
                  Vendor Approval Queue
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 font-semibold">Business Name</th>
                      <th className="px-4 py-3 font-semibold">Category</th>
                      <th className="px-4 py-3 font-semibold">Owner</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Syncing with nexus...</td></tr>
                    ) : pendingVendors.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Queue is empty.</td></tr>
                    ) : (
                      pendingVendors.map((vendor) => (
                        <tr key={vendor.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4">
                            <div className="text-white font-medium">{vendor.businessName}</div>
                            <div className="text-xs text-slate-500">{vendor.city}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-xs font-bold text-primary-400 bg-primary-500/10 px-2 py-1 rounded">
                              {vendor.category}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-slate-300">{vendor.owner?.name}</div>
                            <div className="text-xs text-slate-500">{vendor.owner?.email}</div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex justify-end space-x-2">
                              <button onClick={() => handleVendorStatus(vendor.id, false)} className="p-2 text-slate-400 hover:text-rose-400"><XCircle className="w-5 h-5" /></button>
                              <button onClick={() => handleVendorStatus(vendor.id, true)} className="p-2 text-slate-400 hover:text-emerald-400"><CheckCircle className="w-5 h-5" /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center">
                  <UserCog className="w-5 h-5 mr-2 text-primary-400" />
                  User Identity Database
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/5 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Syncing database records...</td></tr>
                    ) : (
                      allUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-white/5 transition-colors">
                          <td className="px-4 py-4">
                            <div className="text-white font-medium">{u.name}</div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </td>
                          <td className="px-4 py-4">
                            <select 
                              value={u.role}
                              onChange={(e) => handleUserRole(u.id, e.target.value)}
                              className="bg-[#0f111a] border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-primary-500"
                            >
                              <option value="CLIENT">CLIENT</option>
                              <option value="VENDOR_OWNER">VENDOR_OWNER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-400">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-4 text-right text-xs text-rose-500 cursor-pointer hover:underline">
                            Suspend
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 bg-white/5 rounded-2xl border border-white/10 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
