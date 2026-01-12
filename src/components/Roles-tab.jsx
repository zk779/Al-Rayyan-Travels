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

const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g. http://localhost:5000

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

const MODULE_ORDER = [
  "CUSTOMER",
  "VENDOR",
  "AIRLINE",
  "SALE",
  "PAYMENT",
  "REFUND",
  "EXPENSE",
  "USER",
  "ROLE",
  "BRANCH",
  "LEDGER",
  "REPORT",
];

export default function RolesTab() {
  const [roles, setRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingRole, setEditingRole] = useState(null);
  const [deleteRoleId, setDeleteRoleId] = useState(null);

  // permissions from API: [{id, permission, description}]
  const [permissions, setPermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  // ✅ roleForm.permissions now stores permissionIds (NOT names)
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [], // permissionIds
  });

  // ----- helpers for mapping between permission name <-> id -----
  const permIdByKey = useMemo(() => {
    const m = {};
    for (const p of permissions) m[p.permission] = p.id;
    return m;
  }, [permissions]);

  const permKeyById = useMemo(() => {
    const m = {};
    for (const p of permissions) m[p.id] = p.permission;
    return m;
  }, [permissions]);

  const normalizeRole = (r) => {
    // supports multiple backend shapes, but final output must be permissionIds
    const idsFromDirect =
      r?.permissionIds || r?.permissionsIds || r?.permissions; // if backend already returns ids in permissions
    const idsFromLinks =
      r?.permissionLinks?.map((x) => x?.permissionId).filter(Boolean) || [];
    const keysFromLinks =
      r?.permissionLinks
        ?.map((x) => x?.permission?.permission || x?.permission?.name)
        .filter(Boolean) || [];
    const keysFromOther =
      r?.permissionKeys || r?.permissionNames || r?.permissionKeys || [];

    let permissionIds = [];

    if (Array.isArray(idsFromDirect) && idsFromDirect.length) {
      // if it looks like ObjectId strings, accept
      permissionIds = idsFromDirect.filter(Boolean);
    } else if (idsFromLinks.length) {
      permissionIds = idsFromLinks;
    } else if (keysFromLinks.length) {
      permissionIds = keysFromLinks.map((k) => permIdByKey[k]).filter(Boolean);
    } else if (Array.isArray(keysFromOther) && keysFromOther.length) {
      permissionIds = keysFromOther.map((k) => permIdByKey[k]).filter(Boolean);
    }

    const usersCount = Array.isArray(r?.users)
      ? r.users.length
      : r?.usersCount ?? r?.userCount ?? 0;

    return {
      id: r.id,
      name: r.name || "",
      description: r.description || "",
      permissions: permissionIds, // ✅ store ids
      userCount: usersCount,
      createdAt: r.createdAt || new Date().toISOString(),
    };
  };

  const refreshRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await apiRequest("/api/roles");
      setRoles((res?.data || []).map(normalizeRole));
    } finally {
      setRolesLoading(false);
    }
  };

  // fetch permissions first (so role normalization can map keys -> ids safely)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setPermLoading(true);
        const res = await apiRequest("/api/permissions");
        if (!mounted) return;
        setPermissions(res?.data || []);
      } catch (e) {
        console.error("Failed to fetch permissions:", e.message);
      } finally {
        setPermLoading(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // fetch roles (and re-normalize when permissions load)
  useEffect(() => {
    refreshRoles().catch((e) =>
      console.error("Failed to fetch roles:", e.message)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when permissions arrive, re-normalize roles to ensure we have ids
  useEffect(() => {
    if (!permissions.length || !roles.length) return;
    setRoles((prev) => prev.map((r) => normalizeRole(r)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.length]);

  // build permissionMap: module => { READ: permissionId, CREATE: permissionId, ... }
  const permissionMap = useMemo(() => {
    const map = {};
    for (const p of permissions) {
      const key = p.permission; // e.g. CUSTOMER_CREATE
      const [module, action] = (key || "").split("_");
      if (!module || !action) continue;
      map[module] ||= {};
      map[module][action] = p.id; // ✅ store id
    }
    return map;
  }, [permissions]);

  const groupedModules = useMemo(() => {
    const modules = Object.keys(permissionMap);
    modules.sort((a, b) => MODULE_ORDER.indexOf(a) - MODULE_ORDER.indexOf(b));
    return modules;
  }, [permissionMap]);

  const filteredRoles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return roles.filter(
      (r) =>
        (r.name || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q)
    );
  }, [roles, searchQuery]);

  const handleSelectAll = (checked) =>
    setSelectedRoles(checked ? filteredRoles.map((r) => r.id) : []);

  const handleSelectRole = (roleId, checked) =>
    setSelectedRoles((prev) =>
      checked ? [...prev, roleId] : prev.filter((id) => id !== roleId)
    );

  const openAdd = () => {
    setEditingRole(null);
    setRoleForm({ name: "", description: "", permissions: [] });
    setIsAddDialogOpen(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions || [], // ✅ ids
    });
    setIsEditDialogOpen(true);
  };

  const togglePermissionId = (permId) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((id) => id !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const handleAddRole = async () => {
    try {
      await apiRequest("/api/roles", {
        method: "POST",
        body: {
          name: roleForm.name,
          description: roleForm.description,
          permissionIds: roleForm.permissions, // ✅ required payload
        },
      });
      setIsAddDialogOpen(false);
      setRoleForm({ name: "", description: "", permissions: [] });
      await refreshRoles();
    } catch (e) {
      console.error("Create role failed:", e.message);
      alert(e.message);
    }
  };

  const handleUpdateRole = async () => {
    try {
      await apiRequest(`/api/roles/${editingRole.id}`, {
        method: "PUT",
        body: {
          name: roleForm.name,
          description: roleForm.description,
          permissionIds: roleForm.permissions, // ✅ required payload
        },
      });
      setIsEditDialogOpen(false);
      setEditingRole(null);
      setRoleForm({ name: "", description: "", permissions: [] });
      await refreshRoles();
    } catch (e) {
      console.error("Update role failed:", e.message);
      alert(e.message);
    }
  };

  const handleDelete = (id) => {
    setDeleteRoleId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await apiRequest(`/api/roles/${deleteRoleId}`, { method: "DELETE" });
      setSelectedRoles((prev) => prev.filter((id) => id !== deleteRoleId));
      setDeleteRoleId(null);
      setIsDeleteDialogOpen(false);
      await refreshRoles();
    } catch (e) {
      console.error("Delete role failed:", e.message);
      alert(e.message);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        selectedRoles.map((id) =>
          apiRequest(`/api/roles/${id}`, { method: "DELETE" })
        )
      );
      setSelectedRoles([]);
      await refreshRoles();
    } catch (e) {
      console.error("Bulk delete failed:", e.message);
      alert(e.message);
    }
  };

  const prettyPermKey = (key) =>
    (key || "")
      .split("_")
      .map((x) => x.charAt(0) + x.slice(1).toLowerCase())
      .join(" ");

  const PermissionsMatrix = () => (
    <div className="space-y-3">
      <Label>Permissions</Label>

      {permLoading ? (
        <div className="text-sm text-muted-foreground">
          Loading permissions...
        </div>
      ) : groupedModules.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No permissions found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedModules.map((module) => {
            const row = permissionMap[module] || {};
            const title = MODULE_LABEL[module] || module;

            const Action = ({ action, label }) => {
              const permId = row[action]; // ✅ permissionId
              const disabled = !permId;
              const checked = permId
                ? roleForm.permissions.includes(permId)
                : false;

              const toggle = () => {
                if (disabled) return;
                togglePermissionId(permId);
              };

              return (
                <button
                  type="button"
                  title={label}
                  disabled={disabled}
                  onClick={toggle}
                  className={[
                    "w-full flex items-center justify-center gap-2",
                    "rounded-xl px-2 py-2 transition",
                    "bg-background",
                    disabled
                      ? "opacity-35 cursor-not-allowed"
                      : "hover:bg-muted/50 active:scale-[0.99]",
                    checked && !disabled
                      ? "border-primary/40 ring-1 ring-primary/20"
                      : "border-border",
                  ].join(" ")}
                >
                  <Checkbox
                    checked={checked}
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                </button>
              );
            };

            return (
              <div
                key={module}
                className="rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="text-base font-semibold">{title}</div>

                <div className="mt-3 grid grid-cols-4 gap-2">
                  <Action action="READ" label="View" />
                  <Action action="CREATE" label="Create" />
                  <Action action="EDIT" label="Edit" />
                  <Action action="DELETE" label="Delete" />
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>V</span>
                  <span>C</span>
                  <span>E</span>
                  <span>D</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ✅ plain JSX (prevents focus loss)
  const roleDialogBody = (
    <div className="space-y-4 py-4">
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
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
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
          {selectedRoles.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedRoles.length})
            </Button>
          )}

          {/* Add Role */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="app" onClick={openAdd}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto  scrollbar-none">
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
                  disabled={
                    !roleForm.name ||
                    !roleForm.description ||
                    roleForm.permissions.length === 0
                  }
                >
                  Add Role
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk Selection Header */}
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
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Roles Cards Grid */}
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

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditRole(role)}
                      className="h-8 w-8 p-0 hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 text-gray-500" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(role.id)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Permissions:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(role.permissions || []).map((permId) => {
                        const key = permKeyById[permId] || permId; // show key if available
                        return (
                          <Badge
                            key={permId}
                            variant="app"
                            className="text-xs px-2 py-1"
                          >
                            {prettyPermKey(key)}
                          </Badge>
                        );
                      })}
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

      {/* Edit Role Dialog */}
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
              disabled={!editingRole}
            >
              Update Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
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
    </div>
  );
}
