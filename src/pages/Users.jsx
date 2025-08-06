import { useState } from "react";
import { Users, Shield, UserCheck } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../shadcn/components/ui/tabs";
import UsersTab from "../components/Users-tab";
import RolesTab from "../components/Roles-tab";

// Mock data
export const initialRoles = [
  {
    id: "1",
    name: "Admin",
    description: "Full system access with all permissions",
    permissions: ["read", "write", "delete", "manage_users", "manage_roles"],
    userCount: 2,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Manager",
    description: "Management level access with limited admin permissions",
    permissions: ["read", "write", "manage_bookings"],
    userCount: 5,
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Agent",
    description: "Standard user access for booking and customer management",
    permissions: ["read", "write"],
    userCount: 12,
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    name: "Viewer",
    description: "Read-only access to system data",
    permissions: ["read"],
    userCount: 3,
    createdAt: "2024-02-10",
  },
];

export const initialUsers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@alrayyan.com",
    role: "Admin",
    status: "Active",
    phone: "+1 234 567 8901",
    department: "IT",
    lastLogin: "2024-03-15 10:30 AM",
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.johnson@alrayyan.com",
    role: "Manager",
    status: "Active",
    phone: "+1 234 567 8902",
    department: "Sales",
    lastLogin: "2024-03-15 09:15 AM",
    createdAt: "2024-01-20",
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@alrayyan.com",
    role: "Agent",
    status: "Active",
    phone: "+1 234 567 8903",
    department: "Customer Service",
    lastLogin: "2024-03-14 04:45 PM",
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    name: "Emily Davis",
    email: "emily.davis@alrayyan.com",
    role: "Agent",
    status: "Inactive",
    phone: "+1 234 567 8904",
    department: "Bookings",
    lastLogin: "2024-03-10 02:20 PM",
    createdAt: "2024-02-05",
  },
  {
    id: "5",
    name: "David Brown",
    email: "david.brown@alrayyan.com",
    role: "Viewer",
    status: "Active",
    phone: "+1 234 567 8905",
    department: "Finance",
    lastLogin: "2024-03-15 08:00 AM",
    createdAt: "2024-02-10",
  },
];

export default function UsersMain() {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(initialRoles);

  // Calculate statistics
  const totalUsers = users.length;
  const totalRoles = roles.length;
  const activeUsers = users.filter((user) => user.status === "Active").length;

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              Available user roles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UsersTab users={users} setUsers={setUsers} roles={roles} />
            </TabsContent>

            <TabsContent value="roles">
              <RolesTab roles={roles} setRoles={setRoles} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
