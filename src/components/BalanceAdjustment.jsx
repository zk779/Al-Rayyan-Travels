"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Minus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Eye,
  Calendar as CalendarIcon,
  Landmark,
  Banknote,
  Wallet,
  SaudiRiyal,
  ChevronLeft,
  ChevronRight,
  UserCog,
  FileText,
  TrendingUp,
  TrendingDown,
  Scale,
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
import { useAuth } from "../context/AuthContext";
import DateRangeInputs from "./DateRangeInputs";
import { getLocalTimeZone } from "../utils/reportUtils";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const ADJUSTMENTS_URL = `${API_BASE}/api/balance-adjustments`;
const USERS_URL = `${API_BASE}/api/users`;

const authHeaders = () => {
  let token = "";
  try {
    token = localStorage.getItem("token") || "";
  } catch {
    // storage unavailable — request will simply be unauthorised
  }
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
};

const REASONS = [
  "Opening balance correction",
  "Cash count difference",
  "Bank reconciliation",
  "Bank charges",
  "Bank interest / profit",
  "Owner deposit",
  "Owner withdrawal",
  "Data entry correction",
  "Other",
];

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50, 100];
const DEFAULT_PAGINATION = { page: 1, limit: 20, total: 0, pages: 1 };
const DEFAULT_SUMMARY = { count: 0, totalAdded: 0, totalSubtracted: 0, net: 0, addedCount: 0, subtractedCount: 0 };
const NO_DATES = { from: undefined, to: undefined };

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const signed = (type, amount) => (type === "ADD" ? Number(amount) : -Number(amount));

const emptyForm = () => ({
  adjustmentDate: new Date(),
  method: "CASH",
  bankId: "",
  type: "ADD",
  amount: "",
  reason: "",
  referenceNo: "",
  remarks: "",
});

const Money = ({ value, className = "" }) => (
  <span className={`inline-flex items-center gap-1 tabular-nums ${className}`}>
    <SaudiRiyal className="h-3.5 w-3.5" /> {fmt(value)}
  </span>
);

const TypeBadge = ({ type }) =>
  type === "ADD" ? (
    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 gap-1">
      <Plus className="h-3 w-3" /> Add
    </Badge>
  ) : (
    <Badge className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-50 gap-1">
      <Minus className="h-3 w-3" /> Subtract
    </Badge>
  );

const MethodCell = ({ row }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
    {row.method === "BANK_TRANSFER" ? (
      <Landmark className="h-3.5 w-3.5 text-slate-400" />
    ) : (
      <Banknote className="h-3.5 w-3.5 text-slate-400" />
    )}
    {row.method === "BANK_TRANSFER" ? (row.bank?.bankName ?? "Bank") : "Cash"}
  </span>
);

