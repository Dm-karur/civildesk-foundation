import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

export function RequirePermission({ permission, children }) {
  const { hasPermission } = useAuth();
  const location = useLocation();

  if (!hasPermission(permission)) {
    return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
  }

  return children ?? <Outlet />;
}
