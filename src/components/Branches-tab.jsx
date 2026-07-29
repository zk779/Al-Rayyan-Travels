import { useState } from "react";
import {
  Search,
  Trash2,
  Edit,
  Eye,
  MoreHorizontal,
  MapPin,
  Phone,
  Mail,
  User,
  Building2Icon,
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
import { Textarea } from "../../shadcn/components/ui/textarea";
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS

const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g. http://localhost:5000

async function api(path, { method = "GET", body } = {}) {
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

export default function BranchesTab({ branches, setBranches, users }) {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("BRANCH_CREATE");
  const canEdit = hasPermission("BRANCH_EDIT");
  const canDelete = hasPermission("BRANCH_DELETE");
  const hasAnyRowAction = canEdit || canDelete;

  const [selectedBranches, setSelectedBranches] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deleteBranchId, setDeleteBranchId] = useState(null);

  const initialForm = {
    name: "",
    code: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    manager: "",
    status: "Active",
  };

  const [branchForm, setBranchForm] = useState(initialForm);

  // Filter branches (same logic)
  const filteredBranches = branches.filter((branch) => {
    const matchesStatus =
      statusFilter === "all" ||
      branch.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.manager.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleSelectAll = (checked) => {
    setSelectedBranches(checked ? filteredBranches.map((b) => b.id) : []);
  };

  const handleSelectBranch = (branchId, checked) => {
    setSelectedBranches(
      checked
        ? [...selectedBranches, branchId]
        : selectedBranches.filter((id) => id !== branchId)
    );
  };

  const openAddDialog = () => {
    if (!canCreate) return; // ✅ RBAC guard
    setBranchForm(initialForm);
    setIsAddDialogOpen(true);
  };

  // ✅ Dynamic: Add Branch
  const handleAddBranch = async () => {
    if (!canCreate) return; // ✅ RBAC guard

    try {
      const payload = {
        name: branchForm.name,
        code: branchForm.code,
        address: branchForm.address,
        city: branchForm.city,
        country: branchForm.country,
        phone: branchForm.phone,
        email: branchForm.email,
        manager: branchForm.manager,
        isActive: branchForm.status === "Active",
      };

      const res = await api("/api/branches", { method: "POST", body: payload });
      const b = res?.data || {};

      const newBranch = {
        ...b,
        status:
          typeof b.isActive === "boolean"
            ? b.isActive
              ? "Active"
              : "Inactive"
            : branchForm.status,
        employeeCount: b.employeeCount ?? 0,
        manager: b.manager ?? branchForm.manager,
      };

      setBranches([...branches, newBranch]);
      setBranchForm(initialForm);
      setIsAddDialogOpen(false);
    } catch (e) {
      console.error("Add branch failed:", e.message);
    }
  };

  const handleEditBranch = (branch) => {
    if (!canEdit) return; // ✅ RBAC guard

    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      country: branch.country,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
      status: branch.status,
    });
    setIsEditDialogOpen(true);
  };

  // ✅ Dynamic: Update Branch
  const handleUpdateBranch = async () => {
    if (!canEdit) return; // ✅ RBAC guard

    try {
      const payload = {
        name: branchForm.name,
        code: branchForm.code,
        address: branchForm.address,
        city: branchForm.city,
        country: branchForm.country,
        phone: branchForm.phone,
        email: branchForm.email,
        manager: branchForm.manager,
        isActive: branchForm.status === "Active",
      };

      const res = await api(`/api/branches/${editingBranch.id}`, {
        method: "PUT",
        body: payload,
      });

      const b = res?.data || {};
      const updated = {
        ...b,
        status:
          typeof b.isActive === "boolean"
            ? b.isActive
              ? "Active"
              : "Inactive"
            : branchForm.status,
        employeeCount: b.employeeCount ?? editingBranch.employeeCount ?? 0,
        manager: b.manager ?? branchForm.manager,
      };

      setBranches(
        branches.map((br) => (br.id === editingBranch.id ? updated : br))
      );
      setEditingBranch(null);
      setBranchForm(initialForm);
      setIsEditDialogOpen(false);
    } catch (e) {
      console.error("Update branch failed:", e.message);
    }
  };

  const handleDelete = (id) => {
    if (!canDelete) return; // ✅ RBAC guard
    setDeleteBranchId(id);
    setIsDeleteDialogOpen(true);
  };

  // ✅ Dynamic: Delete Branch
  const confirmDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (!deleteBranchId) return;

    try {
      await api(`/api/branches/${deleteBranchId}`, { method: "DELETE" });

      setBranches(branches.filter((b) => b.id !== deleteBranchId));
      setSelectedBranches(
        selectedBranches.filter((id) => id !== deleteBranchId)
      );
      setDeleteBranchId(null);
      setIsDeleteDialogOpen(false);
    } catch (e) {
      console.error("Delete branch failed:", e.message);
    }
  };

  // ✅ Dynamic: Bulk Delete
  const handleBulkDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    if (selectedBranches.length === 0) return;

    try {
      await Promise.all(
        selectedBranches.map((id) =>
          api(`/api/branches/${id}`, { method: "DELETE" })
        )
      );

      setBranches(branches.filter((b) => !selectedBranches.includes(b.id)));
      setSelectedBranches([]);
    } catch (e) {
      console.error("Bulk delete failed:", e.message);
    }
  };

  // Get available managers (same logic, but supports API shape too)
  const availableManagers = users.filter((u) => {
    const roleName = typeof u.role === "string" ? u.role : u.role?.name;
    return (
      roleName === "Manager" ||
      roleName === "Admin" ||
      roleName === "MANAGER" ||
      roleName === "ADMIN"
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search branches..."
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
          </div>
        </div>

        <div className="flex gap-2">
          {/* ✅ RBAC — bulk delete only if permitted */}
          {canDelete && selectedBranches.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedBranches.length})
            </Button>
          )}

          {/* ✅ RBAC — hide Add Branch entirely if no create permission */}
          {canCreate && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openAddDialog}>
                  <Building2Icon className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Branch</DialogTitle>
                  <DialogDescription>
                    Create a new branch location.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Branch Name</Label>
                      <Input
                        placeholder="Main Branch"
                        value={branchForm.name}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch Code</Label>
                      <Input
                        placeholder="MB001"
                        value={branchForm.code}
                        onChange={(e) =>
                          setBranchForm({
                            ...branchForm,
                            code: e.target.value.toUpperCase(),
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Textarea
                      placeholder="123 Business District, Downtown"
                      value={branchForm.address}
                      onChange={(e) =>
                        setBranchForm({ ...branchForm, address: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        placeholder="New York"
                        value={branchForm.city}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, city: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <Input
                        placeholder="USA"
                        value={branchForm.country}
                        onChange={(e) =>
                          setBranchForm({
                            ...branchForm,
                            country: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        placeholder="+1 555 123 4567"
                        value={branchForm.phone}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, phone: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="branch@alrayyan.com"
                        value={branchForm.email}
                        onChange={(e) =>
                          setBranchForm({ ...branchForm, email: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Manager</Label>
                      <Select
                        value={branchForm.manager}
                        onValueChange={(value) =>
                          setBranchForm({ ...branchForm, manager: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select manager" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableManagers.map((u) => {
                            const name = u.fullName || u.name;
                            const roleName =
                              typeof u.role === "string" ? u.role : u.role?.name;
                            return (
                              <SelectItem key={u.id} value={name}>
                                {name} ({roleName})
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={branchForm.status}
                        onValueChange={(value) =>
                          setBranchForm({ ...branchForm, status: value })
                        }
                      >
                        <SelectTrigger>
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
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddBranch}
                    disabled={!branchForm.name || !branchForm.code}
                  >
                    Add Branch
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Bulk Selection Header */}
      {selectedBranches.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={
                selectedBranches.length === filteredBranches.length &&
                filteredBranches.length > 0
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedBranches.length} of {filteredBranches.length} branches
              selected
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

      {/* Branches Cards Grid */}
      {filteredBranches.length === 0 ? (
        <div className="text-center py-12">
          <Building2Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No branches found
          </h3>
          <p className="text-gray-500">
            Create your first branch to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBranches.map((branch) => (
            <Card
              key={branch.id}
              className="relative hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedBranches.includes(branch.id)}
                      onCheckedChange={(checked) =>
                        handleSelectBranch(branch.id, checked)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Building2Icon className="h-5 w-5 text-blue-500" />
                        {branch.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="mt-1 font-mono text-xs"
                      >
                        {branch.code}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Badge
                      variant={
                        branch.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {branch.status}
                    </Badge>

                    {/* ✅ RBAC — only show the actions menu if there's an
                        action the user is actually allowed to take (View
                        Details stays visible on its own since reaching this
                        tab already implies BRANCH_READ) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>

                        {canEdit && (
                          <DropdownMenuItem
                            onClick={() => handleEditBranch(branch)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        )}

                        {canDelete && (
                          <DropdownMenuItem
                            onClick={() => handleDelete(branch.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">{branch.address}</div>
                      <div className="text-gray-500">
                        {branch.city}, {branch.country}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span>{branch.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="truncate">{branch.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{branch.manager}</span>
                    <Badge variant="secondary" className="text-xs">
                      Manager
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-sm text-gray-600">
                      {branch.employeeCount} employee
                      {branch.employeeCount !== 1 ? "s" : ""}
                    </span>
                    <span className="text-sm text-gray-500">
                      Created: {new Date(branch.createdAt).toLocaleDateString()}
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
          Showing {filteredBranches.length} of {branches.length} branches
        </span>
        {selectedBranches.length > 0 && (
          <span>{selectedBranches.length} branches selected</span>
        )}
      </div>

      {/* Edit Branch Dialog — ✅ RBAC: only mount if user can edit */}
      {canEdit && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Branch</DialogTitle>
              <DialogDescription>Update branch information.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Branch Name</Label>
                  <Input
                    value={branchForm.name}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch Code</Label>
                  <Input
                    value={branchForm.code}
                    onChange={(e) =>
                      setBranchForm({
                        ...branchForm,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Textarea
                  value={branchForm.address}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, address: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={branchForm.city}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, city: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={branchForm.country}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, country: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={branchForm.phone}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={branchForm.email}
                    onChange={(e) =>
                      setBranchForm({ ...branchForm, email: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={branchForm.status}
                    onValueChange={(value) =>
                      setBranchForm({ ...branchForm, status: value })
                    }
                  >
                    <SelectTrigger className={"w-full"}>
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
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateBranch}>Update Branch</Button>
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
                branch.
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