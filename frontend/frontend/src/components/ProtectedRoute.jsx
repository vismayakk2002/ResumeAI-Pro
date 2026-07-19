import { Navigate, Outlet } from "react-router-dom";

import useAuth from "../hooks/useAuth";

export default function ProtectedRoute() {
  const ctx = useAuth();
  const user = ctx?.user;
  const loading = ctx?.loading;

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

