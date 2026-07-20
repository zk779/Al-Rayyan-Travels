import { useAuth } from "../context/AuthContext";

/**
 * Declarative permission gate for JSX.
 *
 * Usage:
 *   <Can permission="USER_EDIT"><button>Edit</button></Can>
 *   <Can any={["USER_EDIT", "USER_DELETE"]}><button>Manage</button></Can>
 *   <Can all={["SALE_EDIT", "SALE_DELETE"]}><button>Full Control</button></Can>
 *   <Can permission="USER_DELETE" fallback={<p>Not allowed</p>}>...</Can>
 */
export default function Can({ permission, any, all, fallback = null, children }) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  let allowed = true;

  if (permission) {
    allowed = hasPermission(permission);
  } else if (any) {
    allowed = hasAnyPermission(any);
  } else if (all) {
    allowed = hasAllPermissions(all);
  }

  return allowed ? children : fallback;
}