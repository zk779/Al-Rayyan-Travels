import { useMemo, useState } from "react";
import {
  Search,
  Trash2,
  UserPlus,
  Edit,
  Eye,
  MoreHorizontal,
} from "lucide-react";

import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../shadcn/components/ui/select";
import { Badge } from "../../shadcn/components/ui/badge";
import { Checkbox } from "../../shadcn/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../shadcn/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../shadcn/components/ui/dropdown-menu";
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
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS

const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g. http://localhost:5000

async function requestJSON(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
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

function getStatusLabel(u) {
  if (typeof u?.isActive === "boolean")
    return u.isActive ? "Active" : "Inactive";
  if (u?.status) return u.status;
  return "Active";
}

function getUserRoleName(u) {
  if (typeof u?.role === "string") return u.role;
  return u?.role?.name || "";
}
function getUserRoleId(u) {
  return u?.roleId || u?.role?.id || "";
}

function getUserBranchName(u) {
  if (typeof u?.branch === "string") return u.branch;
  return u?.branch?.name || "";
}
function getUserBranchId(u) {
  return u?.branchId || u?.branch?.id || "";
}

// ✅ FIX: normalizes any user object — whether it came from the initial
// GET /api/users list (populated with role/branch objects) or from a
// POST/PUT response (which may only include roleId/branchId, with no
// nested role/branch names) — into one consistent shape.
//
// Role/branch names are resolved by looking up the id against the
// roles/branches lists already available as props. This is what was
// causing blank Role/Branch cells right after creating or editing a
// user, and stale-looking values when reopening the edit dialog for
// that same user.
function buildUserRecord(raw, roles, branches) {
  const roleId = getUserRoleId(raw);
  const branchId = getUserBranchId(raw);

  const roleName =
    getUserRoleName(raw) ||
    (roles || []).find((r) => r.id === roleId)?.name ||
    "";

  const branchName =
    getUserBranchName(raw) ||
    (branches || []).find((b) => b.id === branchId)?.name ||
    "";

  return {
    id: raw.id,
    name: raw.fullName ?? raw.name ?? "",
    email: raw.email ?? "",
    roleId,
    role: roleName,
    branchId,
    branch: branchName,
    status: getStatusLabel(raw),
    phone: raw.phone ?? "",
    department: raw.department ?? "",
    lastLogin: raw.lastLogin ?? "",
    createdAt: raw.createdAt ?? "",
  };
}

export default function UsersTab({ users, setUsers, roles, branches }) {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("USER_CREATE");
  const canEdit = hasPermission("USER_EDIT");
  const canDelete = hasPermission("USER_DELETE");
  const hasAnyRowAction = canEdit || canDelete;

  const [selectedUsers, setSelectedUsers] = useState([]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all"); // store roleId
  const [searchQuery, setSearchQuery] = useState("");

  // single dialog for add/edit
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("add"); // "add" | "edit"
  const [editingUser, setEditingUser] = useState(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    password: "", // required for add
    phone: "",
    department: "", // optional (only if your schema supports)
    roleId: "",
    branchId: "",
    isActive: true,
  });

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return (users || []).filter((u) => {
      const status = getStatusLabel(u).toLowerCase();
      const roleName = getUserRoleName(u);
      const roleId = getUserRoleId(u);

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesRole =
        roleFilter === "all" ||
        roleId === roleFilter ||
        roleName === roleFilter;

      const name = (u.fullName || u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const dept = (u.department || "").toLowerCase();
      const branch = getUserBranchName(u).toLowerCase();

      const matchesSearch =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        dept.includes(q) ||
        branch.includes(q) ||
        roleName.toLowerCase().includes(q);

      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [users, statusFilter, roleFilter, searchQuery]);

  const handleSelectAll = (checked) => {
    setSelectedUsers(checked ? filteredUsers.map((u) => u.id) : []);
  };

  const handleSelectUser = (userId, checked) => {
    setSelectedUsers(
      checked
        ? [...selectedUsers, userId]
        : selectedUsers.filter((id) => id !== userId)
    );
  };

  const openAddDialog = () => {
    if (!canCreate) return; // ✅ RBAC guard
    setDialogMode("add");
    setEditingUser(null);
    setFormError("");
    setUserForm({
      fullName: "",
      email: "",
      password: "",
      phone: "",
      department: "",
      roleId: "",
      branchId: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (u) => {
    if (!canEdit) return; // ✅ RBAC guard
    setDialogMode("edit");
    setEditingUser(u);
    setFormError("");

    setUserForm({
      fullName: u.fullName || u.name || "",
      email: u.email || "",
      password: "", // optional in edit
      phone: u.phone || "",
      department: u.department || "",
      roleId: getUserRoleId(u),
      branchId: getUserBranchId(u),
      isActive: getStatusLabel(u) === "Active",
    });

    setIsDialogOpen(true);
  };

  const submitDialog = async () => {
    // ✅ RBAC guard
    if (dialogMode === "add" && !canCreate) return;
    if (dialogMode === "edit" && !canEdit) return;

    setFormError("");

    if (
      !userForm.fullName ||
      !userForm.email ||
      !userForm.roleId ||
      !userForm.branchId
    ) {
      setFormError("Full name, email, role and branch are required.");
      return;
    }
    if (dialogMode === "add" && !userForm.password) {
      setFormError("Password is required to create a user.");
      return;
    }

    try {
      setSubmitting(true);

      if (dialogMode === "add") {
        const payload = {
          fullName: userForm.fullName,
          email: userForm.email,
          password: userForm.password,
          phone: userForm.phone,
          department: userForm.department,
          roleId: userForm.roleId,
          branchId: userForm.branchId,
          isActive: userForm.isActive,
        };

        const res = await requestJSON("/api/users", {
          method: "POST",
          body: payload,
        });
        const created = res?.data;

        // ✅ FIX: normalize before storing, resolving role/branch names
        // from the roles/branches props instead of assuming the API
        // response came back populated.
        setUsers((prev) => [
          buildUserRecord(created, roles, branches),
          ...(prev || []),
        ]);
      } else {
        const payload = {
          fullName: userForm.fullName,
          email: userForm.email,
          phone: userForm.phone,
          department: userForm.department,
          roleId: userForm.roleId,
          branchId: userForm.branchId,
          isActive: userForm.isActive,
          ...(userForm.password ? { password: userForm.password } : {}),
        };

        const res = await requestJSON(`/api/users/${editingUser.id}`, {
          method: "PUT",
          body: payload,
        });
        const updated = res?.data;
        const normalizedUpdated = buildUserRecord(updated, roles, branches);

        setUsers((prev) =>
          (prev || []).map((u) =>
            u.id === normalizedUpdated.id ? normalizedUpdated : u
          )
        );
      }

      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (e) {
      setFormError(e?.message || "Failed to save user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    if (!canDelete) return; // ✅ RBAC guard
    setDeleteUserId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (!deleteUserId) return;

    try {
      setSubmitting(true);
      await requestJSON(`/api/users/${deleteUserId}`, { method: "DELETE" });

      setUsers((prev) => (prev || []).filter((u) => u.id !== deleteUserId));
      setSelectedUsers((prev) => prev.filter((id) => id !== deleteUserId));
      setDeleteUserId(null);
      setIsDeleteDialogOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (selectedUsers.length === 0) return;

    try {
      setSubmitting(true);

      await Promise.all(
        selectedUsers.map((id) =>
          requestJSON(`/api/users/${id}`, { method: "DELETE" })
        )
      );

      setUsers((prev) =>
        (prev || []).filter((u) => !selectedUsers.includes(u.id))
      );
      setSelectedUsers([]);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    const safe = (name || "").trim();
    if (!safe) return "U";
    return safe
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {(roles || []).map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          {/* ✅ RBAC — bulk delete only if permitted */}
          {canDelete && selectedUsers.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={submitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedUsers.length})
            </Button>
          )}

          {/* ✅ RBAC — hide Add User entirely if no create permission */}
          {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="app" onClick={openAddDialog}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>

              {/* ✅ BUG FIX: key forces a clean remount whenever we switch between
                  add/edit or between two different users — prevents Radix Select
                  components from showing a previous user's stale selected value */}
              <DialogContent
                key={`${dialogMode}-${editingUser?.id ?? "new"}`}
                className="sm:max-w-lg"
              >
                <DialogHeader>
                  <DialogTitle>
                    {dialogMode === "add" ? "Add New User" : "Edit User"}
                  </DialogTitle>
                  <DialogDescription>
                    {dialogMode === "add"
                      ? "Create a new user account."
                      : "Update user information."}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {formError ? (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {formError}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="John Smith"
                        value={userForm.fullName}
                        onChange={(e) =>
                          setUserForm({ ...userForm, fullName: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        value={userForm.email}
                        onChange={(e) =>
                          setUserForm({ ...userForm, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={userForm.roleId}
                        onValueChange={(value) =>
                          setUserForm({ ...userForm, roleId: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {(roles || []).map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Select
                        value={userForm.branchId}
                        onValueChange={(value) =>
                          setUserForm({ ...userForm, branchId: value })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {(branches || []).map((b) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name} {b.code ? `(${b.code})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+92 300 1234567"
                        value={userForm.phone}
                        onChange={(e) =>
                          setUserForm({ ...userForm, phone: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Input
                        placeholder="IT"
                        value={userForm.department}
                        onChange={(e) =>
                          setUserForm({ ...userForm, department: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        Password{" "}
                        {dialogMode === "edit" ? (
                          <span className="text-xs text-muted-foreground">
                            (optional)
                          </span>
                        ) : null}
                      </Label>
                      <Input
                        type="password"
                        placeholder={
                          dialogMode === "edit"
                            ? "Leave blank to keep current"
                            : "Enter password"
                        }
                        value={userForm.password}
                        onChange={(e) =>
                          setUserForm({ ...userForm, password: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={userForm.isActive ? "Active" : "Inactive"}
                        onValueChange={(v) =>
                          setUserForm({ ...userForm, isActive: v === "Active" })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="app"
                    onClick={submitDialog}
                    disabled={submitting}
                  >
                    {submitting
                      ? "Saving..."
                      : dialogMode === "add"
                      ? "Add User"
                      : "Update User"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={
                    selectedUsers.length === filteredUsers.length &&
                    filteredUsers.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              {/* ✅ RBAC — only show Actions header if user can act on rows */}
              {hasAnyRowAction && <TableHead className="w-20">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={hasAnyRowAction ? 6 : 5}
                  className="text-center py-8 text-gray-500"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => {
                const displayName = u.fullName || u.name || "";
                const roleName = getUserRoleName(u);
                const branchName = getUserBranchName(u);
                const status = getStatusLabel(u);

                return (
                  <TableRow key={u.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={(checked) =>
                          handleSelectUser(u.id, checked)
                        }
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={u.avatar || "/placeholder.svg"} />
                          <AvatarFallback>
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{displayName}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="app">{roleName || "—"}</Badge>
                    </TableCell>

                    <TableCell className="text-sm text-gray-600">
                      {branchName || "—"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={status === "Active" ? "success" : "secondary"}
                      >
                        {status}
                      </Badge>
                    </TableCell>

                    {/* ✅ RBAC — only render Actions cell if user can act on rows */}
                    {hasAnyRowAction && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            {canEdit && (
                              <DropdownMenuItem onClick={() => openEditDialog(u)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}

                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(u.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-600">
        <span>
          Showing {filteredUsers.length} of {users.length} users
        </span>
        {selectedUsers.length > 0 && (
          <span>{selectedUsers.length} users selected</span>
        )}
      </div>

      {/* ✅ RBAC — only mount delete confirmation if user can delete */}
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
                user account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={submitting}
              >
                {submitting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}