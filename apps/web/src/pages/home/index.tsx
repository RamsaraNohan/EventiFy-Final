import { useAuthStore } from '../../lib/auth';
import { Navigate } from 'react-router-dom';

export default function HomePage() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to="/dashboard" replace />;
}
