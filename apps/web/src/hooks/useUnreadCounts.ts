import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';

export function useUnreadCounts() {
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchCounts = async () => {
    try {
      const [notifRes, msgRes] = await Promise.all([
        api.get('/notifications/unread-count').catch(() => ({ data: { count: 0 } })),
        api.get('/conversations/unread-count').catch(() => ({ data: { count: 0 } })),
      ]);
      setNotifCount(notifRes.data?.count ?? 0);
      setMsgCount(msgRes.data?.count ?? 0);
    } catch {
      // silently ignore
    }
  };

  useEffect(() => {
    fetchCounts();
    intervalRef.current = setInterval(fetchCounts, 30000);

    const socket = getSocket();
    if (socket) {
      const handleNotif = () => setNotifCount(n => n + 1);
      const handleMsg = () => setMsgCount(n => n + 1);
      socket.on('notificationPush', handleNotif);
      socket.on('newMessage', handleMsg);
      return () => {
        socket.off('notificationPush', handleNotif);
        socket.off('newMessage', handleMsg);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const resetNotif = async () => {
    setNotifCount(0);
    try { await api.patch('/notifications/read-all'); } catch { /* ok */ }
  };

  const resetMsg = () => setMsgCount(0);

  return { notifCount, msgCount, resetNotif, resetMsg };
}
