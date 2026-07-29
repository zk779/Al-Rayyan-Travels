import { useEffect, useMemo, useState } from "react";
import { Users, Shield, UserCheck, Building2, Lock } from "lucide-react";
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
import { useAuth } from "../context/AuthContext"; // ✅ ADD THIS

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
  // ✅ RBAC — permission flags for each section
  const { hasPermission } = useAuth();
  const canViewUsers = hasPermission("USER_READ");
  const canViewRoles = hasPermission("ROLE_READ");
  const canViewBranches = hasPermission("BRANCH_READ");

  const visibleTabs = [
    canViewUsers && "users",
    canViewBranches && "branches",
    canViewRoles && "roles",
  ].filter(Boolean);

  const [activeTab, setActiveTab] = useState(visibleTabs[0] || "");

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
        const needRoles = canViewRoles || canViewUsers;
        const needBranches = canViewBranches || canViewUsers;

        const [usersRes, rolesRes, branchesRes] = await Promise.all([
          canViewUsers
            ? fetchJSON(`${API_BASE}/api/users`, token)
            : Promise.resolve({ data: [] }),
          needRoles
            ? fetchJSON(`${API_BASE}/api/roles`, token)
            : Promise.resolve({ data: [] }),
          needBranches
            ? fetchJSON(`${API_BASE}/api/branches`, token)
            : Promise.resolve({ data: [] }),
        ]);

        // ✅ expecting: { success: true, data: [...] }
        const usersData = usersRes?.data ?? [];
        const rolesData = rolesRes?.data ?? [];
        const branchesData = branchesRes?.data ?? [];

        // Normalize users — keep roleId/branchId (needed for edit forms & updates),
        // plus role/branch display info for the table.
        const normalizedUsers = usersData.map((u) => ({
          id: u.id,
          name: u.fullName ?? u.name ?? "",
          email: u.email ?? "",
          roleId: u.roleId ?? u.role?.id ?? "",
          role: u.role?.name ?? "", // display name
          branchId: u.branchId ?? u.branch?.id ?? "",
          branch: u.branch?.name ?? "", // display name
          status: u.isActive ? "Active" : "Inactive",
          phone: u.phone ?? "",
          department: u.department ?? "",
          lastLogin: u.lastLogin ?? "",
          createdAt: u.createdAt ?? "",
        }));

        // Normalize roles first (without counts — computed below once users exist)
        const normalizedRolesBase = rolesData.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? "",
          permissions: r.permissions ?? [],
          isActive: r.isActive ?? true,
          createdAt: r.createdAt ?? "",
        }));

        const normalizedBranchesBase = branchesData.map((b) => ({
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
          createdAt: b.createdAt ?? "",
        }));

        // API doesn't return userCount / employeeCount, so derive them
        // client-side from the users list we already have.
        const normalizedRoles = normalizedRolesBase.map((role) => ({
          ...role,
          userCount: normalizedUsers.filter((u) => u.roleId === role.id)
            .length,
        }));

        const normalizedBranches = normalizedBranchesBase.map((branch) => ({
          ...branch,
          employeeCount: normalizedUsers.filter(
            (u) => u.branchId === branch.id
          ).length,
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

    if (visibleTabs.length > 0) {
      loadAll();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, canViewUsers, canViewRoles, canViewBranches]);

  // ✅ keep the active tab valid if permissions change or the current
  // selection isn't one the user can actually see
  useEffect(() => {
    if (visibleTabs.length && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleTabs.join(",")]);

  // ✅ stats
  const totalUsers = users.length;
  const totalRoles = roles.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const totalBranches = branches.length;

  // ✅ RBAC — no read access to any section at all
  if (!canViewUsers && !canViewRoles && !canViewBranches) {
    return (
      <div className="w-full mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Lock className="h-10 w-10 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">
              You don't have access to this page
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              You don't have permission to view users, roles, or branches.
              Contact an administrator if you believe this is a mistake.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCount =
    (canViewUsers ? 2 : 0) + (canViewRoles ? 1 : 0) + (canViewBranches ? 1 : 0);

  // ✅ Tailwind's JIT compiler can't see dynamically-built class names like
  // `md:grid-cols-${statCount}`, so use a static lookup instead.
  const STAT_GRID_COLS = {
    1: "md:grid-cols-1",
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-4",
  };
  const statGridClass = STAT_GRID_COLS[statCount] || "md:grid-cols-4";

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

      {/* Statistics Cards — ✅ RBAC: only show cards for sections the user can read */}
      <div className={`grid grid-cols-1 ${statGridClass} gap-6`}>
        {canViewUsers && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
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
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
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
          </>
        )}

        {canViewRoles && (
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
        )}

        {canViewBranches && (
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
        )}
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
            {/* ✅ RBAC — only render tab triggers the user can read */}
            <TabsList
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${visibleTabs.length}, minmax(0, 1fr))`,
              }}
            >
              {canViewUsers && <TabsTrigger value="users">Users</TabsTrigger>}
              {canViewBranches && (
                <TabsTrigger value="branches">Branches</TabsTrigger>
              )}
              {canViewRoles && <TabsTrigger value="roles">Roles</TabsTrigger>}
            </TabsList>

            {canViewUsers && (
              <TabsContent value="users">
                <UsersTab
                  users={users}
                  setUsers={setUsers}
                  roles={roles}
                  branches={branches}
                />
              </TabsContent>
            )}

            {canViewRoles && (
              <TabsContent value="roles">
                <RolesTab roles={roles} setRoles={setRoles} />
              </TabsContent>
            )}

            {canViewBranches && (
              <TabsContent value="branches">
                <BranchesTab
                  branches={branches}
                  setBranches={setBranches}
                  users={users}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}