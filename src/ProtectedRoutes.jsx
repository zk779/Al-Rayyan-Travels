import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Spin } from "antd";

const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g. http://localhost:5000

export default function ProtectedRoutes() {
  const location = useLocation();

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authChecked, setAuthChecked] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // 🔐 Verify token with backend (FETCH)
  const verifyToken = async (jwt) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (!res.ok) {
        throw new Error("Token invalid or expired");
      }

      // optional if you want user data
      // const data = await res.json();

      setIsValid(true);
    } catch (err) {
      console.warn("Token verification failed:", err.message);

      localStorage.removeItem("token");
      setToken(null);
      setIsValid(false);
    } finally {
      setAuthChecked(true);
    }
  };

  // ✅ Verify when route OR token changes
  useEffect(() => {
    if (!token) {
      setAuthChecked(true);
      setIsValid(false);
      return;
    }

    setAuthChecked(false);
    verifyToken(token);
  }, [location.pathname, location.search, token]);

  // 🔁 Sync login/logout across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") {
        setToken(e.newValue);
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ⏳ Loading
  if (!authChecked) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-gray-500">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  // 🚫 Not authenticated
  if (!token || !isValid) {
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
