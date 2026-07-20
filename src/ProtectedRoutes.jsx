import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Spin } from "antd";
import { useAuth } from "./context/AuthContext";

export default function ProtectedRoutes() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  // ⏳ Loading (AuthContext still verifying token / fetching /me)
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-gray-500">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  // 🚫 Not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // ✅ Authenticated
  return <Outlet />;
}