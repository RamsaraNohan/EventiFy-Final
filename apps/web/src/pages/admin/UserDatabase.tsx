import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Users, Shield, UserCheck, UserX, Search, Filter, Building2, ShieldCheck, Mail, Calendar, MessageSquare, MoreVertical, Loader } from 'lucide-react';
import { Avatar } from '../../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';

const SEGMENTS = [
  { label: 'All Community',       filter: null,           icon: Users,      color: 'blue' },
  { label: 'Verified Vendors',    filter: 'VENDOR_OWNER', icon: Building2,  color: 'emerald' },
  { label: 'Registered Clients',  filter: 'CLIENT',       icon: UserCheck,  color: 'amber' },
] as const;

export default function UserDatabase() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data.rows);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      await api.patch(`/admin/users/${id}`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) { console.error(err); }
  };

  const handleDeactivate = async (id: string, active: boolean) => {
    try {
      await api.patch(`/admin/users/${id}`, { active });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active } : u));
    } catch (err) { console.error(err); }
  };

  const handleMessageUser = async (user: any) => {
    try {
      await api.post('/conversations', { 
        vendorId: user.role === 'VENDOR_OWNER' ? user.vendorProfile?.id : undefined,
        clientId: user.role === 'CLIENT' ? user.id : undefined,
        adminId: user.role === 'ADMIN' ? user.id : undefined
      });
      navigate('/messages');
    } catch (err) { console.error(err); }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase());
    
    let matchesSegment = activeSegment ? u.role === activeSegment : u.role !== 'ADMIN';
    if (activeSegment === 'VENDOR_OWNER') {
      matchesSegment = u.role === 'VENDOR_OWNER' && u.vendorProfile?.approved === true;
    }
    
    return matchesSearch && matchesSegment;
  });

  const counts = {
    all: users.filter(u => u.role !== 'ADMIN').length,
    VENDOR_OWNER: users.filter(u => u.role === 'VENDOR_OWNER' && u.vendorProfile?.approved).length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    CLIENT: users.filter(u => u.role === 'CLIENT').length,
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-6 space-y-10 animate-in fade-in duration-700">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-full blur-[100px] -z-10" />
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight uppercase leading-none mb-2">User Directory</h1>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Manage Security, Permissions & Platform Roles</p>
        </div>
        <div className="text-right">
           <span className="text-3xl font-black text-gray-900 tracking-tighter">{users.filter(u => u.role !== 'ADMIN').length}</span>
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Global Identities</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LEFTSIDE FILTERS */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <Filter size={14} className="text-brand-600" /> Segmentation
            </h3>
            <div className="space-y-2">
              {SEGMENTS.map(seg => {
                const isActive = activeSegment === seg.filter;
                const count = seg.filter === null ? counts.all : counts[seg.filter as keyof typeof counts];
                return (
                  <button
                    key={seg.label}
                    onClick={() => setActiveSegment(seg.filter)}
                    className={`w-full text-left px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group ${
                      isActive
                        ? 'bg-gray-900 text-white shadow-xl shadow-gray-200'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-900 border border-gray-100'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <seg.icon size={14} className={isActive ? 'text-brand-400' : 'text-gray-300 group-hover:text-brand-500'} />
                      {seg.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${isActive ? 'bg-white/10 text-brand-300' : 'bg-white text-gray-400 border border-gray-100'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="bg-brand-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-brand-100 relative overflow-hidden group">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
             <ShieldCheck size={32} className="mb-6 opacity-80" />
             <h4 className="font-black text-lg mb-2 uppercase tracking-tight leading-none">Access Control</h4>
             <p className="text-[10px] text-brand-100 font-bold uppercase tracking-wider leading-relaxed">Modify permissions with extreme caution. Administrator role grants global system-level access to all platform resources.</p>
          </div>
        </div>

        {/* RIGHTSIDE DIRECTORY */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-600 transition-colors">
              <Search size={22} />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or digital signature..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-[2rem] py-5 pl-16 pr-8 text-gray-900 font-black tracking-tight placeholder:text-gray-300 placeholder:font-bold focus:outline-none focus:ring-4 focus:ring-brand-500/5 focus:border-brand-500 transition-all shadow-sm"
            />
          </div>

          <div className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Identity Details</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Platform Role</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Operational Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={4} className="px-8 py-20 text-center"><Loader className="w-10 h-10 animate-spin text-brand-500 mx-auto" /></td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No records found matching criteria</td></tr>
                  ) : filteredUsers.map((u) => (
                    <tr key={u.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-5">
                          <Avatar 
                            src={u.avatarUrl} 
                            name={u.name} 
                            size="md" 
                            className="rounded-2xl shadow-sm border-2 border-white ring-1 ring-gray-100 group-hover:scale-110 transition-transform" 
                          />
                          <div>
                            <div className="text-gray-900 font-black text-sm uppercase tracking-tight leading-none mb-1 group-hover:text-brand-600 transition-colors">{u.name}</div>
                            <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold tracking-wider">
                               <Mail size={10} /> {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                             u.role === 'ADMIN' ? 'bg-brand-50 text-brand-600 border border-brand-100' :
                             u.role === 'VENDOR_OWNER' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                             'bg-gray-50 text-gray-500 border border-gray-100'
                          }`}>
                            {u.role === 'ADMIN' ? <Shield size={16} /> :
                             u.role === 'VENDOR_OWNER' ? <Building2 size={16} /> :
                             <Users size={16} />}
                          </div>
                          <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">
                             {u.role.replace('_', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <span className={`text-[9px] font-black px-3 py-1 rounded-full border uppercase tracking-widest shadow-sm ${
                            u.active !== false ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
                          }`}>
                            {u.active !== false ? 'Operational' : 'Restricted'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                           <button
                             onClick={() => handleMessageUser(u)}
                             className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-brand-600 hover:border-brand-100 rounded-xl transition-all shadow-sm"
                             title="Direct Message"
                           >
                             <MessageSquare size={16} />
                           </button>
                           <button
                             onClick={() => handleRoleChange(u.id, u.role === 'ADMIN' ? 'CLIENT' : 'ADMIN')}
                             className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-brand-600 hover:border-brand-100 rounded-xl transition-all shadow-sm"
                             title={u.role === 'ADMIN' ? 'Demote to Client' : 'Elevate to Admin'}
                           >
                             <Shield size={16} />
                           </button>
                           <button
                             onClick={() => handleDeactivate(u.id, u.active !== false ? false : true)}
                             className={`p-2.5 bg-white border border-gray-100 rounded-xl transition-all shadow-sm ${
                               u.active !== false ? 'text-gray-400 hover:text-rose-600 hover:border-rose-100' : 'text-gray-400 hover:text-emerald-600 hover:border-emerald-100'
                             }`}
                             title={u.active !== false ? 'Restrict Access' : 'Restore Access'}
                           >
                             {u.active !== false ? <UserX size={16} /> : <UserCheck size={16} />}
                           </button>
                           <button className="p-2.5 bg-white border border-gray-100 text-gray-400 hover:text-gray-900 rounded-xl transition-all shadow-sm">
                              <MoreVertical size={16} />
                           </button>
                         </div>
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:hidden flex items-center justify-end gap-1">
                            <Calendar size={12} /> {new Date(u.createdAt).toLocaleDateString()}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
