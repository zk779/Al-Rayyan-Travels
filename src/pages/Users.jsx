import { useEffect, useMemo, useState } from "react";
import { Users, Shield, UserCheck, Building2 } from "lucide-react";
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
import BranchesTab from "../components/Branches-tab";

const API_BASE = import.meta.env.VITE_API_BASE_URL; // http://localhost:5000

async function fetchJSON(url, token) {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error || data?.message || "Request failed");
  }
  return data;
}

export default function UsersMain() {
  const [activeTab, setActiveTab] = useState("users");

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    let isMounted = true;

    async function loadAll() {
      try {
        setLoading(true);
        setError("");

        const [usersRes, rolesRes, branchesRes] = await Promise.all([
          fetchJSON(`${API_BASE}/api/users`, token),
          fetchJSON(`${API_BASE}/api/roles`, token),
          fetchJSON(`${API_BASE}/api/branches`, token),
        ]);

        // ✅ expecting: { success: true, data: [...] }
        const usersData = usersRes?.data ?? [];
        const rolesData = rolesRes?.data ?? [];
        const branchesData = branchesRes?.data ?? [];

        // Optional: normalize fields if backend uses different keys
        const normalizedUsers = usersData.map((u) => ({
          id: u.id,
          name: u.fullName ?? u.name ?? "",
          email: u.email ?? "",
          role: u.role?.name ?? u.role ?? "", // depends on backend
          status: u.isActive ? "Active" : "Inactive",
          phone: u.phone ?? "",
          department: u.department ?? "",
          lastLogin: u.lastLogin ?? "",
          createdAt: u.createdAt ?? "",
        }));

        const normalizedRoles = rolesData.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? "",
          permissions: r.permissions ?? [], // if you return them
          userCount: r.userCount ?? 0, // if backend returns
          createdAt: r.createdAt ?? "",
        }));

        const normalizedBranches = branchesData.map((b) => ({
          id: b.id,
          name: b.name,
          code: b.code ?? "",
          address: b.address ?? "",
          city: b.city ?? "",
          country: b.country ?? "",
          phone: b.phone ?? "",
          email: b.email ?? "",
          manager: b.manager ?? "",
          status: b.isActive === false ? "Inactive" : "Active",
          employeeCount: b.employeeCount ?? 0,
          createdAt: b.createdAt ?? "",
        }));

        if (!isMounted) return;
        setUsers(normalizedUsers);
        setRoles(normalizedRoles);
        setBranches(normalizedBranches);
      } catch (err) {
        if (!isMounted) return;
        setError(err?.message || "Failed to load data");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // ✅ stats
  const totalUsers = users.length;
  const totalRoles = roles.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const totalBranches = branches.length;

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Loading / Error */}
      {loading ? (
        <div className="rounded-xl border bg-white p-4 text-sm text-gray-600">
          Loading users, roles & branches...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Branches
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalBranches}
            </div>
            <p className="text-xs text-muted-foreground">Branch locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Management System
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="branches">Branches</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <UsersTab
                users={users}
                setUsers={setUsers}
                roles={roles}
                branches={branches}
              />
            </TabsContent>

            <TabsContent value="roles">
              <RolesTab roles={roles} setRoles={setRoles} />
            </TabsContent>

            <TabsContent value="branches">
              <BranchesTab
                branches={branches}
                setBranches={setBranches}
                users={users}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
