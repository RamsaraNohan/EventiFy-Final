import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { io } from './socket';

import authRoutes from './modules/auth/auth.routes';
import vendorRoutes from './modules/vendors/vendors.routes';
import bookingRoutes from './modules/bookings/bookings.routes';
import notificationRoutes from './modules/notifications/notifications.routes';

const app = express();

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Make io accessible in request handlers via req.app.get('io') if needed
app.use((req, res, next) => {
  req.app.set('io', io);
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/vendors', vendorRoutes);
app.use('/bookings', bookingRoutes);
app.use('/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

export default app;
