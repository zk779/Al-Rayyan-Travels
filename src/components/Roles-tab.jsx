import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, ShieldCheck, Edit, Shield } from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Badge } from "../../shadcn/components/ui/badge";
import { Checkbox } from "../../shadcn/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../shadcn/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../shadcn/components/ui/alert-dialog";
import { Textarea } from "../../shadcn/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem,
} from "../../shadcn/components/ui/radio-group";
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS

const API_BASE = import.meta.env.VITE_API_BASE_URL;

async function apiRequest(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new Error(data?.error || data?.message || "Request failed");
  }
  return data;
}

const MODULE_LABEL = {
  CUSTOMER: "Customers",
  VENDOR: "Vendors",
  AIRLINE: "Airlines",
  SALE: "Sales",
  PAYMENT: "Payments",
  REFUND: "Refunds",
  EXPENSE: "Expenses",
  USER: "Users",
  ROLE: "Roles",
  BRANCH: "Branches",
  LEDGER: "Ledger",
  REPORT: "Report",
};
const MODULE_ORDER = Object.keys(MODULE_LABEL);
const ACTIONS = ["READ", "CREATE", "EDIT", "DELETE"];
const ACTION_LABEL = {
  READ: "View",
  CREATE: "Create",
  EDIT: "Edit",
  DELETE: "Delete",
};

const EMPTY_FORM = { name: "", description: "", permissions: [] };

// Normalizes a role from any backend shape down to { ...role, permissions: [permissionId] }
const normalizeRole = (r, permByKey) => {
  let ids = r?.permissionIds || r?.permissionsIds || [];
  if (!ids.length && Array.isArray(r?.permissionLinks)) {
    ids = r.permissionLinks
      .map((x) => x?.permissionId || permByKey[x?.permission?.permission])
      .filter(Boolean);
  }
  if (!ids.length && Array.isArray(r?.permissions)) {
    ids = r.permissions
      .map((p) => (typeof p === "string" && permByKey[p] ? permByKey[p] : p))
      .filter(Boolean);
  }
  return {
    id: r.id,
    name: r.name || "",
    description: r.description || "",
    permissions: ids,
    userCount: Array.isArray(r?.users)
      ? r.users.length
      : (r?.usersCount ?? r?.userCount ?? 0),
    createdAt: r.createdAt || new Date().toISOString(),
  };
};

