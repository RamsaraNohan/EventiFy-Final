import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuthStore } from '../../lib/auth';
import { getSocket } from '../../lib/socket';
import { api } from '../../lib/api';
import { Send, Image as ImageIcon, MessageSquare, Check, CheckCheck, Search, Loader2, Plus, ArrowLeft, MoreVertical, Phone, Video, Info, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar } from '../../components/ui/Avatar';

interface User { id: string; name: string; avatarUrl?: string; role: string; email?: string; }

interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  attachments: string[];
  createdAt: string;
  readAt: string | null;
  status?: 'sending' | 'sent' | 'error';
  sender?: User;
}

interface Conversation {
  id: string;
  vendorId: string | null;
  clientUserId: string | null;
  adminUserId: string | null;
  lastMessageAt: string;
  client?: User;
  vendor?: { id: string; businessName: string; owner?: User };
  messages: Message[];
}

let tempIdCounter = 0;

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    fetchConversations();
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      setMessages(prev => {
        const withoutOptimistic = prev.filter(m => !m.id.startsWith('temp_') || m.body !== msg.body);
        if (withoutOptimistic.some(m => m.id === msg.id)) return withoutOptimistic;
        return [...withoutOptimistic, { ...msg, status: 'sent' }];
      });
      setConversations(prev => {
        const exists = prev.find(c => c.id === msg.conversationId);
        if (!exists) {
           fetchConversations();
           return prev;
        }
        return prev.map(c => c.id === msg.conversationId ? { ...c, messages: [msg], lastMessageAt: msg.createdAt } : c)
          .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
      });
      if (msg.conversationId === activeConversationId && msg.senderUserId !== user?.id) {
        api.patch(`/conversations/${msg.conversationId}/messages/${msg.id}/read`).catch(() => {});
      }
    };

    socket.on('message:new', handleNewMessage);
    
    socket.on('message:read', ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, readAt: new Date().toISOString() } : m));
    });

    socket.on('message:read:all', ({ conversationId }: { conversationId: string }) => {
      if (conversationId === activeConversationId) {
        setMessages(prev => prev.map(m => ({ ...m, readAt: m.readAt || new Date().toISOString() })));
      }
    });

    return () => { 
      socket.off('message:new', handleNewMessage); 
      socket.off('message:read');
      socket.off('message:read:all');
    };
  }, [activeConversationId, user?.id]);

  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      const socket = getSocket();
      if (socket) socket.emit('conversation:join', activeConversationId);
      api.patch(`/conversations/${activeConversationId}/read-all`).catch(() => {});
      return () => { if (socket) socket.emit('conversation:leave', activeConversationId); };
    }
  }, [activeConversationId]);

  useEffect(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (userSearchQuery.length > 1) {
      const delay = setTimeout(() => {
        searchUsers(userSearchQuery);
      }, 500);
      return () => clearTimeout(delay);
    } else {
      setUserSearchResults([]);
    }
  }, [userSearchQuery]);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations/with-meta');
      setConversations(res.data);
      if (res.data.length > 0 && !activeConversationId) {
        setActiveConversationId(res.data[0].id);
      }
    } catch (error) { console.error(error); }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await api.get(`/conversations/${id}/messages`);
      setMessages(res.data.map((m: Message) => ({ ...m, status: 'sent' })));
    } catch (error) { console.error(error); }
  };

  const searchUsers = async (q: string) => {
    setSearchingUsers(true);
    try {
      // Admin can use /admin/users if standard /users is limited
      const endpoint = user?.role === 'ADMIN' ? `/admin/users?q=${q}` : `/users?q=${q}`;
      const res = await api.get(endpoint);
      const items = res.data.rows || res.data;
      setUserSearchResults(items.filter((u: User) => u.id !== user?.id).slice(0, 8));
    } catch (err) {
      console.error(err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startConversation = async (targetUser: User) => {
    try {
      const payload: any = {};
      if (targetUser.role === 'VENDOR_OWNER') payload.vendorId = targetUser.id; // Usually vendor ID is needed, but backend might handle user ID
      else if (targetUser.role === 'CLIENT') payload.clientId = targetUser.id;
      else payload.adminId = targetUser.id;

      // The backend /conversations endpoint usually handles target orchestration
      const res = await api.post('/conversations', { targetUserId: targetUser.id });
      const newConv = res.data;
      
      setConversations(prev => {
        if (prev.some(c => c.id === newConv.id)) return prev;
        return [newConv, ...prev];
      });
      setActiveConversationId(newConv.id);
      setShowUserSearch(false);
      setUserSearchQuery('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    const tempId = `temp_${++tempIdCounter}`;
    const optimisticMsg: Message = {
      id: tempId,
      conversationId: activeConversationId,
      senderUserId: user!.id,
      body: newMessage,
      attachments: [],
      createdAt: new Date().toISOString(),
      readAt: null,
      status: 'sending',
    };

    setMessages(prev => [...prev, optimisticMsg]);
    const msgToSend = newMessage;
    setNewMessage('');

    try {
      const res = await api.post(`/conversations/${activeConversationId}/messages`, { body: msgToSend });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...res.data, status: 'sent' } : m));
    } catch {
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    }
  }, [newMessage, activeConversationId, user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeConversationId) return;
    setUploading(true);

    const tempId = `temp_${++tempIdCounter}`;
    const previewUrl = URL.createObjectURL(file);
    const optimisticMsg: Message = {
      id: tempId,
      conversationId: activeConversationId,
      senderUserId: user!.id,
      body: file.type.startsWith('image/') ? '' : `📎 ${file.name}`,
      attachments: [previewUrl],
      createdAt: new Date().toISOString(),
      readAt: null,
      status: 'sending',
    };
    setMessages(prev => [...prev, optimisticMsg]);

    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadRes = await api.post('/conversations/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const res = await api.post(`/conversations/${activeConversationId}/messages`, {
        body: file.type.startsWith('image/') ? '' : `📎 ${file.name}`,
        attachments: [uploadRes.data.url]
      });
      setMessages(prev => prev.map(m => m.id === tempId ? { ...res.data, status: 'sent' } : m));
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'error' } : m));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getChatPartnerName = (conv: Conversation) => {
    if (user?.role === 'CLIENT') return conv.vendor?.businessName || conv.client?.name || 'Admin';
    if (user?.role === 'VENDOR_OWNER') return conv.client?.name || 'Client';
    return conv.client?.name || conv.vendor?.businessName || 'System';
  };

  const getChatPartnerAvatar = (conv: Conversation) => {
    if (user?.role === 'CLIENT') return conv.vendor?.owner?.avatarUrl;
    if (user?.role === 'VENDOR_OWNER') return conv.client?.avatarUrl;
    return conv.client?.avatarUrl || conv.vendor?.owner?.avatarUrl;
  };

  const filteredConversations = conversations.filter(c =>
    getChatPartnerName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden h-[calc(100dvh-120px)] sm:h-[calc(100vh-140px)] shadow-2xl shadow-gray-200/50 animate-in fade-in duration-700">
      
      {/* Sidebar - Contacts */}
      <div className={`w-full lg:w-[380px] border-r border-gray-100 flex flex-col bg-gray-50/50 ${activeConversationId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-8 pb-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Messages</h2>
            <button 
              onClick={() => setShowUserSearch(!showUserSearch)} 
              className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all shadow-sm border ${
                showUserSearch ? 'bg-gray-900 text-white border-black rotate-180' : 'bg-white text-brand-600 border-gray-100 hover:scale-105 active:scale-95'
              }`}
            >
              {showUserSearch ? <ArrowLeft size={18} /> : <Plus size={18} />}
            </button>
          </div>
          
          <div className="relative group">
            {showUserSearch ? (
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                 <input
                   type="text"
                   placeholder="Global directory search..."
                   autoFocus
                   value={userSearchQuery}
                   onChange={e => setUserSearchQuery(e.target.value)}
                   className="w-full bg-white border border-brand-500/30 rounded-2xl py-3.5 pl-11 pr-4 text-[11px] font-black uppercase tracking-widest text-gray-900 focus:outline-none ring-4 ring-brand-500/5 shadow-xl shadow-brand-100/20"
                 />
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Filter conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl py-3.5 pl-11 pr-4 text-[11px] font-black uppercase tracking-widest text-gray-900 placeholder:text-gray-300 focus:outline-none focus:border-brand-500/50 transition-all shadow-sm"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {showUserSearch ? (
            <div className="space-y-2">
               {searchingUsers ? (
                 <div className="p-10 text-center flex flex-col items-center gap-4">
                   <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                   <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Scanning Network...</span>
                 </div>
               ) : userSearchResults.length === 0 ? (
                 <div className="p-10 text-center flex flex-col items-center gap-2">
                    <UserPlus size={32} className="text-gray-200" />
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                      {userSearchQuery.length < 2 ? 'Enter 2+ characters' : 'Identity not found'}
                    </p>
                 </div>
               ) : (
                 userSearchResults.map(u => (
                  <button key={u.id} onClick={() => startConversation(u)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-brand-500 hover:shadow-lg hover:shadow-brand-100 transition-all text-left group">
                    <Avatar src={u.avatarUrl} name={u.name} size="md" className="flex-shrink-0 rounded-xl" />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-brand-600 truncate">{u.name}</p>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">{u.role.replace('_', ' ')}</p>
                    </div>
                  </button>
                 ))
               )}
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isActive = activeConversationId === conv.id;
              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`w-full text-left p-4 rounded-3xl transition-all duration-300 border mb-1 flex items-center gap-4 ${
                    isActive ? 'bg-white border-brand-200 shadow-xl shadow-gray-200 ring-4 ring-brand-500/5' : 'bg-transparent border-transparent hover:bg-white hover:border-gray-100 hover:shadow-md'
                  }`}
                >
                  <Avatar src={getChatPartnerAvatar(conv)} name={getChatPartnerName(conv)} size="md" className="flex-shrink-0 rounded-2xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className={`text-sm font-black uppercase tracking-tight truncate ${isActive ? 'text-brand-600' : 'text-gray-900'}`}>{getChatPartnerName(conv)}</span>
                      <span className="text-[9px] font-black text-gray-400 ml-2">
                        {format(new Date(conv.lastMessageAt), 'h:mm a')}
                      </span>
                    </div>
                    <p className={`text-[11px] font-medium truncate ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                      {conv.messages?.[0]?.body || 'Encrypted transmission established'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Engine */}
      {activeConversationId ? (
        <div className={`flex-1 flex flex-col bg-white ${activeConversationId ? 'flex' : 'hidden lg:flex'}`}>
          <div className="px-4 sm:px-8 py-5 border-b border-gray-100 flex items-center justify-between shadow-sm relative z-10">
             <div className="flex items-center gap-3 sm:gap-5">
                <button 
                  onClick={() => setActiveConversationId(null)}
                  className="lg:hidden p-2 text-gray-400 hover:text-gray-900"
                >
                  <ArrowLeft size={20} />
                </button>
                <Avatar 
                  src={activeConversation ? getChatPartnerAvatar(activeConversation) : undefined} 
                  name={activeConversation ? getChatPartnerName(activeConversation) : '?'} 
                  size="md" 
                  className="rounded-2xl border-2 border-white shadow-sm ring-1 ring-gray-100"
                />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-black text-gray-900 uppercase tracking-tight truncate">{activeConversation ? getChatPartnerName(activeConversation) : 'Synchronizing...'}</h3>
                  <p className="text-[9px] text-emerald-500 font-black tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> <span className="hidden sm:inline">Stream Operational</span><span className="sm:hidden">Active</span>
                  </p>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"><Phone size={18} /></button>
                <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"><Video size={18} /></button>
                <button className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"><MoreVertical size={18} /></button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-gray-50/20">
            {messages.map((msg, idx) => {
              const isMine = msg.senderUserId === user?.id;
              const isFirstInGroup = idx === 0 || messages[idx-1].senderUserId !== msg.senderUserId;
              
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`flex flex-col max-w-[75%] ${isMine ? 'items-end' : 'items-start'} gap-1.5`}>
                    {!isMine && isFirstInGroup && (
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1">{getChatPartnerName(activeConversation!)}</span>
                    )}
                    <div className={`px-5 py-3.5 rounded-[1.5rem] shadow-sm transform transition-all hover:scale-[1.01] ${
                      isMine 
                        ? 'bg-gray-900 text-white rounded-tr-none shadow-gray-200' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                    } ${msg.status === 'sending' ? 'opacity-50' : ''}`}>
                      {msg.body && <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.body}</p>}
                      {msg.attachments?.map((url, i) => (
                        <div key={i} className="mt-3 rounded-2xl overflow-hidden border border-gray-100 shadow-xl max-w-sm group/img">
                           <img src={url} alt="attachment" className="w-full h-auto cursor-pointer group-hover:scale-105 transition-transform duration-500" onClick={() => window.open(url, '_blank')} />
                        </div>
                      ))}
                    </div>
                    <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-tighter ${isMine ? 'text-gray-400' : 'text-gray-300'}`}>
                      {format(new Date(msg.createdAt), 'h:mm a')}
                      {isMine && (msg.readAt ? <CheckCheck size={12} className="text-brand-500" /> : <Check size={12} />)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-8 bg-white border-t border-gray-50">
            <form onSubmit={handleSendMessage} className="bg-gray-50 border border-gray-100 rounded-[2rem] p-2 flex items-center gap-2 shadow-inner focus-within:bg-white focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/5 transition-all">
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                disabled={uploading} 
                className="w-12 h-12 flex items-center justify-center text-gray-400 hover:text-brand-600 hover:bg-white rounded-2xl transition-all disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon size={20} />}
              </button>
              <input 
                type="text" 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Secure transmission encrypted..."
                className="flex-1 bg-transparent border-none py-3 px-2 text-sm font-bold text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-0"
              />
              <button 
                type="submit" 
                disabled={!newMessage.trim()} 
                className="w-12 h-12 flex items-center justify-center bg-gray-900 hover:bg-black text-white rounded-2xl transition-all disabled:opacity-30 shadow-lg shadow-gray-200 active:scale-90"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-20 bg-gray-50/20 text-center">
          <div className="w-24 h-24 bg-white border border-gray-100 rounded-3xl flex items-center justify-center text-gray-100 mb-8 shadow-sm">
             <MessageSquare size={48} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">Communication Nexus</h2>
          <p className="text-gray-400 font-medium max-w-sm mb-10 leading-relaxed">Bridge the gap between vision and execution. Select a secure stream to begin collaboration.</p>
          <button onClick={() => setShowUserSearch(true)} className="px-10 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 transition-all active:scale-95">
            Initialise New Connection
          </button>
        </div>
      )}
    </div>
  );
}
