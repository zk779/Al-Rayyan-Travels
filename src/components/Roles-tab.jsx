import { useState } from "react";
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

const availablePermissions = [
  "Sales",
  "Vendors",
  "Customers",
  "Airline Codes",
  "Dashboard",
  "Users",
  "Reports",
  "Ledger",
];

export default function RolesTab({ roles, setRoles }) {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deleteRoleId, setDeleteRoleId] = useState(null);

  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: [],
  });

  // Filter roles
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (checked) => {
    setSelectedRoles(checked ? filteredRoles.map((role) => role.id) : []);
  };

  const handleSelectRole = (roleId, checked) => {
    setSelectedRoles(
      checked
        ? [...selectedRoles, roleId]
        : selectedRoles.filter((id) => id !== roleId)
    );
  };

  const handleAddRole = () => {
    const newRole = {
      id: Date.now().toString(),
      ...roleForm,
      userCount: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setRoles([...roles, newRole]);
    setRoleForm({ name: "", description: "", permissions: [] });
    setIsAddDialogOpen(false);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = () => {
    setRoles(
      roles.map((role) =>
        role.id === editingRole.id ? { ...role, ...roleForm } : role
      )
    );
    setEditingRole(null);
    setRoleForm({ name: "", description: "", permissions: [] });
    setIsEditDialogOpen(false);
  };

  const handleDelete = (id) => {
    setDeleteRoleId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    setRoles(roles.filter((role) => role.id !== deleteRoleId));
    setSelectedRoles(selectedRoles.filter((id) => id !== deleteRoleId));
    setDeleteRoleId(null);
    setIsDeleteDialogOpen(false);
  };

  const handleBulkDelete = () => {
    setRoles(roles.filter((role) => !selectedRoles.includes(role.id)));
    setSelectedRoles([]);
  };

  const togglePermission = (permission) => {
    setRoleForm({
      ...roleForm,
      permissions: roleForm.permissions.includes(permission)
        ? roleForm.permissions.filter((p) => p !== permission)
        : [...roleForm.permissions, permission],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="app">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
                <DialogDescription>
                  Create a new user role with specific permissions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Role Name</Label>
                  <Input
                    placeholder="e.g., Manager"
                    value={roleForm.name}
                    onChange={(e) =>
                      setRoleForm({ ...roleForm, name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the role and its responsibilities..."
                    value={roleForm.description}
                    onChange={(e) =>
                      setRoleForm({ ...roleForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePermissions.map((permission) => (
                      <div
                        key={permission}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={permission}
                          checked={roleForm.permissions.includes(permission)}
                          onCheckedChange={() => togglePermission(permission)}
                        />
                        <Label
                          htmlFor={permission}
                          className="text-sm capitalize"
                        >
                          {permission.replace("_", " ")}
                        </Label>
                      </div>
                    ))}
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
                  variant={"app"}
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
      {filteredRoles.length === 0 ? (
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
                      {role.permissions.map((permission) => (
                        <Badge
                          key={permission}
                          variant="app"
                          className="text-xs px-2 py-1"
                        >
                          {permission
                            .replace("_", " ")
                            .replace(/\b\w/g, (l) => l.toUpperCase())}
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

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Update role information and permissions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                value={roleForm.name}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={roleForm.description}
                onChange={(e) =>
                  setRoleForm({ ...roleForm, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="grid grid-cols-2 gap-2">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${permission}`}
                      checked={roleForm.permissions.includes(permission)}
                      onCheckedChange={() => togglePermission(permission)}
                    />
                    <Label
                      htmlFor={`edit-${permission}`}
                      className="text-sm capitalize"
                    >
                      {permission.replace("_", " ")}
                    </Label>
                  </div>
                ))}
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
            <Button variant={"app"} onClick={handleUpdateRole}>
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