export default function RolesTab() {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("ROLE_CREATE");
  const canEdit = hasPermission("ROLE_EDIT");
  const canDelete = hasPermission("ROLE_DELETE");
  const hasAnyRowAction = canEdit || canDelete;

  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingRole, setEditingRole] = useState(null);
  const [deleteRoleId, setDeleteRoleId] = useState(null);

  const [permissions, setPermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [roleForm, setRoleForm] = useState(EMPTY_FORM);

  const permByKey = useMemo(
    () => Object.fromEntries(permissions.map((p) => [p.permission, p.id])),
    [permissions],
  );
  const permKeyById = useMemo(
    () => Object.fromEntries(permissions.map((p) => [p.id, p.permission])),
    [permissions],
  );

  // module => { READ: id, CREATE: id, EDIT: id, DELETE: id, ... }
  // ✅ FIX: previously did `const [module, action] = permission.split("_")`,
  // which only keeps the first two segments. For a 3-part key like
  // "SALE_VIEW_OWN" that silently drops "OWN", collapsing
  // SALE_VIEW_OWN / SALE_VIEW_BRANCH / SALE_VIEW_ALL onto the same
  // map.SALE.VIEW slot (last one loaded wins, the other two vanish).
  // Now the action is everything after the first underscore, so each
  // stays distinct: VIEW_OWN, VIEW_BRANCH, VIEW_ALL.
  const permissionMap = useMemo(() => {
    const map = {};
    for (const p of permissions) {
      const parts = (p.permission || "").split("_");
      if (parts.length < 2) continue;
      const module = parts[0];
      const action = parts.slice(1).join("_");
      (map[module] ||= {})[action] = p.id;
    }
    return map;
  }, [permissions]);

  // ✅ Sales visibility scope — SALE_VIEW_OWN / SALE_VIEW_BRANCH / SALE_VIEW_ALL
  // aren't generic CRUD actions, they're a mutually-exclusive scope for how
  // much sales data a role can see, so they get their own section instead of
  // a 5th column in the CRUD matrix.
  const SALE_VIEW_SCOPES = [
    {
      key: "SALE_VIEW_OWN",
      label: "Own Sales Only",
      hint: "Can only see sales they personally created",
    },
    {
      key: "SALE_VIEW_BRANCH",
      label: "Branch Sales",
      hint: "Can see all sales within their branch",
    },
    {
      key: "SALE_VIEW_ALL",
      label: "All Sales",
      hint: "Can see sales across every branch",
    },
  ];
  const saleViewScopes = useMemo(
    () =>
      SALE_VIEW_SCOPES.map((s) => ({ ...s, id: permByKey[s.key] })).filter(
        (s) => s.id,
      ),
    [permByKey],
  );

  const groupedModules = useMemo(
    () =>
      Object.keys(permissionMap).sort(
        (a, b) => MODULE_ORDER.indexOf(a) - MODULE_ORDER.indexOf(b),
      ),
    [permissionMap],
  );

  const refreshRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await apiRequest("/api/roles");
      setRoles((res?.data || []).map((r) => normalizeRole(r, permByKey)));
    } catch (e) {
      setError(e.message);
    } finally {
      setRolesLoading(false);
    }
  };

  // load permissions once, then roles (so ids map correctly)
  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("/api/permissions");
        setPermissions(res?.data || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setPermLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!permLoading) refreshRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permLoading]);

  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
  }, [roles, searchQuery]);

  const handleSelectAll = (checked) =>
    setSelectedRoles(checked ? filteredRoles.map((r) => r.id) : []);

  const handleSelectRole = (roleId, checked) =>
    setSelectedRoles((prev) =>
      checked ? [...prev, roleId] : prev.filter((id) => id !== roleId),
    );

  const openAdd = () => {
    if (!canCreate) return; // ✅ RBAC guard
    setEditingRole(null);
    setRoleForm(EMPTY_FORM);
    setError("");
    setIsAddDialogOpen(true);
  };

  const handleEditRole = (role) => {
    if (!canEdit) return; // ✅ RBAC guard
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [],
    });
    setError("");
    setIsEditDialogOpen(true);
  };

  const setPermIds = (ids, checked) =>
    setRoleForm((prev) => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...ids])]
        : prev.permissions.filter((id) => !ids.includes(id)),
    }));

  const isFormValid =
    roleForm.name.trim() &&
    roleForm.description.trim() &&
    roleForm.permissions.length > 0;

  const handleAddRole = async () => {
    if (!canCreate) return; // ✅ RBAC guard

    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/roles", {
        method: "POST",
        body: {
          name: roleForm.name.trim(),
          description: roleForm.description.trim(),
          permissionIds: roleForm.permissions,
        },
      });
      setIsAddDialogOpen(false);
      setRoleForm(EMPTY_FORM);
      await refreshRoles();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!canEdit) return; // ✅ RBAC guard

    setSaving(true);
    setError("");
    try {
      await apiRequest(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        body: {
          name: roleForm.name.trim(),
          description: roleForm.description.trim(),
          permissionIds: roleForm.permissions,
        },
      });
      setIsEditDialogOpen(false);
      setEditingRole(null);
      setRoleForm(EMPTY_FORM);
      await refreshRoles();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    if (!canDelete) return; // ✅ RBAC guard
    setDeleteRoleId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (!deleteRoleId) return;

    try {
      await apiRequest(`/api/roles/${deleteRoleId}`, { method: "DELETE" });
      setSelectedRoles((prev) => prev.filter((id) => id !== deleteRoleId));
      setDeleteRoleId(null);
      setIsDeleteDialogOpen(false);
      await refreshRoles();
    } catch (e) {
      setError(e.message);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (selectedRoles.length === 0) return;

    try {
      await Promise.all(
        selectedRoles.map((id) =>
          apiRequest(`/api/roles/${id}`, { method: "DELETE" }),
        ),
      );
      setSelectedRoles([]);
      await refreshRoles();
    } catch (e) {
      setError(e.message);
    }
  };

  const prettyPermKey = (key) =>
    (key || "")
      .split("_")
      .map((x) => x.charAt(0) + x.slice(1).toLowerCase())
      .join(" ");

  // ---- Permissions matrix: master "select all", per-action column select-all,
  // per-module row select-all, and individual cell checkboxes ----
  const PermissionsMatrix = () => {
    if (permLoading)
      return (
        <div className="text-sm text-muted-foreground">
          Loading permissions...
        </div>
      );
    if (!groupedModules.length)
      return (
        <div className="text-sm text-muted-foreground">
          No permissions found.
        </div>
      );

    const allIds = groupedModules.flatMap((m) =>
      ACTIONS.map((a) => permissionMap[m]?.[a]).filter(Boolean),
    );
    const isChecked = (ids) =>
      ids.length > 0 && ids.every((id) => roleForm.permissions.includes(id));

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Permissions</Label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={isChecked(allIds)}
              onCheckedChange={(c) => setPermIds(allIds, c)}
            />
            Select All
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="text-left p-2 font-medium">Module</th>
                {ACTIONS.map((a) => {
                  const ids = groupedModules
                    .map((m) => permissionMap[m]?.[a])
                    .filter(Boolean);
                  return (
                    <th key={a} className="p-2 font-medium">
                      <div className="flex flex-col items-center gap-1">
                        <span>{ACTION_LABEL[a]}</span>
                        <Checkbox
                          checked={isChecked(ids)}
                          disabled={!ids.length}
                          onCheckedChange={(c) => setPermIds(ids, c)}
                        />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groupedModules.map((m) => {
                const rowIds = ACTIONS.map((a) => permissionMap[m]?.[a]).filter(
                  Boolean,
                );
                return (
                  <tr key={m} className="border-b last:border-0">
                    <td className="p-2 font-medium">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked(rowIds)}
                          onCheckedChange={(c) => setPermIds(rowIds, c)}
                        />
                        {MODULE_LABEL[m] || m}
                      </div>
                    </td>
                    {ACTIONS.map((a) => {
                      const id = permissionMap[m]?.[a];
                      return (
                        <td key={a} className="p-2 text-center">
                          <Checkbox
                            checked={
                              id ? roleForm.permissions.includes(id) : false
                            }
                            disabled={!id}
                            onCheckedChange={(c) => id && setPermIds([id], c)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const roleDialogBody = (
    <div className="space-y-4 py-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-md p-2">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label>Role Name</Label>
        <Input
          placeholder="e.g., Manager"
          value={roleForm.name}
          onChange={(e) =>
            setRoleForm((prev) => ({ ...prev, name: e.target.value }))
          }
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Describe the role and its responsibilities..."
          value={roleForm.description}
          onChange={(e) =>
            setRoleForm((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>
      <PermissionsMatrix />

      {/* ✅ Sales visibility scope — a real RadioGroup (not checkboxes) so
          the single-select behavior is visually obvious, not just enforced
          in code. Includes a "Clear" action since native radios can't be
          unchecked by clicking again, and a role might not need any of
          these three at all. */}
      {saleViewScopes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Sales Visibility Scope</Label>
            {saleViewScopes.some((s) =>
              roleForm.permissions.includes(s.id),
            ) && (
              <button
                type="button"
                onClick={() => {
                  const ids = saleViewScopes.map((s) => s.id);
                  setPermIds(ids, false);
                }}
                className="text-xs text-muted-foreground underline hover:text-foreground"
              >
                Clear selection
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Controls how much sales data this role can see. Only one option
            can be selected.
          </p>

          <RadioGroup
            value={
              saleViewScopes.find((s) =>
                roleForm.permissions.includes(s.id),
              )?.id || ""
            }
            onValueChange={(value) => {
              const scopeIds = saleViewScopes.map((s) => s.id);
              setRoleForm((prev) => ({
                ...prev,
                permissions: [
                  ...prev.permissions.filter((id) => !scopeIds.includes(id)),
                  ...(value ? [value] : []),
                ],
              }));
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-2"
          >
            {saleViewScopes.map((scope) => {
              const checked = roleForm.permissions.includes(scope.id);
              return (
                <label
                  key={scope.id}
                  htmlFor={`sale-scope-${scope.id}`}
                  className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer text-sm transition-colors ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value={scope.id}
                      id={`sale-scope-${scope.id}`}
                    />
                    <span className="font-medium">{scope.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {scope.hint}
                  </span>
                </label>
              );
            })}
          </RadioGroup>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          {/* ✅ RBAC — bulk delete only if permitted */}
          {canDelete && selectedRoles.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedRoles.length})
            </Button>
          )}

          {/* ✅ RBAC — hide Add Role entirely if no create permission */}
          {canCreate && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="app" onClick={openAdd}>
                  <ShieldCheck className="h-4 w-4 mr-2" />
                  Add Role
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto scrollbar-none">
                <DialogHeader>
                  <DialogTitle>Add New Role</DialogTitle>
                  <DialogDescription>
                    Create a new user role with specific permissions.
                  </DialogDescription>
                </DialogHeader>
                {roleDialogBody}
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="app"
                    onClick={handleAddRole}
                    disabled={!isFormValid || saving}
                  >
                    {saving ? "Adding..." : "Add Role"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {selectedRoles.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedRoles.length === filteredRoles.length &&
                filteredRoles.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedRoles.length} of {filteredRoles.length} roles selected
            </span>
          </div>
          {/* ✅ RBAC — bulk delete only if permitted */}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>
      )}

      {rolesLoading ? (
        <div className="text-sm text-muted-foreground">Loading roles...</div>
      ) : filteredRoles.length === 0 ? (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No roles found
          </h3>
          <p className="text-gray-500">
            Create your first role to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRoles.map((role) => (
            <Card
              key={role.id}
              className="relative hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedRoles.includes(role.id)}
                      onCheckedChange={(checked) =>
                        handleSelectRole(role.id, checked)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {role.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {role.description}
                      </p>
                    </div>
                  </div>

                  {/* ✅ RBAC — only render the actions cluster if the user
                      can actually edit or delete roles */}
                  {hasAnyRowAction && (
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditRole(role)}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(role.id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Permissions:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(role.permissions || []).map((permId) => (
                        <Badge
                          key={permId}
                          variant="app"
                          className="text-xs px-2 py-1"
                        >
                          {prettyPermKey(permKeyById[permId] || permId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      {role.userCount} user{role.userCount !== 1 ? "s" : ""}{" "}
                      assigned
                    </span>
                    <span className="text-sm text-gray-500">
                      Created: {new Date(role.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Showing {filteredRoles.length} of {roles.length} roles
        </span>
        {selectedRoles.length > 0 && (
          <span>{selectedRoles.length} roles selected</span>
        )}
      </div>

      {/* Edit Role Dialog — ✅ RBAC: only mount if user can edit */}
      {canEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role</DialogTitle>
              <DialogDescription>
                Update role information and permissions.
              </DialogDescription>
            </DialogHeader>
            {roleDialogBody}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="app"
                onClick={handleUpdateRole}
                disabled={!isFormValid || saving}
              >
                {saving ? "Updating..." : "Update Role"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog — ✅ RBAC: only mount if user can delete */}
      {canDelete && (
        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                role.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}