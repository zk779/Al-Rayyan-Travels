"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Calendar as CalendarIcon,
  Landmark,
  Banknote,
  User as UserIcon,
  UserCog,
  Building2,
  Wallet,
  FileText,
  CheckCircle2,
  XCircle,
  SaudiRiyal,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../shadcn/components/ui/table";
import { Calendar as CalendarComponent } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

// ── Backend config — adjust these paths if your routes are mounted elsewhere ──
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const EXPENSES_URL = `${API_BASE}/api/expenses`;
const BRANCHES_URL = `${API_BASE}/api/branches`;
const BANKS_URL = `${API_BASE}/api/banks?status=true`;
const USERS_URL = `${API_BASE}/api/users`;

const getToken = () => {
  try {
    return localStorage.getItem("token") || "";
  } catch {
    return "";
  }
};
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// enum value <-> display label
const CATEGORIES = [
  { value: "OFFICE_SUPPLIES", label: "Office Supplies" },
  { value: "SALARY", label: "Salary" },
  { value: "TRAVEL", label: "Travel" },
  { value: "MARKETING", label: "Marketing" },
  { value: "MEALS", label: "Meals" },
  { value: "TRAINING", label: "Training" },
];
const STATUSES = [
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];
const catLabel = (v) => CATEGORIES.find((c) => c.value === v)?.label ?? v;
const statusColor = (s) => (s === "APPROVED" ? "default" : "destructive");

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const DEFAULT_PAGINATION = { page: 1, limit: 20, total: 0, pages: 1 };
const DEFAULT_SUMMARY = { count: 0, totalAmount: 0, byBranch: null };

const emptyForm = {
  expenseDate: new Date(),
  category: "",
  branchId: "",
  amount: "",
  status: "APPROVED",
  paymentMode: "CASH",
  bankId: "",
  userId: "",
  description: "",
};

