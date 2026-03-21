import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth';

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket) return socket;

  socket = io('http://localhost:8000', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Socket attached:', socket?.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
