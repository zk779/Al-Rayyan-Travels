import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Check,
  Crown,
  Eye,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Checkbox } from "../../shadcn/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  BALANCE_ADJUSTMENT: "Balance Adjustments",
  BANK: "Banks",
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
// one letter per action, for the compact summary on each role card
const ACTION_LETTER = { READ: "V", CREATE: "C", EDIT: "E", DELETE: "D" };

// ✅ Sales visibility scope — SALE_VIEW_OWN / SALE_VIEW_BRANCH / SALE_VIEW_ALL
// aren't generic CRUD actions, they're a mutually-exclusive scope for how
// much sales data a role can see, so they get their own section instead of
// a 5th column in the CRUD matrix.
const SALE_VIEW_SCOPES = [
  {
    key: "SALE_VIEW_OWN",
    label: "Own Sales Only",
    hint: "Can only see sales they personally created",
    short: "Own sales",
  },
  {
    key: "SALE_VIEW_BRANCH",
    label: "Branch Sales",
    hint: "Can see all sales within their branch",
    short: "Branch sales",
  },
  {
    key: "SALE_VIEW_ALL",
    label: "All Sales",
    hint: "Can see sales across every branch",
    short: "All sales",
  },
];
const SCOPE_KEYS = SALE_VIEW_SCOPES.map((s) => s.key);

// the colour of a role's initial tile (muted, picked by position)
const TILES = [
  "bg-indigo-50 text-indigo-600 ring-indigo-100",
  "bg-emerald-50 text-emerald-600 ring-emerald-100",
  "bg-amber-50 text-amber-600 ring-amber-100",
  "bg-sky-50 text-sky-600 ring-sky-100",
  "bg-violet-50 text-violet-600 ring-violet-100",
  "bg-rose-50 text-rose-600 ring-rose-100",
];

const EMPTY_FORM = { name: "", description: "", permissions: [] };

// "BALANCE_ADJUSTMENT_CREATE" -> { module: "BALANCE_ADJUSTMENT", action: "CREATE" }.
// Anything that doesn't end in a CRUD action (SALE_VIEW_*, …) has no module/action.
// (This used to split on the FIRST underscore, which hid every permission whose module name
// has two words — the Balance Adjustment ones never appeared in the role editor.)
const parsePermission = (key) => {
  const m = String(key || "").match(/^(.*)_(READ|CREATE|EDIT|DELETE)$/);
  return m ? { module: m[1], action: m[2] } : null;
};

