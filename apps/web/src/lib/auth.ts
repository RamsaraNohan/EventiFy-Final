import { create } from 'zustand';
import { api } from './api';
import { initializeSocket, disconnectSocket } from './socket';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  
  login: (user, token) => {
    set({ user, isAuthenticated: true });
    // Token is needed for socket if we pass header, otherwise we can assume cookie holds it. 
    // We mock the token passed since login sends it as httpOnly. Wait, socket.io doesn't send HttpOnly cross-origin easily sometimes without withCredentials.
    // If we use headers, we intercept. For this skeleton, we just use the REST API to get token.
    if (token) {
      initializeSocket(token);
    } else {
      // For cookie based socket, we might not strictly need auth packet, but let's assume valid session logic.
      initializeSocket('mock-token-fallback');
    }
  },
  
  logout: async () => {
    await api.post('/auth/logout');
    disconnectSocket();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data.user, isAuthenticated: true, isLoading: false });
      initializeSocket('mock-token-fallback'); // Real app requires we extract token if using header, or cookie handles it implicitly
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
