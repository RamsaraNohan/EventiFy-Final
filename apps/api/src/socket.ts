import { Server } from 'socket.io';
import * as http from 'http';
import jwt from 'jsonwebtoken';
import { env } from './config/env';

export let io: Server;

export function initSocket(server: http.Server) {
  io = new Server(server, {
    cors: {
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    allowEIO3: true
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication error'));
    
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      socket.data.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`User connected to socket: ${userId}`);
    
    // Join user-specific room
    socket.join(`user_${userId}`);

    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    socket.on('message:typing', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('message:typing', { 
        userId, 
        conversationId 
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
    });
  });

  return io;
}
