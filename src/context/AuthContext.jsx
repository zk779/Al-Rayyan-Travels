import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_BASE_URL;

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the latest user + permissions from the server (also validates & refreshes the token)
  const fetchProfile = useCallback(async (authToken) => {
    const activeToken = authToken || localStorage.getItem("token");
    if (!activeToken) {
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Token invalid/expired, or user inactive/deleted
        logout();
        return;
      }

      // 🔄 Use the freshly reissued token from /me (sliding expiry), not the one we sent
      const newToken = data.token || activeToken;

      setToken(newToken);
      setUser(data.user);
      setPermissions(data.permissions || []);
      localStorage.setItem("token", newToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("permissions", JSON.stringify(data.permissions || []));
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      // Network error — don't force logout, keep last known state
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load from storage once, then revalidate against the server
  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("user");
    const p = localStorage.getItem("permissions");

    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
    if (p) setPermissions(JSON.parse(p));

    if (t) {
      fetchProfile(t);
    } else {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = ({ token, user }) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    // Immediately fetch full profile + permissions after login
    fetchProfile(token);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
  };

  // Call this after admin edits roles/permissions for the current user
  const refreshProfile = () => fetchProfile();

  // 🔁 Sync login/logout across tabs.
  // IMPORTANT: never call fetchProfile() here. /me reissues a new token
  // (fresh `iat`) on every call, so a naive "token differs -> refetch" would
  // have this tab write a new token, which the OTHER tab's listener sees as
  // "different" and refetches again, forever — an infinite cross-tab ping-
  // pong of /me calls. The writing tab already fetched & validated the
  // profile, so just adopt what it already persisted to storage.
  useEffect(() => {
    const onStorage = (e) => {
      // Another tab logged out (or cleared storage)
      if (e.key === "token" && !e.newValue) {
        setToken(null);
        setUser(null);
        setPermissions([]);
      }

      // Another tab logged in or refreshed to a new token — adopt its
      // already-persisted user/permissions instead of hitting the network.
      if (e.key === "token" && e.newValue && e.newValue !== token) {
        setToken(e.newValue);
        try {
          const u = localStorage.getItem("user");
          const p = localStorage.getItem("permissions");
          if (u) setUser(JSON.parse(u));
          if (p) setPermissions(JSON.parse(p));
        } catch {
          // malformed storage — ignore, next /me revalidation will fix it
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [token]);

  const hasPermission = (permission) => permissions.includes(permission);

  const hasAnyPermission = (perms = []) =>
    perms.some((p) => permissions.includes(p));

  const hasAllPermissions = (perms = []) =>
    perms.every((p) => permissions.includes(p));

  const value = useMemo(
    () => ({
      token,
      user,
      permissions,
      isLoading,
      isAuthenticated: !!token && !!user,
      login,
      logout,
      refreshProfile,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
    }),
    [token, user, permissions, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}