export default function ExpensePage() {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("EXPENSE_CREATE");
  const canEdit = hasPermission("EXPENSE_EDIT");
  const canDelete = hasPermission("EXPENSE_DELETE");
  const hasAnyRowAction = canEdit || canDelete;

  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [banks, setBanks] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ── Load data ──────────────────────────────────────────────────────────
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (branchFilter !== "all") params.set("branchId", branchFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`${EXPENSES_URL}?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setExpenses(json.data || []);
        setPagination(json.pagination || DEFAULT_PAGINATION);
        setSummary(json.summary || DEFAULT_SUMMARY);
        setError("");
      } else setError(json.error || "Failed to load expenses");
    } catch {
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, branchFilter, categoryFilter, statusFilter]);

  // Users are only ever needed for SALARY expenses — fetch lazily, once.
  // NOTE: assumes each user record includes a `branchId` field so we can
  // filter the list down to the selected branch on the client.
  // If your API instead supports server-side filtering, replace this with:
  //   fetch(`${USERS_URL}?branchId=${branchId}`, ...)
  const ensureUsersLoaded = async () => {
    if (usersLoaded || usersLoading) return;
    try {
      setUsersLoading(true);
      const res = await fetch(USERS_URL, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) setUsers(json.data || []);
    } catch {
      // silent — the select will just show empty if this fails
    } finally {
      setUsersLoading(false);
      setUsersLoaded(true);
    }
  };

  useEffect(() => {
    fetch(BRANCHES_URL, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => j.success && setBranches(j.data || []))
      .catch(() => {});
    fetch(BANKS_URL, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => j.success && setBanks(j.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  // Any filter change (other than the page itself) should snap back to page 1
  useEffect(() => {
    setPage(1);
  }, [branchFilter, categoryFilter, statusFilter, pageSize]);

  // Fetch users the moment the form's category becomes SALARY
  useEffect(() => {
    if (form.category === "SALARY") ensureUsersLoaded();
  }, [form.category]);

  // Users belonging to the currently selected branch only
  const branchUsers = useMemo(() => {
    if (!form.branchId) return [];
    return users.filter((u) => u.branchId === form.branchId);
  }, [users, form.branchId]);

  // ── Derived data ──────────────────────────────────────────────────────
  // Text search only refines what's already on the current page — status,
  // category and branch are all filtered server-side (they affect pagination
  // totals), so a client-side search across pages would show a mismatched count.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return expenses;
    return expenses.filter(
      (e) =>
        e.description?.toLowerCase().includes(q) ||
        catLabel(e.category).toLowerCase().includes(q) ||
        e.branch?.name?.toLowerCase().includes(q) ||
        e.user?.fullName?.toLowerCase().includes(q) ||
        e.createdBy?.fullName?.toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const branchTotalCards = useMemo(() => {
    if (branchFilter !== "all") {
      const branch = branches.find((b) => b.id === branchFilter);
      return [{ id: branchFilter, name: branch?.name ?? "Selected branch", totalAmount: summary.totalAmount }];
    }
    return Array.isArray(summary.byBranch)
      ? [...summary.byBranch]
          .sort((a, b) => b.totalAmount - a.totalAmount)
          .map((g) => ({ id: g.branch.id, name: g.branch.name ?? "Unknown", totalAmount: g.totalAmount }))
      : [];
  }, [summary, branchFilter, branches]);

  // ── Form helpers ──────────────────────────────────────────────────────
  const openAdd = () => {
    if (!canCreate) return; // ✅ RBAC guard
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (expense) => {
    if (!canEdit) return; // ✅ RBAC guard
    setEditingId(expense.id);
    setForm({
      expenseDate: new Date(expense.expenseDate),
      category: expense.category,
      branchId: expense.branchId,
      amount: String(expense.amount),
      status: expense.status,
      paymentMode: expense.paymentMode,
      bankId: expense.bankId ?? "",
      userId: expense.userId ?? "",
      description: expense.description ?? "",
    });
    setFormError("");
    setFormOpen(true);
    if (expense.category === "SALARY") ensureUsersLoaded();
  };

  // Selecting a branch invalidates any previously chosen employee,
  // since that employee may not belong to the new branch.
  const handleBranchChange = (v) => {
    setForm((prev) => ({
      ...prev,
      branchId: v,
      userId: "",
    }));
  };

  const handleCategoryChange = (v) => {
    setForm((prev) => ({
      ...prev,
      category: v,
      // clear the selected employee whenever we move away from SALARY
      userId: v === "SALARY" ? prev.userId : "",
    }));
  };

  const save = async () => {
    // ✅ RBAC guard
    if (editingId && !canEdit) return;
    if (!editingId && !canCreate) return;

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        expenseDate: form.expenseDate.toISOString(),
        category: form.category,
        branchId: form.branchId,
        amount: Number(form.amount),
        status: form.status,
        paymentMode: form.paymentMode,
        bankId: form.paymentMode === "BANK_TRANSFER" ? form.bankId : null,
        userId: form.category === "SALARY" ? form.userId : null,
        description: form.description || null,
      };

      const url = editingId ? `${EXPENSES_URL}/${editingId}` : EXPENSES_URL;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.success) {
        setFormError(json.error || "Save failed");
        return;
      }

      setFormOpen(false);
      loadExpenses();
    } catch {
      setFormError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    try {
      const res = await fetch(`${EXPENSES_URL}/${deleteId}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) loadExpenses();
    } finally {
      setDeleteId(null);
    }
  };

  const canSave =
    form.expenseDate &&
    form.branchId &&
    form.category &&
    form.amount &&
    Number(form.amount) > 0 &&
    (form.paymentMode === "CASH" || form.bankId) &&
    (form.category !== "SALARY" || form.userId);

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Expense Management
          </h1>
          <p className="text-slate-500 mt-1">
            Track and manage company expenses
          </p>
        </div>
        {/* ✅ RBAC — hide "Add Expense" if no create permission */}
        {canCreate && (
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              {branchFilter === "all" ? "Total Expenses" : "Branch Total"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 inline-flex items-center gap-1">
              <SaudiRiyal /> {summary.totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400">
              {summary.count} total record{summary.count === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              Approved (this page)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 inline-flex items-center gap-1">
              <SaudiRiyal />{" "}
              {expenses
                .filter((e) => e.status === "APPROVED")
                .reduce((s, e) => s + e.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-emerald-600/70">
              {expenses.filter((e) => e.status === "APPROVED").length} approved
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Rejected (this page)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 inline-flex items-center gap-1">
              <SaudiRiyal />{" "}
              {expenses
                .filter((e) => e.status === "REJECTED")
                .reduce((s, e) => s + e.amount, 0)
                .toFixed(2)}
            </div>
            <p className="text-xs text-red-600/70">
              {expenses.filter((e) => e.status === "REJECTED").length} rejected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Total expense by branch */}
      {branchTotalCards.length > 0 && (
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-500" />
              Total Expense by Branch
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-3">
              {branchTotalCards.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 min-w-[180px]"
                >
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 leading-tight">{b.name}</p>
                    <p className="text-sm font-semibold text-slate-900 inline-flex items-center gap-1">
                      <SaudiRiyal className="h-3.5 w-3.5" /> {b.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Search (this page)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Branch</Label>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
                setCategoryFilter("all");
                setBranchFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-slate-400"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-8 text-slate-400"
                  >
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((e) => (
                  <TableRow key={e.id} className="hover:bg-slate-50">
                    <TableCell>
                      {format(new Date(e.expenseDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{catLabel(e.category)}</span>
                        {e.category === "SALARY" && e.user?.fullName && (
                          <span className="text-xs text-slate-400">
                            {e.user.fullName}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${e.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        {e.branch?.name ?? "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {e.createdBy?.fullName ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <UserCog className="h-3.5 w-3.5 text-slate-400" />
                          {e.createdBy.fullName}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5 text-sm text-slate-600">
                        {e.paymentMode === "BANK_TRANSFER" ? (
                          <Landmark className="h-3.5 w-3.5" />
                        ) : (
                          <Banknote className="h-3.5 w-3.5" />
                        )}
                        {e.paymentMode === "BANK_TRANSFER"
                          ? (e.bank?.bankName ?? "Bank")
                          : "Cash"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(e.status)}>
                        {e.status === "APPROVED" ? "Approved" : "Rejected"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* ✅ View is always visible — page access already implies EXPENSE_READ */}
                          <DropdownMenuItem onClick={() => setViewing(e)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {/* ✅ RBAC — Edit only if canEdit */}
                          {canEdit && (
                            <DropdownMenuItem onClick={() => openEdit(e)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {/* ✅ RBAC — Delete only if canDelete */}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => setDeleteId(e.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 mt-2">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="w-[80px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-slate-500">
              {pagination.total === 0
                ? "No results"
                : `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )} of ${pagination.total}`}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2 whitespace-nowrap text-slate-600">
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(p + 1, pagination.pages || 1))}
                disabled={page >= (pagination.pages || 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl! max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl">
              {editingId ? "Edit Expense" : "Add New Expense"}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              {editingId
                ? "Update the details for this expense record."
                : "Log a new expense against a branch and payment source."}
            </p>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6">
            {/* ── Section: What & When ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <FileText className="h-3.5 w-3.5" />
                Details
              </div>

              {/* Branch — selected first, drives which employees are available */}
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  Branch
                </Label>
                <Select value={form.branchId} onValueChange={handleBranchChange}>
                  <SelectTrigger  className="w-full">
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={form.category}
                    onValueChange={handleCategoryChange}
                  >
                    <SelectTrigger  className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Expense date */}
                <div className="space-y-1.5">
                  <Label>Expense Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                        {form.expenseDate
                          ? format(form.expenseDate, "MMM dd, yyyy")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={form.expenseDate}
                        onSelect={(d) => setForm({ ...form, expenseDate: d })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Employee — only for SALARY, filtered to the selected branch */}
              {form.category === "SALARY" && (
                <div className="space-y-1.5 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
                  <Label className="flex items-center gap-1.5 text-indigo-900">
                    <UserIcon className="h-3.5 w-3.5" />
                    Employee
                  </Label>
                  {!form.branchId ? (
                    <p className="text-xs text-indigo-700/70">
                      Select a branch first to see its employees.
                    </p>
                  ) : (
                    <>
                      <Select
                        value={form.userId}
                        onValueChange={(v) => setForm({ ...form, userId: v })}
                      >
                        <SelectTrigger className="bg-white w-full">
                          <SelectValue
                            placeholder={
                              usersLoading
                                ? "Loading employees..."
                                : branchUsers.length === 0
                                  ? "No employees in this branch"
                                  : "Select employee"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {branchUsers.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-indigo-700/70">
                        Required for salary expenses.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Section: Payment ── */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Wallet className="h-3.5 w-3.5" />
                Payment
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="pl-6 text-base font-medium"
                  />
                </div>
              </div>

              {/* Payment mode */}
              <div className="space-y-1.5">
                <Label>Payment Mode</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={form.paymentMode === "CASH" ? "default" : "outline"}
                    className={
                      form.paymentMode === "CASH"
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : ""
                    }
                    onClick={() =>
                      setForm({ ...form, paymentMode: "CASH", bankId: "" })
                    }
                  >
                    <Banknote className="h-4 w-4 mr-2" />
                    Cash
                  </Button>
                  <Button
                    type="button"
                    variant={
                      form.paymentMode === "BANK_TRANSFER" ? "default" : "outline"
                    }
                    className={
                      form.paymentMode === "BANK_TRANSFER"
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : ""
                    }
                    onClick={() =>
                      setForm({ ...form, paymentMode: "BANK_TRANSFER" })
                    }
                  >
                    <Landmark className="h-4 w-4 mr-2" />
                    Bank Transfer
                  </Button>
                </div>
              </div>

              {/* Bank selector */}
              {form.paymentMode === "BANK_TRANSFER" && (
                <div className="space-y-1.5">
                  <Label>Bank</Label>
                  <Select
                    value={form.bankId}
                    onValueChange={(v) => setForm({ ...form, bankId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.bankName} — {b.accountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={form.status === "APPROVED" ? "default" : "outline"}
                    className={
                      form.status === "APPROVED"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : ""
                    }
                    onClick={() => setForm({ ...form, status: "APPROVED" })}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Approved
                  </Button>
                  <Button
                    type="button"
                    variant={form.status === "REJECTED" ? "default" : "outline"}
                    className={
                      form.status === "REJECTED"
                        ? "bg-red-600 hover:bg-red-700"
                        : ""
                    }
                    onClick={() => setForm({ ...form, status: "REJECTED" })}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejected
                  </Button>
                </div>
              </div>
            </div>

            {/* ── Section: Notes ── */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                placeholder="Optional notes..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={2}
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter className="px-6 py-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={!canSave || saving}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Expense"
                  : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Expense Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Date</Label>
                  <p>
                    {format(new Date(viewing.expenseDate), "MMMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Category</Label>
                  <p>{catLabel(viewing.category)}</p>
                </div>
              </div>
              {viewing.category === "SALARY" && viewing.user?.fullName && (
                <div>
                  <Label className="text-xs text-slate-400">Employee</Label>
                  <p>{viewing.user.fullName}</p>
                </div>
              )}
              <div>
                <Label className="text-xs text-slate-400">Amount</Label>
                <p className="text-2xl font-bold">
                  ${viewing.amount.toFixed(2)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Description</Label>
                <p>{viewing.description || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Branch</Label>
                  <p>{viewing.branch?.name ?? "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Status</Label>
                  <Badge variant={statusColor(viewing.status)}>
                    {viewing.status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Created By</Label>
                <p>{viewing.createdBy?.fullName ?? "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Payment</Label>
                <p>
                  {viewing.paymentMode === "BANK_TRANSFER"
                    ? `Bank Transfer — ${viewing.bank?.bankName ?? ""}`
                    : "Cash"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {/* ✅ RBAC — Edit from view dialog only if canEdit */}
            {viewing && canEdit && (
              <Button
                onClick={() => {
                  setViewing(null);
                  openEdit(viewing);
                }}
              >
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      {/* ✅ RBAC — only mount delete dialog if user can delete */}
      {canDelete && (
        <AlertDialog
          open={!!deleteId}
          onOpenChange={(o) => !o && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes the expense and reverses its ledger
                entries and account balances.
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