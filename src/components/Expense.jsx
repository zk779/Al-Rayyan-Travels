"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Landmark,
  Banknote,
  UserCog,
  Building2,
  SaudiRiyal,
  ChevronLeft,
  ChevronRight,
  Layers,
  Paperclip,
  Percent,
  Receipt,
  X,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "../../shadcn/components/ui/button";
import { Input } from "../../shadcn/components/ui/input";
import { Label } from "../../shadcn/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shadcn/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shadcn/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../shadcn/components/ui/dropdown-menu";
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
import DateRangeInputs from "./DateRangeInputs";
import { getLocalTimeZone } from "../utils/reportUtils";
import ExpenseFormDialog from "./expense/ExpenseFormDialog";
import ExpenseViewDialog from "./expense/ExpenseViewDialog";
import { CATEGORIES, RETURNABLE_VAT, STATUSES, catLabel, money2, savedVatMode } from "./expense/expenseUtils";

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

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const DEFAULT_PAGINATION = { page: 1, limit: 20, total: 0, pages: 1 };
const DEFAULT_SUMMARY = { count: 0, totalAmount: 0, totalVat: 0, byBranch: null };

const Tile = ({ label, value, sub, tone, icon: Icon, onClick, active, testId }) => {
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      type={onClick ? "button" : undefined}
      onClick={onClick}
      data-testid={testId}
      className={`rounded-xl bg-white p-3.5 text-left shadow-sm ring-1 transition-shadow ${onClick ? "hover:shadow-md" : ""} ${active ? "ring-2 ring-amber-400" : "ring-slate-200/80"}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${tone}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-xl font-bold tabular-nums text-slate-900">
        <SaudiRiyal className="h-4 w-4 opacity-50" />
        {value}
      </p>
      <p className="text-[11px] text-slate-400">{sub}</p>
    </Wrapper>
  );
};

export default function ExpensePage() {
  // ✅ RBAC — permission flags
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("EXPENSE_CREATE");
  const canEdit = hasPermission("EXPENSE_EDIT");
  const canDelete = hasPermission("EXPENSE_DELETE");

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
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [vatFilter, setVatFilter] = useState("all"); // all | yes (carries VAT = returnable) | no
  // Date range is opt-in: empty by default, so no date filter is sent at all.
  const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // ── Load data ──────────────────────────────────────────────────────────
  const loadExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (branchFilter !== "all") params.set("branchId", branchFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (paymentModeFilter !== "all") params.set("paymentMode", paymentModeFilter);
      if (paymentModeFilter === "BANK_TRANSFER" && bankFilter !== "all") params.set("bankId", bankFilter);
      if (createdByFilter !== "all") params.set("createdById", createdByFilter);
      if (vatFilter !== "all") params.set("hasVat", vatFilter === "yes" ? "true" : "false");
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (dateRange.from || dateRange.to) {
        params.set("timeZone", getLocalTimeZone());
        if (dateRange.from) params.set("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
        if (dateRange.to) params.set("dateTo", format(dateRange.to, "yyyy-MM-dd"));
      }

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
  }, [page, pageSize, branchFilter, categoryFilter, statusFilter, paymentModeFilter, bankFilter, createdByFilter, vatFilter, debouncedSearch, dateRange]);

  // Users are only ever needed for SALARY expenses and the "Created by" filter — fetch lazily, once.
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
  }, [branchFilter, categoryFilter, statusFilter, paymentModeFilter, bankFilter, createdByFilter, vatFilter, debouncedSearch, dateRange, pageSize]);

  // Search is applied server-side (so it spans every page and combines with the
  // other filters) — debounce typing so we don't fetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);

  // The "Created By" filter needs the user list up-front.
  useEffect(() => {
    ensureUsersLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasActiveFilters =
    !!search ||
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    branchFilter !== "all" ||
    paymentModeFilter !== "all" ||
    createdByFilter !== "all" ||
    vatFilter !== "all" ||
    !!dateRange.from ||
    !!dateRange.to;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setCategoryFilter("all");
    setBranchFilter("all");
    setPaymentModeFilter("all");
    setBankFilter("all");
    setCreatedByFilter("all");
    setVatFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };

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

  // ── Actions ───────────────────────────────────────────────────────────
  const openAdd = () => {
    if (!canCreate) return; // ✅ RBAC guard
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (expense) => {
    if (!canEdit) return; // ✅ RBAC guard
    setViewing(null);
    setEditing(expense);
    setFormOpen(true);
  };

  const confirmDelete = async () => {
    if (!canDelete) return; // ✅ RBAC guard
    try {
      const res = await fetch(`${EXPENSES_URL}/${deleteId}`, { method: "DELETE", headers: authHeaders() });
      const json = await res.json();
      if (json.success) loadExpenses();
      else setError(json.error || "Failed to delete the expense");
    } catch {
      setError("Failed to delete the expense");
    } finally {
      setDeleteId(null);
    }
  };

  const approved = expenses.filter((e) => e.status === "APPROVED");
  const rejected = expenses.filter((e) => e.status === "REJECTED");
  const sum = (list) => list.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="mx-auto w-full space-y-4 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white shadow-md">
        <div className="pointer-events-none absolute -right-14 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
              <Receipt size={20} />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight md:text-2xl">Expense Management</h1>
              <p className="text-xs text-slate-400">Track and manage company expenses</p>
            </div>
          </div>
          {/* ✅ RBAC — hide "Add Expense" if no create permission */}
          {canCreate && (
            <Button onClick={openAdd} className="h-10 gap-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100">
              <Plus className="h-4 w-4" /> Add Expense
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
          {error}
          <button type="button" onClick={() => setError("")} className="shrink-0 text-rose-400 hover:text-rose-600" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Tile
          label={branchFilter === "all" ? "Total expenses" : "Branch total"}
          value={money2(summary.totalAmount)}
          sub={`${summary.count} record${summary.count === 1 ? "" : "s"}`}
          tone="bg-slate-100 text-slate-600"
          icon={Receipt}
        />
        <Tile label="Approved (this page)" value={money2(sum(approved))} sub={`${approved.length} approved`} tone="bg-emerald-50 text-emerald-600" icon={Receipt} />
        <Tile label="Rejected (this page)" value={money2(sum(rejected))} sub={`${rejected.length} rejected`} tone="bg-rose-50 text-rose-600" icon={Receipt} />
        <Tile
          label="Returnable VAT"
          value={money2(summary.totalVat)}
          sub={vatFilter === "yes" ? "Showing only expenses with VAT · click to show all" : "VAT in these expenses · click to list them"}
          tone="bg-amber-50 text-amber-600"
          icon={Percent}
          onClick={() => setVatFilter((v) => (v === "yes" ? "all" : "yes"))}
          active={vatFilter === "yes"}
          testId="tile-vat"
        />
      </div>

      {/* Total expense by branch */}
      {branchTotalCards.length > 0 && (
        <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/80">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Layers className="h-3.5 w-3.5 text-indigo-500" /> Total expense by branch
          </p>
          <div className="flex flex-wrap gap-2">
            {branchTotalCards.map((b) => (
              <div key={b.id} className="flex min-w-[170px] items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-2 ring-1 ring-slate-200/70">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-indigo-100 text-indigo-600">
                  <Building2 className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-[11px] leading-tight text-slate-500">{b.name}</p>
                  <p className="inline-flex items-center gap-1 text-sm font-semibold tabular-nums text-slate-900">
                    <SaudiRiyal className="h-3 w-3 opacity-50" /> {money2(b.totalAmount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/80">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 pl-9" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Branch</Label>
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="h-9 w-full">
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
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-9 w-full">
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
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-full">
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
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Payment mode</Label>
            <Select
              value={paymentModeFilter}
              onValueChange={(v) => {
                setPaymentModeFilter(v);
                if (v !== "BANK_TRANSFER") setBankFilter("all");
              }}
            >
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paymentModeFilter === "BANK_TRANSFER" && (
            <div className="space-y-1">
              <Label className="text-xs text-slate-500">Bank</Label>
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  {banks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankName} — {b.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">VAT</Label>
            <Select value={vatFilter} onValueChange={setVatFilter}>
              <SelectTrigger className="h-9 w-full" aria-label="VAT filter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any</SelectItem>
                <SelectItem value="yes">With VAT (returnable)</SelectItem>
                <SelectItem value="no">Without VAT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-500">Created by</Label>
            <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <DateRangeInputs from={dateRange.from} to={dateRange.to} onChange={setDateRange} />
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="h-9 w-full" disabled={!hasActiveFilters} onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-10 text-center text-slate-400">
                    <Receipt className="mx-auto mb-2 h-7 w-7 text-slate-200" />
                    No expenses found
                  </TableCell>
                </TableRow>
              ) : (
                expenses.map((e) => {
                  const mode = savedVatMode(e);
                  const firstDetail = (e.details || [])[0];
                  return (
                    <TableRow key={e.id} className="hover:bg-slate-50/70" data-testid="expense-row">
                      <TableCell className="whitespace-nowrap align-top">
                        <p className="text-sm">{format(new Date(e.expenseDate), "dd MMM yyyy")}</p>
                        {e.createdBy?.fullName && (
                          <p className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <UserCog className="h-3 w-3" />
                            {e.createdBy.fullName}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[260px] align-top">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${
                              e.category === RETURNABLE_VAT
                                ? "bg-amber-50 text-amber-700 ring-amber-200"
                                : e.category === "COMPANY_EXPENSE"
                                  ? "bg-indigo-50 text-indigo-700 ring-indigo-200"
                                  : "bg-slate-100 text-slate-700 ring-slate-200"
                            }`}
                          >
                            {catLabel(e.category)}
                          </span>
                          {e.category === "SALARY" && e.user?.fullName && <span className="text-xs text-slate-400">{e.user.fullName}</span>}
                        </div>
                        {firstDetail && (
                          <p className="mt-0.5 truncate text-xs text-slate-600" title={(e.details || []).map((d) => `${d.label}: ${d.value}`).join("\n")}>
                            <span className="font-medium">{firstDetail.label}:</span> {firstDetail.value}
                            {e.details.length > 1 && <span className="text-slate-400"> +{e.details.length - 1}</span>}
                          </p>
                        )}
                        {e.description && <p className="mt-0.5 truncate text-[11px] italic text-slate-400" title={e.description}>{e.description}</p>}
                      </TableCell>
                      <TableCell className="text-right align-top font-medium">
                        <div className="flex flex-col items-end leading-tight">
                          <span className="inline-flex items-center gap-1 tabular-nums">
                            <SaudiRiyal className="h-3.5 w-3.5 opacity-50" />
                            {money2(e.amount)}
                          </span>
                          {mode && e.vatAmount != null && (
                            <>
                              <span className="mt-0.5 text-[11px] font-semibold text-amber-600">
                                {mode === "INCLUSIVE" ? "incl." : "+"} VAT 15% · {money2(e.vatAmount)}
                              </span>
                              <span className="text-[10px] font-normal text-slate-400">Net {money2(Number(e.amount) - Number(e.vatAmount))}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-slate-400" />
                          {e.branch?.name ?? "-"}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className="flex items-center gap-1.5 text-sm text-slate-600">
                          {e.paymentMode === "BANK_TRANSFER" ? <Landmark className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
                          {e.paymentMode === "BANK_TRANSFER" ? (e.bank?.bankName ?? "Bank") : "Cash"}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${e.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                          {e.status === "APPROVED" ? "Approved" : "Rejected"}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        {e.attachmentUrl && (
                          <a href={e.attachmentUrl} target="_blank" rel="noreferrer" title="Open the attachment" aria-label="Open the attachment" className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-indigo-600">
                            <Paperclip className="h-4 w-4" />
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="align-top">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* ✅ View is always visible — page access already implies EXPENSE_READ */}
                            <DropdownMenuItem onClick={() => setViewing(e)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {/* ✅ RBAC — Edit only if canEdit */}
                            {canEdit && (
                              <DropdownMenuItem onClick={() => openEdit(e)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {/* ✅ RBAC — Delete only if canDelete */}
                            {canDelete && (
                              <DropdownMenuItem onClick={() => setDeleteId(e.id)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Rows per page</span>
            <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
              <SelectTrigger className="h-8 w-[80px]">
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
              : `Showing ${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}`}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="whitespace-nowrap px-2 text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages || 1}
            </span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(p + 1, pagination.pages || 1))} disabled={page >= (pagination.pages || 1)} aria-label="Next page">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Add / edit */}
      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={editing}
        branches={branches}
        banks={banks}
        users={users}
        usersLoading={usersLoading}
        ensureUsers={ensureUsersLoaded}
        onSaved={loadExpenses}
      />

      {/* View */}
      <ExpenseViewDialog expense={viewing} onOpenChange={(o) => !o && setViewing(null)} canEdit={canEdit} onEdit={openEdit} />

      {/* Delete confirm */}
      {/* ✅ RBAC — only mount delete dialog if user can delete */}
      {canDelete && (
        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>This permanently deletes the expense and reverses its ledger entries and account balances.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
