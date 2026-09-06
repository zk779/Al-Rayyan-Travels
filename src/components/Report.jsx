"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { format, subDays, differenceInCalendarDays } from "date-fns";
import {
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  Undo2,
  Landmark,
  Users2,
  Store,
  X,
  Percent,
  Globe2,
  ChevronUp,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import { Button } from "../../shadcn/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shadcn/components/ui/card";
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
import DateRangeInputs from "./DateRangeInputs";
import ReportDetailTables from "../components/Reportdetailtables";
import { money, compact, getLocalTimeZone } from "../utils/reportUtils";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const CHART_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];
const PAYMENT_STATUSES = ["DUE", "PARTIAL", "PAID"];
const SALE_STATUSES = ["PENDING", "COMPLETED", "CANCELLED", "REFUNDED"];
const PAYMENT_METHODS = ["CASH", "CREDIT", "BANK_TRANSFER", "PARTIAL"];
const ALL = "__all__";

// Length-based fallback so a big number never gets clipped/truncated —
// long values shrink a step instead, short ones stay nice and bold.
const fitValueClass = (value) => {
  const len = String(value ?? "").length;
  if (len > 17) return "text-sm";
  if (len > 13) return "text-base";
  if (len > 10) return "text-lg";
  return "text-xl";
};