export default function BalanceAdjustmentPage() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("BALANCE_ADJUSTMENT_CREATE");
  const canEdit = hasPermission("BALANCE_ADJUSTMENT_EDIT");
  const canDelete = hasPermission("BALANCE_ADJUSTMENT_DELETE");

  const [rows, setRows] = useState([]);
  const [balances, setBalances] = useState({ cash: { balance: 0 }, banks: [] });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Filters (date range is opt-in: empty = no date filter sent) ──
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [bankFilter, setBankFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [createdByFilter, setCreatedByFilter] = useState("all");
  const [dateRange, setDateRange] = useState(NO_DATES);
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [debouncedAmounts, setDebouncedAmounts] = useState({ min: "", max: "" });

  const [pagination, setPagination] = useState(DEFAULT_PAGINATION);
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteError, setDeleteError] = useState("");

  // ── Load data ──────────────────────────────────────────────────────────
  const loadBalances = useCallback(() => {
    fetch(`${ADJUSTMENTS_URL}/balances`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => j.success && setBalances(j.data))
      .catch(() => {});
  }, []);

  const loadAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
      if (methodFilter !== "all") params.set("method", methodFilter);
      if (methodFilter === "BANK_TRANSFER" && bankFilter !== "all") params.set("bankId", bankFilter);
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (reasonFilter !== "all") params.set("reason", reasonFilter);
      if (createdByFilter !== "all") params.set("createdById", createdByFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (debouncedAmounts.min !== "") params.set("minAmount", debouncedAmounts.min);
      if (debouncedAmounts.max !== "") params.set("maxAmount", debouncedAmounts.max);
      if (dateRange.from || dateRange.to) {
        params.set("timeZone", getLocalTimeZone());
        if (dateRange.from) params.set("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
        if (dateRange.to) params.set("dateTo", format(dateRange.to, "yyyy-MM-dd"));
      }

      const res = await fetch(`${ADJUSTMENTS_URL}?${params}`, { headers: authHeaders() });
      const json = await res.json();
      if (json.success) {
        setRows(json.data || []);
        setPagination(json.pagination || DEFAULT_PAGINATION);
        setSummary(json.summary || DEFAULT_SUMMARY);
        setError("");
      } else setError(json.error || "Failed to load balance adjustments");
    } catch {
      setError("Failed to load balance adjustments");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    pageSize,
    methodFilter,
    bankFilter,
    typeFilter,
    reasonFilter,
    createdByFilter,
    debouncedSearch,
    debouncedAmounts,
    dateRange,
  ]);

  useEffect(() => {
    loadBalances();
    fetch(USERS_URL, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => j.success && setUsers(j.data || []))
      .catch(() => {});
  }, [loadBalances]);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  // Any filter change snaps back to page 1
  useEffect(() => {
    setPage(1);
  }, [
    methodFilter,
    bankFilter,
    typeFilter,
    reasonFilter,
    createdByFilter,
    debouncedSearch,
    debouncedAmounts,
    dateRange,
    pageSize,
  ]);

  // Text + amount inputs are debounced so we don't fetch on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(t);
  }, [search]);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedAmounts({ min: minAmount, max: maxAmount }), 400);
    return () => clearTimeout(t);
  }, [minAmount, maxAmount]);

  const hasActiveFilters =
    !!search ||
    methodFilter !== "all" ||
    typeFilter !== "all" ||
    reasonFilter !== "all" ||
    createdByFilter !== "all" ||
    minAmount !== "" ||
    maxAmount !== "" ||
    !!dateRange.from ||
    !!dateRange.to;

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setMethodFilter("all");
    setBankFilter("all");
    setTypeFilter("all");
    setReasonFilter("all");
    setCreatedByFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setDebouncedAmounts({ min: "", max: "" });
    setDateRange(NO_DATES);
  };

  // ── Form helpers ──────────────────────────────────────────────────────
  const openAdd = () => {
    if (!canCreate) return;
    setEditing(null);
    setForm(emptyForm());
    setFormError("");
    loadBalances();
    setFormOpen(true);
  };

  const openEdit = (row) => {
    if (!canEdit) return;
    setEditing(row);
    setForm({
      adjustmentDate: new Date(row.adjustmentDate),
      method: row.method,
      bankId: row.bankId ?? "",
      type: row.type,
      amount: String(row.amount),
      reason: row.reason,
      referenceNo: row.referenceNo ?? "",
      remarks: row.remarks ?? "",
    });
    setFormError("");
    loadBalances();
    setFormOpen(true);
  };

  // Banks offered in the form: every active bank, plus the adjustment's own
  // bank when editing (it may have been deactivated since).
  const bankOptions = useMemo(() => {
    const list = [...balances.banks];
    if (editing?.bank && !list.some((b) => b.id === editing.bank.id)) {
      list.push({ ...editing.bank, balance: editing.account?.balance ?? 0 });
    }
    return list;
  }, [balances.banks, editing]);

  // Live "current -> new balance" preview for the account being adjusted.
  const preview = useMemo(() => {
    const amount = Number(form.amount);
    const target =
      form.method === "CASH"
        ? { id: "cash", balance: balances.cash.balance }
        : bankOptions.find((b) => b.id === form.bankId);
    if (!target) return null;

    // When editing, the old effect is undone first if it hit the same account
    let base = target.balance;
    if (editing) {
      const sameAccount =
        editing.method === form.method &&
        (form.method === "CASH" || editing.bankId === form.bankId);
      if (sameAccount) base -= signed(editing.type, editing.amount);
    }
    const next = base + (amount > 0 ? signed(form.type, amount) : 0);
    return {
      current: target.balance,
      base,
      next,
      overdraw: form.type === "SUBTRACT" && amount > 0 && next < 0,
    };
  }, [form, balances, bankOptions, editing]);

  const canSave =
    form.adjustmentDate &&
    Number(form.amount) > 0 &&
    form.reason.trim() &&
    (form.method === "CASH" || form.bankId) &&
    !preview?.overdraw;

  const save = async () => {
    if (editing && !canEdit) return;
    if (!editing && !canCreate) return;

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        adjustmentDate: form.adjustmentDate.toISOString(),
        method: form.method,
        type: form.type,
        amount: Number(form.amount),
        reason: form.reason.trim(),
        referenceNo: form.referenceNo.trim() || null,
        remarks: form.remarks.trim() || null,
        ...(form.method === "BANK_TRANSFER" ? { bankId: form.bankId } : {}),
      };

      const res = await fetch(editing ? `${ADJUSTMENTS_URL}/${editing.id}` : ADJUSTMENTS_URL, {
        method: editing ? "PUT" : "POST",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) {
        setFormError(json.error || "Save failed");
        return;
      }

      setFormOpen(false);
      loadAdjustments();
      loadBalances();
    } catch {
      setFormError("Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!canDelete || !deleteTarget) return;
    try {
      const res = await fetch(`${ADJUSTMENTS_URL}/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (json.success) {
        setDeleteTarget(null);
        setDeleteError("");
        loadAdjustments();
        loadBalances();
      } else setDeleteError(json.error || "Delete failed");
    } catch {
      setDeleteError("Delete failed");
    }
  };

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Balance Adjustments</h1>
          <p className="text-slate-500 mt-1">
            Manually add to or subtract from the Cash or a Bank balance — every change is recorded in the ledger
          </p>
        </div>
        {canCreate && (
          <Button onClick={openAdd} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            New Adjustment
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Current balances */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Scale className="h-4 w-4 text-indigo-500" />
            Current Balances
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-2.5 min-w-[180px]">
              <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Banknote className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-tight">Cash</p>
                <p className={`text-sm font-semibold ${balances.cash.balance < 0 ? "text-red-600" : "text-slate-900"}`}>
                  <Money value={balances.cash.balance} />
                </p>
              </div>
            </div>
            {balances.banks.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 min-w-[180px]"
              >
                <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 leading-tight">{b.bankName}</p>
                  <p className={`text-sm font-semibold ${b.balance < 0 ? "text-red-600" : "text-slate-900"}`}>
                    <Money value={b.balance} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary cards — follow the active filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Adjustments</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{summary.count}</div>
            <p className="text-xs text-slate-400">
              {summary.addedCount} added · {summary.subtractedCount} subtracted
            </p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-emerald-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">Total Added</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              <Money value={summary.totalAdded} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-100 bg-red-50/40">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Total Subtracted</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              <Money value={summary.totalSubtracted} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Net Effect</CardTitle>
            <Wallet className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.net < 0 ? "text-red-700" : "text-slate-900"}`}>
              {summary.net > 0 ? "+" : summary.net < 0 ? "−" : ""}
              <Money value={Math.abs(summary.net)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-slate-200">
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search adjustments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Account</Label>
            <Select
              value={methodFilter}
              onValueChange={(v) => {
                setMethodFilter(v);
                if (v !== "BANK_TRANSFER") setBankFilter("all");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (Cash &amp; Bank)</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {methodFilter === "BANK_TRANSFER" && (
            <div className="space-y-2">
              <Label>Bank</Label>
              <Select value={bankFilter} onValueChange={setBankFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  {balances.banks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.bankName} — {b.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Add &amp; Subtract</SelectItem>
                <SelectItem value="ADD">Add</SelectItem>
                <SelectItem value="SUBTRACT">Subtract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Created By</Label>
            <Select value={createdByFilter} onValueChange={setCreatedByFilter}>
              <SelectTrigger className="w-full">
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
          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center justify-between">
              <span>Date Range</span>
              {(dateRange.from || dateRange.to) && (
                <button
                  type="button"
                  onClick={() => setDateRange(NO_DATES)}
                  className="text-xs font-normal text-indigo-600 hover:underline"
                >
                  Clear dates
                </button>
              )}
            </Label>
            <DateRangeInputs from={dateRange.from} to={dateRange.to} onChange={setDateRange} />
          </div>
          <div className="space-y-2">
            <Label>Amount Range</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
              <span className="text-slate-300">–</span>
              <Input
                type="number"
                min="0"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button variant="outline" className="w-full" disabled={!hasActiveFilters} onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Adjustment History</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-400">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-400">
                    No balance adjustments found
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-slate-50">
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(r.adjustmentDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <MethodCell row={r} />
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={r.type} />
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${r.type === "ADD" ? "text-emerald-700" : "text-red-700"}`}
                    >
                      {r.type === "ADD" ? "+" : "−"}
                      {fmt(r.amount)}
                    </TableCell>
                    <TableCell className="text-sm">{r.reason}</TableCell>
                    <TableCell className="text-sm text-slate-500">{r.referenceNo || "-"}</TableCell>
                    <TableCell className="italic text-slate-600 text-sm max-w-[220px] truncate">
                      {r.remarks}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-slate-600">{fmt(r.balanceAfter)}</TableCell>
                    <TableCell>
                      {r.createdBy?.fullName ? (
                        <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                          <UserCog className="h-3.5 w-3.5 text-slate-400" />
                          {r.createdBy.fullName}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewing(r)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          {canEdit && (
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem
                              onClick={() => {
                                setDeleteError("");
                                setDeleteTarget(r);
                              }}
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
                    pagination.total,
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

      {/* Add / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl! max-h-[90vh] overflow-y-auto p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl">
              {editing ? "Edit Balance Adjustment" : "New Balance Adjustment"}
            </DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              {editing
                ? "Saving reverses the original adjustment and applies the updated one."
                : "Add to or subtract from the Cash or a Bank balance. A ledger entry is posted automatically."}
            </p>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5">
            {/* Account */}
            <div className="space-y-1.5">
              <Label>Adjust</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={form.method === "CASH" ? "default" : "outline"}
                  className={form.method === "CASH" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                  onClick={() => setForm({ ...form, method: "CASH", bankId: "" })}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Cash
                </Button>
                <Button
                  type="button"
                  variant={form.method === "BANK_TRANSFER" ? "default" : "outline"}
                  className={form.method === "BANK_TRANSFER" ? "bg-indigo-600 hover:bg-indigo-700" : ""}
                  onClick={() => setForm({ ...form, method: "BANK_TRANSFER" })}
                >
                  <Landmark className="h-4 w-4 mr-2" />
                  Bank Transfer
                </Button>
              </div>
            </div>

            {form.method === "BANK_TRANSFER" && (
              <div className="space-y-1.5">
                <Label>Bank</Label>
                <Select value={form.bankId} onValueChange={(v) => setForm({ ...form, bankId: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select bank" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankOptions.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.bankName} — {b.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Add / Subtract */}
            <div className="space-y-1.5">
              <Label>Adjustment Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={form.type === "ADD" ? "default" : "outline"}
                  className={form.type === "ADD" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                  onClick={() => setForm({ ...form, type: "ADD" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add (credit)
                </Button>
                <Button
                  type="button"
                  variant={form.type === "SUBTRACT" ? "default" : "outline"}
                  className={form.type === "SUBTRACT" ? "bg-red-600 hover:bg-red-700" : ""}
                  onClick={() => setForm({ ...form, type: "SUBTRACT" })}
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Subtract (debit)
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <div className="relative">
                  <SaudiRiyal className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="pl-9 text-base font-medium"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Adjustment Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
                      {form.adjustmentDate ? format(form.adjustmentDate, "MMM dd, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={form.adjustmentDate}
                      onSelect={(d) => d && setForm({ ...form, adjustmentDate: d })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Balance preview */}
            {preview && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${
                  preview.overdraw ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-slate-500">
                    {form.method === "CASH" ? "Cash" : "Bank"} balance
                  </span>
                  <span className="font-medium tabular-nums text-slate-700">
                    {fmt(preview.current)}
                    <span className="mx-2 text-slate-400">→</span>
                    <span className={preview.next < 0 ? "text-red-600" : "text-slate-900"}>{fmt(preview.next)}</span>
                  </span>
                </div>
                {preview.overdraw && (
                  <p className="text-xs text-red-600 mt-1.5">
                    Insufficient balance — you can't subtract more than is available.
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm({ ...form, reason: v })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                  {/* keep a custom reason (e.g. created via API) selectable when editing */}
                  {form.reason && !REASONS.includes(form.reason) && (
                    <SelectItem value={form.reason}>{form.reason}</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>
                Reference No. <span className="text-slate-400 font-normal">(optional — bank slip, cheque no., etc.)</span>
              </Label>
              <Input
                placeholder="e.g. TRX-20931"
                value={form.referenceNo}
                onChange={(e) => setForm({ ...form, referenceNo: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Remarks <span className="text-slate-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                placeholder="Add any details about this adjustment..."
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                rows={3}
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
              {saving ? "Saving..." : editing ? "Update Adjustment" : "Save Adjustment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjustment Details</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Date</Label>
                  <p>{format(new Date(viewing.adjustmentDate), "MMMM dd, yyyy")}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Type</Label>
                  <div className="mt-0.5">
                    <TypeBadge type={viewing.type} />
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Amount</Label>
                <p className={`text-2xl font-bold ${viewing.type === "ADD" ? "text-emerald-700" : "text-red-700"}`}>
                  {viewing.type === "ADD" ? "+" : "−"}
                  {fmt(viewing.amount)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Account</Label>
                  <div className="mt-0.5">
                    <MethodCell row={viewing} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Reference No.</Label>
                  <p>{viewing.referenceNo || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Balance Before</Label>
                  <p className="tabular-nums">{fmt(viewing.balanceBefore)}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Balance After</Label>
                  <p className="tabular-nums">{fmt(viewing.balanceAfter)}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Reason</Label>
                <p>{viewing.reason}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-400">Remarks</Label>
                <p>{viewing.remarks || "-"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-slate-400">Created By</Label>
                  <p>{viewing.createdBy?.fullName ?? "-"}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Created</Label>
                  <p>{format(new Date(viewing.createdAt), "MMM dd, yyyy HH:mm")}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewing(null)}>
              Close
            </Button>
            {viewing && canEdit && (
              <Button
                onClick={() => {
                  const target = viewing;
                  setViewing(null);
                  openEdit(target);
                }}
              >
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      {canDelete && (
        <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this adjustment?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget
                  ? `This reverses the ${deleteTarget.type === "ADD" ? "addition of" : "subtraction of"} ${fmt(deleteTarget.amount)} on ${
                      deleteTarget.method === "CASH" ? "Cash" : (deleteTarget.bank?.bankName ?? "the bank")
                    } and removes its ledger entry. The balance goes back to what it would have been without it.`
                  : ""}
              </AlertDialogDescription>
              {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  // keep the dialog open so an error can be shown
                  e.preventDefault();
                  confirmDelete();
                }}
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
