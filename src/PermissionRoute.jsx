import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

/**
 * Route-level permission guard.
 * Wrap a page element with this to require a specific permission (or any/all of a list).
 * Redirects to /403 if the user lacks it.
 *
 * Usage:
 *   <Route path="/users" element={
 *     <PermissionRoute permission="USER_READ"><Users /></PermissionRoute>
 *   } />
 */
export default function PermissionRoute({ permission, any, all, children }) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (any) {
    allowed = hasAnyPermission(any);
  } else if (all) {
    allowed = hasAllPermissions(all);
  }

  if (!allowed) {
    return <Navigate to="/403" replace />;
  }

  return children;
}