const prettyPermKey = (key) =>
  (key || "")
    .split("_")
    .map((x) => x.charAt(0) + x.slice(1).toLowerCase())
    .join(" ");

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

  const [dialogMode, setDialogMode] = useState(null); // null | "add" | "edit"
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [editingRole, setEditingRole] = useState(null);
  const [deleteRole, setDeleteRole] = useState(null);

  const [permissions, setPermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(""); // shown inside the role dialog
  const [pageError, setPageError] = useState(""); // shown above the list

  const [roleForm, setRoleForm] = useState(EMPTY_FORM);

  const permByKey = useMemo(
    () => Object.fromEntries(permissions.map((p) => [p.permission, p.id])),
    [permissions],
  );
  const permKeyById = useMemo(
    () => Object.fromEntries(permissions.map((p) => [p.id, p.permission])),
    [permissions],
  );

  // module => { READ: id, CREATE: id, EDIT: id, DELETE: id }
  const permissionMap = useMemo(() => {
    const map = {};
    for (const p of permissions) {
      const parsed = parsePermission(p.permission);
      if (!parsed) continue;
      (map[parsed.module] ||= {})[parsed.action] = p.id;
    }
    return map;
  }, [permissions]);

  const saleViewScopes = useMemo(
    () =>
      SALE_VIEW_SCOPES.map((s) => ({ ...s, id: permByKey[s.key] })).filter(
        (s) => s.id,
      ),
    [permByKey],
  );

  const groupedModules = useMemo(
    () =>
      Object.keys(permissionMap).sort((a, b) => {
        const ia = MODULE_ORDER.indexOf(a);
        const ib = MODULE_ORDER.indexOf(b);
        return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib) || a.localeCompare(b);
      }),
    [permissionMap],
  );

  // permissions that are neither a CRUD cell nor a sales scope (none today; shown if one is ever added)
  const otherPerms = useMemo(
    () =>
      permissions.filter(
        (p) => !parsePermission(p.permission) && !SCOPE_KEYS.includes(p.permission),
      ),
    [permissions],
  );

  const moduleLabel = (m) => MODULE_LABEL[m] || prettyPermKey(m);

  const refreshRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await apiRequest("/api/roles");
      setRoles((res?.data || []).map((r) => normalizeRole(r, permByKey)));
    } catch (e) {
      setPageError(e.message);
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
        setPageError(e.message);
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
    setDialogMode("add");
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
    setDialogMode("edit");
  };

  const closeDialog = () => setDialogMode(null);

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
      setDialogMode(null);
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
      setDialogMode(null);
      setEditingRole(null);
      setRoleForm(EMPTY_FORM);
      await refreshRoles();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (role) => {
    if (!canDelete) return; // ✅ RBAC guard
    setDeleteRole(role);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (!deleteRole) return;

    try {
      setPageError("");
      await apiRequest(`/api/roles/${deleteRole.id}`, { method: "DELETE" });
      setSelectedRoles((prev) => prev.filter((id) => id !== deleteRole.id));
      setDeleteRole(null);
      setIsDeleteDialogOpen(false);
      await refreshRoles();
    } catch (e) {
      setPageError(e.message);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (selectedRoles.length === 0) return;

    try {
      setPageError("");
      await Promise.all(
        selectedRoles.map((id) =>
          apiRequest(`/api/roles/${id}`, { method: "DELETE" }),
        ),
      );
      setSelectedRoles([]);
      await refreshRoles();
    } catch (e) {
      setPageError(e.message);
      await refreshRoles();
    }
  };

  // What a role can do, grouped by module: [{ module, label, actions: [..granted] , available: [..] }]
  const summarize = (role) => {
    const have = new Set(role.permissions || []);
    const mods = groupedModules
      .map((m) => {
        const available = ACTIONS.filter((a) => permissionMap[m]?.[a]);
        const actions = available.filter((a) => have.has(permissionMap[m][a]));
        return { module: m, label: moduleLabel(m), actions, available };
      })
      .filter((x) => x.actions.length > 0);
    const scope = saleViewScopes.find((s) => have.has(s.id));
    const others = (role.permissions || [])
      .map((id) => permKeyById[id])
      .filter((k) => k && !parsePermission(k) && !SCOPE_KEYS.includes(k));
    return { mods, scope, others };
  };

  /* ===================== the role editor (Add + Edit) ===================== */
  const renderMatrix = () => {
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
    const has = (id) => roleForm.permissions.includes(id);
    const isChecked = (ids) => ids.length > 0 && ids.every(has);
    const chosen = allIds.filter(has).length;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-slate-800">
            Permissions
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {chosen} / {allIds.length}
            </span>
          </Label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <Checkbox
              checked={isChecked(allIds)}
              onCheckedChange={(c) => setPermIds(allIds, c)}
            />
            Select all
          </label>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="p-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Module
                </th>
                {ACTIONS.map((a) => {
                  const ids = groupedModules
                    .map((m) => permissionMap[m]?.[a])
                    .filter(Boolean);
                  return (
                    <th key={a} className="w-20 p-2.5">
                      <label className="flex cursor-pointer flex-col items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {ACTION_LABEL[a]}
                        <Checkbox
                          checked={isChecked(ids)}
                          disabled={!ids.length}
                          onCheckedChange={(c) => setPermIds(ids, c)}
                          aria-label={`All ${ACTION_LABEL[a]}`}
                        />
                      </label>
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
                const n = rowIds.filter(has).length;
                return (
                  <tr
                    key={m}
                    className="border-b last:border-0 transition-colors hover:bg-slate-50/70"
                  >
                    <td className="p-2.5">
                      <label className="flex cursor-pointer items-center gap-2.5 font-medium text-slate-800">
                        <Checkbox
                          checked={isChecked(rowIds)}
                          onCheckedChange={(c) => setPermIds(rowIds, c)}
                          aria-label={`All ${moduleLabel(m)}`}
                        />
                        {moduleLabel(m)}
                        <span
                          className={`ml-auto text-[11px] tabular-nums ${n ? "text-indigo-600" : "text-slate-300"}`}
                        >
                          {n}/{rowIds.length}
                        </span>
                      </label>
                    </td>
                    {ACTIONS.map((a) => {
                      const id = permissionMap[m]?.[a];
                      return (
                        <td key={a} className="p-2.5 text-center">
                          {id ? (
                            <Checkbox
                              checked={has(id)}
                              onCheckedChange={(c) => setPermIds([id], c)}
                              aria-label={`${moduleLabel(m)} ${ACTION_LABEL[a]}`}
                            />
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {otherPerms.length > 0 && (
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Other
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {otherPerms.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <Checkbox
                    checked={has(p.id)}
                    onCheckedChange={(c) => setPermIds([p.id], c)}
                  />
                  {prettyPermKey(p.permission)}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderScope = () =>
    saleViewScopes.length > 0 && (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-slate-800">
            Sales visibility
          </Label>
          {saleViewScopes.some((s) => roleForm.permissions.includes(s.id)) && (
            <button
              type="button"
              onClick={() => setPermIds(saleViewScopes.map((s) => s.id), false)}
              className="text-xs text-slate-500 underline hover:text-slate-900"
            >
              Clear selection
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500">
          How much sales data this role can see. Only one can be selected.
        </p>

        <RadioGroup
          value={
            saleViewScopes.find((s) => roleForm.permissions.includes(s.id))
              ?.id || ""
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
          className="grid grid-cols-1 gap-2 sm:grid-cols-3"
        >
          {saleViewScopes.map((scope) => {
            const checked = roleForm.permissions.includes(scope.id);
            return (
              <label
                key={scope.id}
                htmlFor={`sale-scope-${scope.id}`}
                className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors ${
                  checked
                    ? "border-indigo-400 bg-indigo-50/60"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem
                    value={scope.id}
                    id={`sale-scope-${scope.id}`}
                  />
                  <span className="font-medium text-slate-900">
                    {scope.label}
                  </span>
                </div>
                <span className="text-xs text-slate-500">{scope.hint}</span>
              </label>
            );
          })}
        </RadioGroup>
      </div>
    );

  const isAdd = dialogMode === "add";

  /* ============================== the page ============================== */
  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-xl pl-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-400 sm:inline">
            {filteredRoles.length === roles.length
              ? `${roles.length} role${roles.length === 1 ? "" : "s"}`
              : `${filteredRoles.length} of ${roles.length} roles`}
          </span>
          {/* ✅ RBAC — hide Add Role entirely if no create permission */}
          {canCreate && (
            <Button variant="app" onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Role
            </Button>
          )}
        </div>
      </div>

      {pageError && (
        <div
          className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700"
          role="alert"
        >
          <span className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {pageError}
          </span>
          <button
            type="button"
            onClick={() => setPageError("")}
            className="shrink-0 text-rose-400 hover:text-rose-600"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* selection bar */}
      {selectedRoles.length > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/70 px-4 py-2.5">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-800">
            <Checkbox
              checked={
                selectedRoles.length === filteredRoles.length &&
                filteredRoles.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            {selectedRoles.length} of {filteredRoles.length} roles selected
          </label>
          {/* ✅ RBAC — bulk delete only if permitted */}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete selected
            </Button>
          )}
        </div>
      )}

      {rolesLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl bg-slate-100"
            />
          ))}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-6 py-14 text-center">
          <Shield className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-700">
            {roles.length ? "No roles match your search" : "No roles found"}
          </h3>
          <p className="mt-0.5 text-sm text-slate-400">
            {roles.length
              ? "Try a different name."
              : "Create your first role to get started."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredRoles.map((role, idx) => {
            const { mods, scope, others } = summarize(role);
            const total = permissions.length || 1;
            const count = (role.permissions || []).length;
            const isAdmin = String(role.name).toUpperCase() === "ADMIN";
            const selected = selectedRoles.includes(role.id);
            return (
              <article
                key={role.id}
                className={`group flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 transition-shadow hover:shadow-md ${
                  selected ? "ring-2 ring-indigo-400" : "ring-slate-200/80"
                }`}
                data-testid="role-card"
              >
                {/* header */}
                <div className="flex items-start gap-3">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${TILES[idx % TILES.length]}`}
                  >
                    {isAdmin ? (
                      <Crown className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-slate-900">
                      {role.name}
                    </h3>
                    <p className="line-clamp-2 text-[13px] leading-snug text-slate-500">
                      {role.description || "No description"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {/* ✅ RBAC — only render the actions cluster if the user
                        can actually edit or delete roles */}
                    {hasAnyRowAction && (
                      <>
                        {canEdit && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(role)}
                            className="h-8 w-8 p-0 hover:bg-slate-100"
                            aria-label={`Edit ${role.name}`}
                            title="Edit role"
                          >
                            <Pencil className="h-4 w-4 text-slate-500" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(role)}
                            className="h-8 w-8 p-0 hover:bg-rose-50"
                            aria-label={`Delete ${role.name}`}
                            title="Delete role"
                          >
                            <Trash2 className="h-4 w-4 text-slate-400 group-hover:text-rose-500" />
                          </Button>
                        )}
                      </>
                    )}
                    {canDelete && (
                      <Checkbox
                        checked={selected}
                        onCheckedChange={(checked) =>
                          handleSelectRole(role.id, checked)
                        }
                        className="ml-1.5"
                        aria-label={`Select ${role.name}`}
                      />
                    )}
                  </div>
                </div>

                {/* access level */}
                <div className="mt-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-medium uppercase tracking-wide">
                      Access
                    </span>
                    <span className="tabular-nums" data-testid="role-count">
                      {count} of {permissions.length} permissions
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: `${Math.min((count / total) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* what it can do, by module */}
                <div className="mt-3 flex-1">
                  {mods.length === 0 && !scope ? (
                    <p className="text-xs text-slate-400">No permissions yet.</p>
                  ) : (
                    <>
                      <div
                        className="grid grid-cols-1 gap-1.5 sm:grid-cols-2"
                        data-testid="role-modules"
                      >
                        {mods.map((m) => (
                          <div
                            key={m.module}
                            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5"
                          >
                            <span className="truncate text-xs font-medium text-slate-700">
                              {m.label}
                            </span>
                            <span className="flex shrink-0 gap-0.5">
                              {m.available.map((a) => {
                                const on = m.actions.includes(a);
                                return (
                                  <span
                                    key={a}
                                    title={`${ACTION_LABEL[a]}${on ? "" : " — not allowed"}`}
                                    className={`grid h-5 w-5 place-items-center rounded text-[10px] font-bold ${
                                      on
                                        ? "bg-indigo-100 text-indigo-700"
                                        : "bg-white text-slate-300 ring-1 ring-slate-100"
                                    }`}
                                  >
                                    {ACTION_LETTER[a]}
                                  </span>
                                );
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                      {(scope || others.length > 0) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {scope && (
                            <span
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200"
                              data-testid="role-scope"
                            >
                              {scope.key === "SALE_VIEW_BRANCH" ? (
                                <Building2 className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                              Sees: {scope.short}
                            </span>
                          )}
                          {others.map((k) => (
                            <span
                              key={k}
                              className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                            >
                              {prettyPermKey(k)}
                            </span>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* footer */}
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {role.userCount} user{role.userCount !== 1 ? "s" : ""}{" "}
                    assigned
                  </span>
                  <span>
                    Created {new Date(role.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* The key to the letters on the cards */}
      {renderLegend(filteredRoles.length > 0)}

      {/* Add / Edit Role dialog — ✅ RBAC: only mounted for who may use it */}
      {((isAdd && canCreate) || (dialogMode === "edit" && canEdit)) && (
        <Dialog
          open={!!dialogMode}
          onOpenChange={(o) => !o && closeDialog()}
        >
          <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
            <DialogHeader className="border-b border-slate-100 px-6 pb-4 pt-5 text-left">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div className="pr-6">
                  <DialogTitle className="text-lg">
                    {isAdd ? "Add new role" : `Edit role${editingRole ? ` — ${editingRole.name}` : ""}`}
                  </DialogTitle>
                  <DialogDescription className="text-[13px]">
                    {isAdd
                      ? "Create a user role with specific permissions."
                      : "Update the role's information and permissions."}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              {error && (
                <div
                  className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                  role="alert"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-slate-800">
                    Role name
                  </Label>
                  <Input
                    placeholder="e.g., Manager"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="h-10 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5 sm:row-span-1">
                  <Label className="text-sm font-semibold text-slate-800">
                    Description
                  </Label>
                  <Textarea
                    placeholder="What is this role for?"
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={2}
                    className="min-h-10 resize-none rounded-lg"
                  />
                </div>
              </div>

              {renderMatrix()}
              {renderScope()}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-3.5">
              <span className="text-xs text-slate-500">
                {roleForm.permissions.length} permission
                {roleForm.permissions.length === 1 ? "" : "s"} selected
                {!isFormValid && (
                  <span className="ml-2 text-amber-600">
                    · name, description and at least one permission are required
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button
                  variant="app"
                  onClick={isAdd ? handleAddRole : handleUpdateRole}
                  disabled={!isFormValid || saving}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  {isAdd
                    ? saving
                      ? "Adding..."
                      : "Add Role"
                    : saving
                      ? "Updating..."
                      : "Update Role"}
                </Button>
              </div>
            </div>
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
              <AlertDialogTitle>
                Delete {deleteRole ? `“${deleteRole.name}”` : "this role"}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                role.
                {deleteRole?.userCount > 0 && (
                  <span className="mt-2 block font-medium text-amber-700">
                    {deleteRole.userCount} user
                    {deleteRole.userCount === 1 ? " is" : "s are"} assigned to
                    this role.
                  </span>
                )}
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

// The small key under the cards: what V C E D mean
function renderLegend(show) {
  if (!show) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
      {ACTIONS.map((a) => (
        <span key={a} className="inline-flex items-center gap-1.5">
          <span className="grid h-4 w-4 place-items-center rounded bg-indigo-100 text-[9px] font-bold text-indigo-700">
            {ACTION_LETTER[a]}
          </span>
          {ACTION_LABEL[a]}
        </span>
      ))}
    </div>
  );
}
