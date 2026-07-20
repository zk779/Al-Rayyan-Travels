import { useAuth } from "../context/AuthContext";

// Check a single permission
export const usePermission = (permission) => {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
};

// Check if user has ANY of the given permissions
export const useAnyPermission = (perms = []) => {
  const { hasAnyPermission } = useAuth();
  return hasAnyPermission(perms);
};

// Check if user has ALL of the given permissions
export const useAllPermissions = (perms = []) => {
  const { hasAllPermissions } = useAuth();
  return hasAllPermissions(perms);
};