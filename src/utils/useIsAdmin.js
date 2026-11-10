import { useAuth } from "../context/AuthContext";

/** True when the signed-in user's role is ADMIN (the same check the sale forms already use). */
export function useIsAdmin() {
  const auth = useAuth();
  let role = auth?.user?.role;
  if (!role) {
    try {
      role = JSON.parse(localStorage.getItem("user"))?.role;
    } catch {
      role = null;
    }
  }
  return String(role || "").toUpperCase() === "ADMIN";
}