function KpiCard({ label, value, sub, icon: Icon, trend, tone = "slate" }) {
  const toneMap = {
    slate: "from-slate-600 to-slate-800",
    emerald: "from-emerald-500 to-emerald-700",
    rose: "from-rose-500 to-rose-700",
    indigo: "from-indigo-500 to-indigo-700",
    amber: "from-amber-500 to-amber-700",
    sky: "from-sky-500 to-sky-700",
  };
  return (
    <Card className="relative overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-shadow py-0 gap-0">
      <div className={`h-1 bg-gradient-to-r ${toneMap[tone]}`} />
      <CardContent className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1 min-w-0">
          <div
            className={`p-1 rounded-md bg-gradient-to-br ${toneMap[tone]} shrink-0`}
          >
            <Icon className="h-3 w-3 text-white" />
          </div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide leading-tight break-words">
            {label}
          </p>
        </div>
        <p
          className={`${fitValueClass(value)} font-bold text-slate-900 tabular-nums leading-tight break-words`}
        >
          {value}
        </p>
        {sub && (
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 leading-snug break-words">
            {trend === "up" && (
              <TrendingUp className="h-3 w-3 text-emerald-500 shrink-0" />
            )}
            {trend === "down" && (
              <TrendingDown className="h-3 w-3 text-rose-500 shrink-0" />
            )}
            {sub}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const KpiSkeleton = () => (
  <Card className="relative overflow-hidden border-slate-100 shadow-sm py-0 gap-0">
    <div className="h-1 bg-slate-100" />
    <CardContent className="px-3 py-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <div className="h-4 w-4 rounded-md bg-slate-100 animate-pulse shrink-0" />
        <div className="h-2.5 w-16 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="h-5 w-24 rounded bg-slate-100 animate-pulse" />
      <div className="h-2.5 w-20 rounded bg-slate-100 animate-pulse" />
    </CardContent>
  </Card>
);

const EmptyChart = ({ label = "No data for the selected filters" }) => (
  <div className="h-[260px] flex items-center justify-center text-sm text-slate-400">
    {label}
  </div>
);

const ChipFilter = ({ label, active, onClear }) =>
  !active ? null : (
    <Badge
      variant="secondary"
      className="gap-1 pl-2.5 pr-1 py-1 bg-slate-100 text-slate-600 hover:bg-slate-100"
    >
      {label}
      <button
        onClick={onClear}
        className="ml-1 rounded-full hover:bg-slate-300/60 p-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </Badge>
  );

export default function ReportPage() {
  const timeZone = useMemo(getLocalTimeZone, []);

  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [users, setUsers] = useState([]);

  const [sales, setSales] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totals, setTotals] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const defaultFilters = () => ({
    branchId: ALL,
    vendorId: ALL,
    customerId: ALL,
    airlineCode: ALL,
    agentId: ALL,
    paymentStatus: ALL,
    saleStatus: ALL,
    paymentMethod: ALL,
  });
  const defaultDateRange = () => ({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // `draft*` is what the filter panel is bound to (edited freely). Nothing
  // is fetched until "Apply Filters" copies it into `applied`, which is the
  // only thing fetchData/trendData/exportCsv ever read from.
  // allTime=true means "no date filter" — the API is asked for the
  // complete, all-time report. dateRange is still kept around so the
  // date fields have something sane to show if the user switches back.
  const [draftAllTime, setDraftAllTime] = useState(false);
  const [draftDateRange, setDraftDateRange] = useState(defaultDateRange);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const setDraftFilter = (key) => (val) =>
    setDraftFilters((f) => ({ ...f, [key]: val }));

  const [applied, setApplied] = useState(() => ({
    allTime: draftAllTime,
    dateRange: draftDateRange,
    filters: draftFilters,
  }));

  const [filtersOpen, setFiltersOpen] = useState(true);

  // ── Reference lists, once ──
  useEffect(() => {
    const opts = { headers: authHeaders() };
    const load = (path, setter) =>
      fetch(`${API_BASE}${path}`, opts)
        .then((r) => r.json())
        .then((j) => j.success && setter(j.data || []))
        .catch(() => {});
    load("/api/vendors", setVendors);
    load("/api/customers", setCustomers);
    load("/api/branches", setBranches);
    load("/api/airlines", setAirlines);
    load("/api/users", setUsers);
  }, []);

  const handleRangeSelect = (range) => {
    setDraftAllTime(false);
    setDraftDateRange(range);
  };

  // ── Single server-side fetch — filtering & profit math both happen in the
  // API, driven entirely by `applied` (never the in-progress draft) ──
  const fetchData = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ timeZone });
        if (!applied.allTime) {
          params.set("dateFrom", format(applied.dateRange.from, "yyyy-MM-dd"));
          params.set("dateTo", format(applied.dateRange.to, "yyyy-MM-dd"));
        }
        Object.entries(applied.filters).forEach(
          ([k, v]) => v !== ALL && params.set(k, v),
        );

        const res = await fetch(`${API_BASE}/api/reports?${params}`, {
          headers: authHeaders(),
        });
        const json = await res.json();
        if (!res.ok || !json.success)
          throw new Error(json.error || "Failed to load report");

        setSales(json.data.sales || []);
        setRefunds(json.data.refunds || []);
        setExpenses(json.data.expenses || []);
        setTotals(json.totals);
        setMeta(json.meta || null);
      } catch (err) {
        setError(err.message || "Failed to load report data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [applied, timeZone],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Trend chart (day or month buckets depending on range length) ──
  const trendData = useMemo(() => {
    const byMonth =
      applied.allTime ||
      differenceInCalendarDays(applied.dateRange.to, applied.dateRange.from) >
        62;
    const keyOf = (d) => format(new Date(d), byMonth ? "MMM yyyy" : "MMM dd");
    const map = new Map();
    const bump = (date, field, amount) => {
      if (!date) return;
      const key = keyOf(date);
      const row = map.get(key) || {
        key,
        sales: 0,
        profit: 0,
        refunds: 0,
        expenses: 0,
      };
      row[field] += amount;
      map.set(key, row);
    };
    sales.forEach((s) => {
      bump(s.date, "sales", s.sellPrice);
      bump(s.date, "profit", s.profit);
    });
    refunds.forEach((r) => bump(r.date, "refunds", r.netRefundToCustomer || 0));
    expenses.forEach((e) => bump(e.expenseDate, "expenses", e.amount || 0));
    return [...map.values()].sort(
      (a, b) => new Date(a.key) - new Date(b.key) || a.key.localeCompare(b.key),
    );
  }, [sales, refunds, expenses, applied]);

  // ── Simple group-and-sum helper, reused for all breakdown tables/charts ──
  const groupBy = (list, keyFn, valFn) => {
    const map = new Map();
    list.forEach((item) => {
      const key = keyFn(item);
      const row = map.get(key) || { name: key, value: 0, count: 0 };
      row.value += valFn(item);
      row.count += 1;
      map.set(key, row);
    });
    return [...map.values()];
  };

  const paymentMethodData = useMemo(
    () =>
      groupBy(
        sales,
        (s) => s.paymentMethod || "UNKNOWN",
        (s) => s.sellPrice,
      ).filter((d) => d.value > 0),
    [sales],
  );
  const expenseCategoryData = useMemo(
    () =>
      groupBy(
        expenses,
        (e) => (e.category || "OTHER").replace(/_/g, " "),
        (e) => e.amount || 0,
      ).sort((a, b) => b.value - a.value),
    [expenses],
  );
  const saleStatusData = useMemo(
    () =>
      groupBy(
        sales,
        (s) => s.status,
        () => 1,
      ),
    [sales],
  );
  const topVendors = useMemo(
    () =>
      groupBy(
        sales,
        (s) => s.vendor || "Unknown",
        (s) => s.sellPrice,
      )
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [sales],
  );
  const topCustomers = useMemo(
    () =>
      groupBy(
        sales,
        (s) => s.customer || "Walk-in Customer",
        (s) => s.sellPrice,
      )
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [sales],
  );
  const agentPerformance = useMemo(
    () =>
      groupBy(
        sales,
        (s) => s.agent || "Unknown",
        (s) => s.sellPrice,
      ).sort((a, b) => b.value - a.value),
    [sales],
  );

  // Draft differs from what's actually been fetched — the Apply button
  // highlights this so it's obvious there are unapplied changes.
  const isDirty =
    draftAllTime !== applied.allTime ||
    draftDateRange.from?.getTime() !== applied.dateRange.from?.getTime() ||
    draftDateRange.to?.getTime() !== applied.dateRange.to?.getTime() ||
    Object.entries(draftFilters).some(([k, v]) => applied.filters[k] !== v);

  const applyFilters = () =>
    setApplied({
      allTime: draftAllTime,
      dateRange: draftDateRange,
      filters: draftFilters,
    });

  // Scoped to just the Advanced Filters panel — Branch/Agent/Date Range now
  // live in the header and aren't touched by this "Clear all".
  const ADVANCED_KEYS = ["vendorId", "customerId", "airlineCode", "paymentStatus", "saleStatus", "paymentMethod"];
  const hasActiveAdvancedFilters = ADVANCED_KEYS.some((k) => draftFilters[k] !== ALL);
  const clearAdvancedFilters = () => {
    const next = { ...draftFilters };
    ADVANCED_KEYS.forEach((k) => (next[k] = ALL));
    setDraftFilters(next);
    setApplied((a) => ({ ...a, filters: next }));
  };

  const t = totals || {};

  // Promoted to the page header as always-visible "main" filters.
  const mainFilterFields = [
    { key: "branchId", label: "Branch", list: branches, nameKey: "name" },
    { key: "agentId", label: "Agent", list: users, nameKey: "fullName" },
  ];
  // Everything else stays tucked away in the Advanced Filters panel.
  const advancedFilterFields = [
    { key: "vendorId", label: "Vendor", list: vendors, nameKey: "vendorName" },
    {
      key: "customerId",
      label: "Customer",
      list: customers,
      nameKey: "customerName",
    },
  ];

  // Badge count on the Advanced Filters trigger — only counts filters that
  // actually live in that panel (main ones are already visible in the header).
  const advancedActiveCount =
    advancedFilterFields.filter(({ key }) => applied.filters[key] !== ALL).length +
    ["airlineCode", "paymentStatus", "saleStatus", "paymentMethod"].filter(
      (key) => applied.filters[key] !== ALL,
    ).length;

  return (
    <div className="w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Business Reports
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <p className="text-slate-500">
              Sales, profit, VAT, expenses & refund analytics
            </p>
            {meta && (
              <Badge
                variant="outline"
                className="gap-1 text-slate-500 border-slate-200 font-normal"
              >
                <Globe2 className="h-3 w-3" />
                {timeZone}
              </Badge>
            )}
            {meta?.isCompleteRange && (
              <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 border font-normal">
                All-time report
              </Badge>
            )}
          </div>
        </div>
        {/* Main filters — the ones adjusted most often live right in the
            header. Everything else is one hover away in Advanced Filters. */}
        <div className="flex flex-wrap items-end gap-2">
          <DateRangeInputs
            from={draftDateRange.from}
            to={draftDateRange.to}
            onChange={handleRangeSelect}
            disabled={draftAllTime}
            compact
          />
          <button
            type="button"
            onClick={() => setDraftAllTime((v) => !v)}
            title="Show every record, ignoring the date range"
            className={`h-8 px-2 rounded-md text-xs font-medium border transition-colors ${
              draftAllTime
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            All time
          </button>

          {mainFilterFields.map(({ key, label, list, nameKey }) => (
            <Select key={key} value={draftFilters[key]} onValueChange={setDraftFilter(key)}>
              <SelectTrigger size="sm" className="w-[130px]">
                <SelectValue placeholder={`All ${label}s`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All {label}s</SelectItem>
                {list.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item[nameKey]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}

          <Button
            size="sm"
            onClick={applyFilters}
            className="relative gap-1.5 bg-indigo-600 hover:bg-indigo-700"
          >
            <Check className="h-3.5 w-3.5" /> Apply
            {isDirty && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
            )}
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh"
            className="h-8 w-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* Advanced Filters — icon-only, expands to show its label on
              hover; click toggles the panel below. */}
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            title="Advance Filters"
            className={`group flex items-center h-8 gap-1.5 px-2 rounded-md border text-sm transition-colors ${
              filtersOpen
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Filter className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-0 group-hover:max-w-[110px] opacity-0 group-hover:opacity-100 overflow-hidden whitespace-nowrap transition-all duration-200 font-medium">
              Advance Filters
            </span>
            {advancedActiveCount > 0 && (
              <Badge variant="secondary" className="h-4 px-1 text-[10px] font-semibold">
                {advancedActiveCount}
              </Badge>
            )}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Advanced Filters — opened via the header's hover icon, not a modal
          (this page is filter-driven and gets adjusted often) but fully
          hidden when closed so it costs no space. Shares the same draft/
          Apply flow as the header's main filters — one Apply covers both. */}
      {filtersOpen && (
        <Card className="border-slate-200 gap-0! py-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="h-3.5 w-3.5" /> Advanced Filters
              </CardTitle>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                Hide <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3 pt-1">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              {advancedFilterFields.map(({ key, label, list, nameKey }) => (
                <div className="space-y-1" key={key}>
                  <Label className="text-xs font-medium text-slate-500">
                    {label}
                  </Label>
                  <Select
                    value={draftFilters[key]}
                    onValueChange={setDraftFilter(key)}
                  >
                    <SelectTrigger size="sm" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ALL}>All {label}s</SelectItem>
                      {list.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item[nameKey]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">
                  Airline
                </Label>
                <Select
                  value={draftFilters.airlineCode}
                  onValueChange={setDraftFilter("airlineCode")}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All Airlines</SelectItem>
                    {airlines.map((a) => (
                      <SelectItem
                        key={a.id}
                        value={a.airlineCode || a.iataName}
                      >
                        {a.airlineName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">
                  Payment Status
                </Label>
                <Select
                  value={draftFilters.paymentStatus}
                  onValueChange={setDraftFilter("paymentStatus")}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All Payment Status</SelectItem>
                    {PAYMENT_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">
                  Sale Status
                </Label>
                <Select
                  value={draftFilters.saleStatus}
                  onValueChange={setDraftFilter("saleStatus")}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All Sale Status</SelectItem>
                    {SALE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium text-slate-500">
                  Payment Method
                </Label>
                <Select
                  value={draftFilters.paymentMethod}
                  onValueChange={setDraftFilter("paymentMethod")}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All Methods</SelectItem>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-1.5">
                {advancedFilterFields.map(({ key, label, list, nameKey }) => (
                  <ChipFilter
                    key={key}
                    label={`${label}: ${list.find((x) => x.id === draftFilters[key])?.[nameKey]}`}
                    active={draftFilters[key] !== ALL}
                    onClear={() => setDraftFilter(key)(ALL)}
                  />
                ))}
                <ChipFilter
                  label={`Airline: ${draftFilters.airlineCode}`}
                  active={draftFilters.airlineCode !== ALL}
                  onClear={() => setDraftFilter("airlineCode")(ALL)}
                />
                <ChipFilter
                  label={`Payment: ${draftFilters.paymentStatus}`}
                  active={draftFilters.paymentStatus !== ALL}
                  onClear={() => setDraftFilter("paymentStatus")(ALL)}
                />
                <ChipFilter
                  label={`Status: ${draftFilters.saleStatus}`}
                  active={draftFilters.saleStatus !== ALL}
                  onClear={() => setDraftFilter("saleStatus")(ALL)}
                />
                <ChipFilter
                  label={`Method: ${draftFilters.paymentMethod}`}
                  active={draftFilters.paymentMethod !== ALL}
                  onClear={() => setDraftFilter("paymentMethod")(ALL)}
                />
                {hasActiveAdvancedFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAdvancedFilters}
                    className="text-slate-500 h-7"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                onClick={applyFilters}
                className="relative gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              >
                <Check className="h-3.5 w-3.5" /> Apply Filters
                {isDirty && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white animate-pulse" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards — driven entirely by backend `totals`, no client-side recompute */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
        {loading && !totals ? (
          Array.from({ length: 8 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              label="Total Sales"
              value={money(t.totalSellPrice)}
              sub={`${t.salesCount || 0} transactions`}
              icon={TrendingUp}
              tone="indigo"
              trend="up"
            />
            <KpiCard
              label="Total Net Sales"
              value={money(t.totalNetPrice)}
              sub={`${t.salesCount || 0} transactions`}
              icon={TrendingUp}
              tone="indigo"
              trend="up"
            />
            <KpiCard
              label="Total Sales Profit"
              value={money(t.totalProfit)}
              sub={`Avg ${money(t.avgSaleValue)}/sale`}
              icon={Wallet}
              tone="emerald"
              trend="up"
            />
            <KpiCard
              label="Total VAT"
              value={money(t.totalVat)}
              sub={`Pax ${money(t.totalPaxVat)} · Other ${money(t.totalVatAmount)} (informational)`}
              icon={Percent}
              tone="sky"
            />
            <KpiCard
              label="Cancellation Charges"
              value={money(t.totalCancellationCharges)}
              sub="Added to profit"
              icon={Undo2}
              tone="amber"
              trend="up"
            />
            <KpiCard
              label="Total Expenses"
              value={money(t.totalExpenses)}
              sub={`${t.expensesCount || 0} records`}
              icon={Receipt}
              tone="rose"
              trend="down"
            />
            <KpiCard
              label="Net Revenue"
              value={money(t.netRevenue)}
              sub="Profit + Cancellation − Expenses"
              icon={Landmark}
              tone={t.netRevenue >= 0 ? "emerald" : "rose"}
              trend={t.netRevenue >= 0 ? "up" : "down"}
            />
            <KpiCard
              label="Outstanding Due"
              value={money(t.outstandingDue)}
              sub="Across due & partial sales"
              icon={Wallet}
              tone="rose"
            />
            <KpiCard
              label="Refunded to Customers"
              value={money(t.totalRefundedToCustomers)}
              sub={`${t.refundsCount || 0} refunds (informational)`}
              icon={Undo2}
              tone="slate"
            />
          </>
        )}
      </div>

      {/* Full row-level detail — sales / refunds / expenses, searchable & paginated */}
      <ReportDetailTables
        sales={sales}
        refunds={refunds}
        expenses={expenses}
        loading={loading}
      />

      {/* Trend chart */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>
            Sales, profit, refunds & expenses over the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
              Loading...
            </div>
          ) : trendData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis dataKey="key" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#94a3b8"
                  tickFormatter={compact}
                />
                <Tooltip
                  formatter={(v) => money(v)}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="#6366f1"
                  fill="url(#salesGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  name="Profit"
                  stroke="#10b981"
                  fill="url(#profitGrad)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="refunds"
                  name="Refunds"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Secondary charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Payment Methods</CardTitle>
            <CardDescription>Revenue share by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentMethodData.length === 0 ? (
              <EmptyChart label="No sales in range" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {paymentMethodData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Expenses by Category</CardTitle>
            <CardDescription>Where operating costs are going</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategoryData.length === 0 ? (
              <EmptyChart label="No expenses in range" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={expenseCategoryData}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={compact}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    width={90}
                  />
                  <Tooltip formatter={(v) => money(v)} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {expenseCategoryData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Sale Status Breakdown</CardTitle>
            <CardDescription>
              Count of sales by lifecycle status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {saleStatusData.length === 0 ? (
              <EmptyChart label="No sales in range" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={saleStatusData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label
                  >
                    {saleStatusData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[(i + 3) % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} sales`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top vendors / customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          {
            title: "Top Vendors",
            icon: Store,
            data: topVendors,
            valueLabel: "Sales",
          },
          {
            title: "Top Customers",
            icon: Users2,
            data: topCustomers,
            valueLabel: "Total Spend",
          },
        ].map(({ title, icon: Icon, data, valueLabel }) => (
          <Card className="border-slate-200" key={title}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Icon className="h-4 w-4" /> {title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.length === 0 ? (
                <EmptyChart label="No sales in range" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="text-right">{valueLabel}</TableHead>
                      <TableHead className="text-right">Txns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="font-medium">
                          {row.name === "Walk-in Customer" ? (
                            <span className="italic text-slate-500">
                              {row.name}
                            </span>
                          ) : (
                            row.name
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {money(row.value)}
                        </TableCell>
                        <TableCell className="text-right text-slate-400">
                          {row.count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Agent performance */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Agent Performance</CardTitle>
          <CardDescription>Sales performance by staff member</CardDescription>
        </CardHeader>
        <CardContent>
          {agentPerformance.length === 0 ? (
            <EmptyChart label="No sales in range" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Sales</TableHead>
                  <TableHead className="text-right">Txns</TableHead>
                  <TableHead className="text-right">Avg. Sale</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agentPerformance.map((a) => (
                  <TableRow key={a.name}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="text-right">
                      {money(a.value)}
                    </TableCell>
                    <TableCell className="text-right text-slate-400">
                      {a.count}
                    </TableCell>
                    <TableCell className="text-right text-slate-400">
                      {money(a.count ? a.value / a.count : 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
