import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
}
