"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInCalendarDays,
} from "date-fns";
import {
  CalendarIcon,
  Download,
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
import { Calendar } from "../../shadcn/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../shadcn/components/ui/popover";
import RangeCalendar from "./DragCalendar";
import ReportDetailTables from "../components/Reportdetailtables";
import { money, compact, getLocalTimeZone, downloadCsv } from "../utils/reportUtils";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const DATE_PRESETS = [
  ["allTime", "All time"],
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["last7days", "Last 7 days"],
  ["last30days", "Last 30 days"],
  ["thisMonth", "This month"],
  ["thisYear", "This year"],
];
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
    <Card className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums truncate">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-400 flex items-center gap-1">
              {trend === "up" && (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="h-3 w-3 text-rose-500" />
              )}
              {sub}
            </p>
          )}
        </div>
        <div
          className={`p-2.5 rounded-xl shadow-sm bg-gradient-to-br ${toneMap[tone]} shrink-0`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
      </CardContent>
    </Card>
  );
}

const KpiSkeleton = () => (
  <Card className="border-slate-100 shadow-sm">
    <CardContent className="p-5 flex items-start justify-between">
      <div className="space-y-2 w-full">
        <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
        <div className="h-6 w-28 rounded bg-slate-100 animate-pulse" />
        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
      </div>
      <div className="h-10 w-10 rounded-xl bg-slate-100 animate-pulse shrink-0" />
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

  // allTime=true means "no date filter" — the API is asked for the
  // complete, all-time report. dateRange is still kept around so the
  // calendar has something sane to show if the user switches back.
  const [allTime, setAllTime] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [filters, setFilters] = useState({
    branchId: ALL,
    vendorId: ALL,
    customerId: ALL,
    airlineCode: ALL,
    agentId: ALL,
    paymentStatus: ALL,
    saleStatus: ALL,
    paymentMethod: ALL,
  });
  const setFilter = (key) => (val) => setFilters((f) => ({ ...f, [key]: val }));

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

  const handleDatePreset = (preset) => {
    if (preset === "allTime") {
      setAllTime(true);
      return;
    }
    const now = new Date();
    const map = {
      today: { from: now, to: now },
      yesterday: { from: subDays(now, 1), to: subDays(now, 1) },
      last7days: { from: subDays(now, 6), to: now },
      last30days: { from: subDays(now, 29), to: now },
      thisMonth: { from: startOfMonth(now), to: endOfMonth(now) },
      thisYear: { from: startOfYear(now), to: endOfYear(now) },
    };
    if (map[preset]) {
      setAllTime(false);
      setDateRange(map[preset]);
    }
  };

  const handleRangeSelect = (range) => {
    setAllTime(false);
    setDateRange(range);
  };

  // ── Single server-side fetch — filtering & profit math both happen in the API ──
  const fetchData = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ timeZone });
        if (!allTime) {
          params.set("dateFrom", format(dateRange.from, "yyyy-MM-dd"));
          params.set("dateTo", format(dateRange.to, "yyyy-MM-dd"));
        }
        Object.entries(filters).forEach(
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
    [dateRange, filters, allTime, timeZone],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Trend chart (day or month buckets depending on range length) ──
  const trendData = useMemo(() => {
    const byMonth = allTime || differenceInCalendarDays(dateRange.to, dateRange.from) > 62;
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
  }, [sales, refunds, expenses, dateRange, allTime]);

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

  const hasActiveFilters = Object.values(filters).some((v) => v !== ALL);
  const clearFilters = () =>
    setFilters({
      branchId: ALL,
      vendorId: ALL,
      customerId: ALL,
      airlineCode: ALL,
      agentId: ALL,
      paymentStatus: ALL,
      saleStatus: ALL,
      paymentMethod: ALL,
    });

  const exportCsv = () => {
    const headers = [
      "Date",
      "Invoice #",
      "Airline",
      "Vendor",
      "Customer",
      "Agent",
      "Method",
      "Payment Status",
      "Status",
      "Net",
      "Sell",
      "VAT",
      "Profit",
    ];
    const rows = sales.map((s) => [
      s.date ? format(new Date(s.date), "yyyy-MM-dd") : "",
      s.invoiceNumber,
      s.airline,
      s.vendor,
      s.customer || "Walk-in",
      s.agent,
      s.paymentMethod,
      s.paymentStatus,
      s.status,
      s.netPrice?.toFixed(2),
      s.sellPrice?.toFixed(2),
      s.vatTotal?.toFixed(2),
      s.profit?.toFixed(2),
    ]);
    const suffix = allTime
      ? "all-time"
      : `${format(dateRange.from, "yyyyMMdd")}-${format(dateRange.to, "yyyyMMdd")}`;
    downloadCsv(`report-${suffix}.csv`, headers, rows);
  };

  const t = totals || {};

  const filterFields = [
    { key: "branchId", label: "Branch", list: branches, nameKey: "name" },
    { key: "vendorId", label: "Vendor", list: vendors, nameKey: "vendorName" },
    {
      key: "customerId",
      label: "Customer",
      list: customers,
      nameKey: "customerName",
    },
    { key: "agentId", label: "Agent", list: users, nameKey: "fullName" },
  ];

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
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />{" "}
            Refresh
          </Button>
          <Button
            onClick={exportCsv}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Filters */}
      <Card className="border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Date Range</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {allTime
                      ? "All time"
                      : `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 border-b grid grid-cols-2 gap-2">
                    {DATE_PRESETS.map(([key, label]) => (
                      <Button
                        key={key}
                        variant="ghost"
                        size="sm"
                        className={
                          (key === "allTime" && allTime)
                            ? "bg-indigo-50 text-indigo-700"
                            : ""
                        }
                        onClick={() => handleDatePreset(key)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  {/* Click-to-select range: 1st click = start date, hover previews
          the range line, 2nd click = end date. Picking a range always
          switches out of "All time" mode. */}
                  <RangeCalendar
                    defaultMonth={dateRange.from}
                    selected={dateRange}
                    onSelect={handleRangeSelect}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {filterFields.map(({ key, label, list, nameKey }) => (
              <div className="space-y-2" key={key}>
                <Label>{label}</Label>
                <Select value={filters[key]} onValueChange={setFilter(key)}>
                  <SelectTrigger className="w-full">
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

            <div className="space-y-2">
              <Label>Airline</Label>
              <Select
                value={filters.airlineCode}
                onValueChange={setFilter("airlineCode")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All Airlines</SelectItem>
                  {airlines.map((a) => (
                    <SelectItem key={a.id} value={a.airlineCode || a.iataName}>
                      {a.airlineName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select
                value={filters.paymentStatus}
                onValueChange={setFilter("paymentStatus")}
              >
                <SelectTrigger className="w-full">
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
            <div className="space-y-2">
              <Label>Sale Status</Label>
              <Select
                value={filters.saleStatus}
                onValueChange={setFilter("saleStatus")}
              >
                <SelectTrigger className="w-full">
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
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={filters.paymentMethod}
                onValueChange={setFilter("paymentMethod")}
              >
                <SelectTrigger className="w-full">
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

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {filterFields.map(({ key, label, list, nameKey }) => (
                <ChipFilter
                  key={key}
                  label={`${label}: ${list.find((x) => x.id === filters[key])?.[nameKey]}`}
                  active={filters[key] !== ALL}
                  onClear={() => setFilter(key)(ALL)}
                />
              ))}
              <ChipFilter
                label={`Airline: ${filters.airlineCode}`}
                active={filters.airlineCode !== ALL}
                onClear={() => setFilter("airlineCode")(ALL)}
              />
              <ChipFilter
                label={`Payment: ${filters.paymentStatus}`}
                active={filters.paymentStatus !== ALL}
                onClear={() => setFilter("paymentStatus")(ALL)}
              />
              <ChipFilter
                label={`Status: ${filters.saleStatus}`}
                active={filters.saleStatus !== ALL}
                onClear={() => setFilter("saleStatus")(ALL)}
              />
              <ChipFilter
                label={`Method: ${filters.paymentMethod}`}
                active={filters.paymentMethod !== ALL}
                onClear={() => setFilter("paymentMethod")(ALL)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-slate-500 h-7"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards — driven entirely by backend `totals`, no client-side recompute */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              label="Total Profit"
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

      {/* Full row-level detail — sales / refunds / expenses, searchable & paginated */}
      <ReportDetailTables
        sales={sales}
        refunds={refunds}
        expenses={expenses}
        loading={loading}
      />
    </div>
  );
}