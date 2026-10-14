
import { Navigate, Outlet } from 'react-router-dom';

export default function RutaSegura() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
