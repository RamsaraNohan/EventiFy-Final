import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { io } from './socket';
import rateLimit from 'express-rate-limit';
import { startEventStatusJob } from './jobs/eventStatusJob';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import vendorRoutes from './modules/vendors/vendors.routes';
import bookingRoutes from './modules/bookings/bookings.routes';
import notificationRoutes from './modules/notifications/notifications.routes';
import conversationsRoutes from './modules/conversations/conversations.routes';
import usersRoutes from './modules/users/users.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import aiRoutes from './modules/ai/ai.routes';
import adminRoutes from './modules/admin/admin.routes';
import eventsRoutes from './modules/events/events.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import calendarRoutes from './modules/calendar/calendar.routes';
import savedVendorRoutes from './modules/saved-vendors/saved-vendors.routes';

// Start the daily cron jobs
startEventStatusJob();

const app = express();

app.use(helmet()); // Enable full Helmet default protection

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));

// Apply rate limiting to auth routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 attempts
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' }
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Make io accessible in request handlers
app.use((req, res, next) => {
  req.app.set('io', io);
  next();
});

// Static Files with explicit CORS headers
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Routes
// Apply rate limiter to specific auth routes
app.use('/auth/login', authLimiter);
app.use('/auth/forgot-password', authLimiter);
app.use('/auth/reset-password', authLimiter);

app.use('/auth', authRoutes);
app.use('/vendors', vendorRoutes);
app.use('/bookings', bookingRoutes);
app.use('/notifications', notificationRoutes);
app.use('/conversations', conversationsRoutes);
app.use('/users', usersRoutes);
app.use('/payments', paymentsRoutes);
app.use('/ai', aiRoutes);
app.use('/admin', adminRoutes);
app.use('/events', eventsRoutes);
app.use('/tasks', tasksRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/calendar', calendarRoutes);
app.use('/saved-vendors', savedVendorRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Global Error handling middleware must be LAST
app.use(errorHandler);

export default app;
