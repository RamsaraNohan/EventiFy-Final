import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ForgotPasswordPage from './pages/forgot-password';
import ResetPasswordPage from './pages/reset-password';
import NotificationsPage from './pages/notifications';
import MessagesPage from './pages/messages';
import VendorMarketplace from './pages/marketplace';
import VendorProfile from './pages/vendors/[id]';
import CheckoutPage from './pages/bookings/Checkout';
import AIRecommendations from './pages/recommendations';
import ProfileSettings from './pages/settings/ProfileSettings';
import BookingRequests from './pages/bookings/BookingRequests';
import VendorAnalytics from './pages/vendors/VendorAnalytics';
import UserDatabase from './pages/admin/UserDatabase';
import VendorApproval from './pages/admin/VendorApproval';
import AdminDashboard from './pages/admin/AdminDashboard';
import TransactionsPage from './pages/transactions';
import VendorDashboard from './pages/vendors/VendorDashboard';
import VendorServices from './pages/vendors/VendorServices';
import VendorCalendar from './pages/vendors/VendorCalendar';
import AdminEventsPage from './pages/admin/AdminEventsPage';
import EventsPage from './pages/events';
import EventDetailPage from './pages/events/[id]';
import LandingPage from './pages/landing';
import Dashboard from './pages/dashboard';
import PublicVendorProfile from './pages/vendors/PublicVendorProfile';
import { useAuthStore } from './lib/auth';

const RoleBasedRoute = ({ client, vendor, admin }: { client: React.ReactNode, vendor?: React.ReactNode, admin?: React.ReactNode }) => {
  const { user } = useAuthStore();
  if (user?.role === 'CLIENT') return <>{client}</>;
  if (user?.role === 'VENDOR_OWNER') return <>{vendor || client}</>;
  if (user?.role === 'ADMIN') return <>{admin || client}</>;
  return <>{client}</>;
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-primary-400">Loading...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex-1 flex flex-col items-center justify-center h-full text-slate-400 bg-surface-page p-8 rounded-2xl border border-gray-100 mt-4 shadow-sm relative z-10 w-full">
    <div className="w-16 h-16 rounded-full bg-primary-600/10 text-primary-600 flex items-center justify-center mb-6">
      <span className="text-2xl font-bold font-mono">/</span>
    </div>
    <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-wide">{title}</h1>
    <p className="text-lg opacity-80 max-w-md text-center">
      This module is currently under construction. Stay tuned!
    </p>
  </div>
);

export const AppRouter = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />
        
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />

        <Route element={<AppLayout />}>
          <Route path="v/:id" element={<PublicVendorProfile />} />
          <Route path="notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
          <Route path="messages" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
          <Route path="explore" element={<PrivateRoute><VendorMarketplace /></PrivateRoute>} />
          <Route path="vendors/:id" element={<PrivateRoute><VendorProfile /></PrivateRoute>} />
          <Route path="checkout/:id" element={<PrivateRoute><CheckoutPage /></PrivateRoute>} />
          <Route path="recommendations" element={<PrivateRoute><AIRecommendations /></PrivateRoute>} />
          <Route path="transactions" element={<PrivateRoute><TransactionsPage /></PrivateRoute>} />
          <Route path="settings" element={<PrivateRoute><ProfileSettings /></PrivateRoute>} />

          {/* Role-based Dashboard */}
          <Route path="dashboard" element={
            <PrivateRoute>
              <RoleBasedRoute client={<Dashboard />} vendor={<VendorDashboard />} admin={<AdminDashboard />} />
            </PrivateRoute>
          } />

          {/* Client: Events */}
          <Route path="events" element={<PrivateRoute><EventsPage /></PrivateRoute>} />
          <Route path="events/:id" element={<PrivateRoute><EventDetailPage /></PrivateRoute>} />

          {/* Vendor */}
          <Route path="services" element={
            <PrivateRoute>
              <RoleBasedRoute client={<PlaceholderPage title="Services" />} vendor={<VendorServices />} />
            </PrivateRoute>
          } />
          <Route path="marketing" element={
            <PrivateRoute>
              <RoleBasedRoute client={<PlaceholderPage title="Marketing" />} vendor={<VendorAnalytics />} />
            </PrivateRoute>
          } />
          <Route path="calendar" element={
            <PrivateRoute>
              <RoleBasedRoute client={<PlaceholderPage title="Calendar" />} vendor={<VendorCalendar />} />
            </PrivateRoute>
          } />

          {/* Bookings */}
          <Route path="bookings" element={
            <PrivateRoute>
              <RoleBasedRoute client={<EventsPage />} vendor={<BookingRequests />} />
            </PrivateRoute>
          } />

          {/* Admin */}
          <Route path="users" element={
            <PrivateRoute>
              <RoleBasedRoute client={<PlaceholderPage title="Users" />} admin={<UserDatabase />} />
            </PrivateRoute>
          } />
          <Route path="approvals" element={
            <PrivateRoute>
              <RoleBasedRoute client={<PlaceholderPage title="Approvals" />} admin={<VendorApproval />} />
            </PrivateRoute>
          } />
          <Route path="events" element={
            <PrivateRoute>
              <RoleBasedRoute client={<EventsPage />} admin={<AdminEventsPage />} />
            </PrivateRoute>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
